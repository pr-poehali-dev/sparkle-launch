import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { MeshGradient, WaitlistWrapper } from '@/components/waitlist';
import { useAuth } from '@/context/AuthContext';
import { getAdminMessages, adminReply } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  user_email: string;
  subject: string;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!user.is_admin) { navigate('/dashboard'); return; }
    loadMessages();
  }, [user, navigate]);

  const loadMessages = async () => {
    try {
      const msgs = await getAdminMessages();
      setMessages(msgs);
    } catch (_e) {
      // ignore
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    try {
      await adminReply(selected.id, reply);
      setReplySuccess(true);
      setReply('');
      setTimeout(() => setReplySuccess(false), 2000);
      await loadMessages();
      const updated = messages.find((m) => m.id === selected.id);
      if (updated) setSelected({ ...updated, admin_reply: reply, status: 'answered' });
    } catch (_e) {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="antialiased max-w-screen min-h-svh bg-slate-1 text-slate-12">
        <MeshGradient
          colors={['#001c80', '#1ac7ff', '#04ffb1', '#ff1ff1']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%' }}
        />
        <div className="max-w-2xl mx-auto w-full relative z-[1] flex flex-col min-h-screen items-center justify-start px-5 py-10">
          <div className="w-full bg-gray-1/85 rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-11/10">
              <div>
                <h1 className="text-lg font-medium text-slate-12">Панель администратора</h1>
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

            <div className="flex flex-col md:flex-row" style={{ minHeight: 480 }}>
              <div className="md:w-2/5 border-r border-gray-11/10 overflow-y-auto max-h-[480px]">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-10 text-center py-8">Обращений нет</p>
                ) : (
                  messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => { setSelected(msg); setReply(''); setReplySuccess(false); }}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-gray-11/10 hover:bg-gray-11/5 transition-colors',
                        selected?.id === msg.id && 'bg-gray-11/10'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-medium text-slate-12 truncate">{msg.user_email}</p>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full shrink-0',
                          msg.status === 'answered' ? 'bg-green-500/15 text-green-600' : 'bg-blue-500/15 text-blue-600'
                        )}>
                          {msg.status === 'answered' ? '✓' : 'Новое'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-11 truncate">{msg.subject}</p>
                      <p className="text-xs text-slate-10 mt-0.5">{formatDate(msg.created_at)}</p>
                    </button>
                  ))
                )}
              </div>

              <div className="flex-1 flex flex-col p-5">
                {!selected ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-10">Выберите обращение</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-xs text-slate-10 mb-1">{selected.user_email} · {formatDate(selected.created_at)}</p>
                      <h2 className="text-base font-medium text-slate-12 mb-2">{selected.subject}</h2>
                      <p className="text-sm text-slate-11 whitespace-pre-wrap">{selected.body}</p>
                    </div>

                    {selected.admin_reply && (
                      <div className="mb-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                        <p className="text-xs text-green-600 mb-1">Ваш ответ отправлен:</p>
                        <p className="text-sm text-slate-12 whitespace-pre-wrap">{selected.admin_reply}</p>
                      </div>
                    )}

                    <form onSubmit={handleReply} className="mt-auto flex flex-col gap-2">
                      <textarea
                        placeholder="Напишите ответ пользователю..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        required
                        rows={3}
                        className={cn(
                          'w-full text-sm px-4 py-3 bg-gray-11/5 rounded-2xl text-gray-12',
                          'placeholder:text-gray-9 border border-gray-11/10 resize-none',
                          'focus:outline-none focus:ring-2 focus:ring-gray-12/20'
                        )}
                      />
                      {replySuccess && <p className="text-xs text-green-500">Ответ отправлен!</p>}
                      <button
                        type="submit"
                        disabled={sending}
                        className="h-10 px-4 bg-gray-12 text-gray-1 text-sm rounded-full font-medium disabled:opacity-60 transition-opacity"
                      >
                        {sending ? 'Отправка...' : 'Отправить ответ'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
