const AUTH_URL = 'https://functions.poehali.dev/91e0e1d8-f30c-44fa-8d75-9f5bd58a991a';
const MESSAGES_URL = 'https://functions.poehali.dev/46dae8ae-6b92-4dc4-ac51-32563894b026';

function getToken(): string {
  return localStorage.getItem('session_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Session-Token': getToken(),
  };
}

export async function register(email: string, password: string) {
  const res = await fetch(`${AUTH_URL}?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${AUTH_URL}?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  return data;
}

export async function logout() {
  await fetch(`${AUTH_URL}?action=logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  localStorage.removeItem('session_token');
  localStorage.removeItem('user');
}

export async function getMe() {
  const res = await fetch(`${AUTH_URL}?action=me`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function sendMessage(subject: string, body: string) {
  const res = await fetch(`${MESSAGES_URL}?action=send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ subject, body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка отправки');
  return data;
}

export async function getMyMessages() {
  const res = await fetch(`${MESSAGES_URL}?action=my`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.messages;
}

export async function getAdminMessages() {
  const res = await fetch(`${MESSAGES_URL}?action=admin_list`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.messages;
}

export async function adminReply(message_id: number, reply: string) {
  const res = await fetch(`${MESSAGES_URL}?action=admin_reply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message_id, reply }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка ответа');
  return data;
}
