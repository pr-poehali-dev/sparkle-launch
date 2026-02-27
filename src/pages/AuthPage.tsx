import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { MeshGradient, WaitlistWrapper } from '@/components/waitlist';
import { useAuth } from '@/context/AuthContext';
import { login, register } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(email, password);
      localStorage.setItem('session_token', data.token);
      setUser({ id: data.id, email: data.email, is_admin: data.is_admin });
      navigate(data.is_admin ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="antialiased max-w-screen min-h-svh bg-slate-1 text-slate-12">
        <MeshGradient
          colors={['#001c80', '#1ac7ff', '#04ffb1', '#ff1ff1']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%' }}
        />
        <div className="max-w-screen-sm mx-auto w-full relative z-[1] flex flex-col min-h-screen items-center justify-center px-5">
          <WaitlistWrapper
            logo={{ src: '/logo.svg', alt: 'Launchpad' }}
            copyright="При поддержке"
            copyrightLink={{ text: 'Ваша компания', href: '#' }}
            showThemeSwitcher={true}
          >
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-medium text-slate-12">
                {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
              </h1>
              <p className="text-slate-10 tracking-tight text-pretty">
                {mode === 'login'
                  ? 'Войдите, чтобы отправить обращение'
                  : 'Создайте аккаунт для отправки обращений'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full px-1">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  'w-full text-sm px-4 py-2 h-11 bg-gray-11/5 rounded-full text-gray-12',
                  'placeholder:text-gray-9 border border-gray-11/10',
                  'focus:outline-none focus:ring-2 focus:ring-gray-12/20'
                )}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={cn(
                  'w-full text-sm px-4 py-2 h-11 bg-gray-11/5 rounded-full text-gray-12',
                  'placeholder:text-gray-9 border border-gray-11/10',
                  'focus:outline-none focus:ring-2 focus:ring-gray-12/20'
                )}
              />
              {error && <p className="text-xs text-red-500 px-2">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-4 bg-gray-12 text-gray-1 text-sm rounded-full font-medium disabled:opacity-60 transition-opacity"
              >
                {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            <p className="text-sm text-slate-10 pb-2">
              {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="underline text-slate-12 font-medium"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </WaitlistWrapper>
        </div>
      </div>
    </ThemeProvider>
  );
}
