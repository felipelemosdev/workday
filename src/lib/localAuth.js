// Autenticação local (substitui base44.auth). Sem servidor: usuários e senhas
// (com hash) ficam salvos no IndexedDB do próprio navegador. A sessão ativa
// fica em localStorage apontando para o id do usuário logado.

import { getAllFromStore, withStore, uuid } from '@/lib/db';

const SESSION_KEY = 'workday_session_user_id';

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password, salt) {
  return sha256(`${salt}:${password}`);
}

async function findUserByEmail(email) {
  const users = await getAllFromStore('users');
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, salt, ...rest } = user;
  return rest;
}

export const localAuth = {
  async register({ email, password, role = 'admin' }) {
    const existing = await findUserByEmail(email);
    if (existing) throw new Error('Já existe uma conta com esse e-mail.');
    const salt = randomSalt();
    const password_hash = await hashPassword(password, salt);
    const now = new Date().toISOString();
    const user = {
      id: uuid(),
      email: email.trim().toLowerCase(),
      role,
      salt,
      password_hash,
      created_date: now,
      updated_date: now,
    };
    await withStore('users', 'readwrite', (store) => store.put(user));
    localStorage.setItem(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async createUser({ email, password, role = 'user' }) {
    // Usado pelo fluxo de "adicionar usuário" (substitui o convite por e-mail).
    return this.register({ email, password, role });
  },

  async loginViaEmailPassword(email, password) {
    const user = await findUserByEmail(email);
    if (!user) throw new Error('E-mail ou senha inválidos.');
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.password_hash) throw new Error('E-mail ou senha inválidos.');
    localStorage.setItem(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async me() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) throw new Error('Não autenticado');
    const users = await getAllFromStore('users');
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('Não autenticado');
    return publicUser(user);
  },

  async isAuthenticated() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  async resetPasswordRequest(email) {
    const user = await findUserByEmail(email);
    if (!user) return { sent: false };
    const token = uuid();
    const reset = {
      id: token,
      user_id: user.id,
      expires: Date.now() + 1000 * 60 * 30, // 30 minutos
    };
    await withStore('password_resets', 'readwrite', (store) => store.put(reset));
    // Não há servidor de e-mail no modo local: devolvemos o token para a
    // própria página exibir o link de redefinição.
    return { sent: true, token };
  },

  async resetPassword({ resetToken, newPassword }) {
    const resets = await getAllFromStore('password_resets');
    const reset = resets.find((r) => r.id === resetToken);
    if (!reset || reset.expires < Date.now()) {
      throw new Error('Link de redefinição inválido ou expirado.');
    }
    const users = await getAllFromStore('users');
    const user = users.find((u) => u.id === reset.user_id);
    if (!user) throw new Error('Usuário não encontrado.');
    const salt = randomSalt();
    const password_hash = await hashPassword(newPassword, salt);
    const updated = { ...user, salt, password_hash, updated_date: new Date().toISOString() };
    await withStore('users', 'readwrite', (store) => store.put(updated));
    await withStore('password_resets', 'readwrite', (store) => store.delete(reset.id));
    return { success: true };
  },

  async listUsers() {
    const users = await getAllFromStore('users');
    return users.map(publicUser);
  },
};
