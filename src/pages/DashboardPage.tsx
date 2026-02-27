import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { MeshGradient, WaitlistWrapper } from '@/components/waitlist';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, getMyMessages } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  subject: string;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'send' | 'history'>('send');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (user.is_admin) { navigate('/admin'); return; }
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    try {
      const msgs = await getMyMessages();
      setMessages(msgs);
    } catch (_e) {
      // ignore
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await sendMessage(subject, body);
      setSuccess(true);
      setSubject('');
      setBody('');
      setTimeout(() => setSuccess(false), 3000);
      loadMessages();
      setTab('history');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="antialiased max-w-screen min-h-svh bg-slate-1 text-slate-12">
        <MeshGradient
          colors={['#001c80', '#1ac7ff', '#04ffb1', '#ff1ff1']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%' }}
        />
        <div className="max-w-screen-sm mx-auto w-full relative z-[1] flex flex-col min-h-screen items-center justify-center px-5 py-10">
          <WaitlistWrapper
            logo={{ src: '/logo.svg', alt: 'Launchpad' }}
            showThemeSwitcher={true}
            hideCopyright={true}
          >
            <div className="flex items-center justify-between w-full">
              <div className="space-y-0.5 text-left">
                <h1 className="text-xl font-medium text-slate-12">Личный кабинет</h1>
                <p className="text-xs text-slate-10">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-10 hover:text-slate-12 transition-colors"
              >
                <Icon name="LogOut" size={14} />
                Выйти
              </button>
            </div>

            <div className="flex w-full gap-1 bg-gray-11/5 rounded-full p-1">
              {(['send', 'history'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 text-sm py-1.5 rounded-full transition-colors',
                    tab === t ? 'bg-gray-12 text-gray-1' : 'text-slate-10 hover:text-slate-12'
                  )}
                >
                  {t === 'send' ? 'Новое обращение' : 'Мои обращения'}
                </button>
              ))}
            </div>

            {tab === 'send' && (
              <form onSubmit={handleSend} className="flex flex-col gap-3 w-full px-1">
                <input
                  type="text"
                  placeholder="Тема обращения"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className={cn(
                    'w-full text-sm px-4 py-2 h-11 bg-gray-11/5 rounded-full text-gray-12',
                    'placeholder:text-gray-9 border border-gray-11/10',
                    'focus:outline-none focus:ring-2 focus:ring-gray-12/20'
                  )}
                />
                <textarea
                  placeholder="Текст вашего обращения..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  className={cn(
                    'w-full text-sm px-4 py-3 bg-gray-11/5 rounded-2xl text-gray-12',
                    'placeholder:text-gray-9 border border-gray-11/10 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-gray-12/20'
                  )}
                />
                {error && <p className="text-xs text-red-500 px-2">{error}</p>}
                {success && <p className="text-xs text-green-500 px-2">Обращение отправлено!</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="h-11 px-4 bg-gray-12 text-gray-1 text-sm rounded-full font-medium disabled:opacity-60 transition-opacity"
                >
                  {sending ? 'Отправка...' : 'Отправить обращение'}
                </button>
              </form>
            )}

            {tab === 'history' && (
              <div className="flex flex-col gap-3 w-full px-1 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-10 text-center py-4">Обращений пока нет</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-11/5 rounded-2xl p-4 text-left border border-gray-11/10">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-12 truncate">{msg.subject}</p>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full shrink-0',
                          msg.status === 'answered' ? 'bg-green-500/15 text-green-600' : 'bg-gray-11/10 text-slate-10'
                        )}>
                          {msg.status === 'answered' ? 'Отвечено' : 'Новое'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-10 mb-2">{formatDate(msg.created_at)}</p>
                      <p className="text-sm text-slate-11 line-clamp-2">{msg.body}</p>
                      {msg.admin_reply && (
                        <div className="mt-3 pt-3 border-t border-gray-11/10">
                          <p className="text-xs text-slate-10 mb-1">Ответ администратора:</p>
                          <p className="text-sm text-slate-12">{msg.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </WaitlistWrapper>
        </div>
      </div>
    </ThemeProvider>
  );
}