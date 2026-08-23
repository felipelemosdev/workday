// Cliente local que substitui o SDK do base44.
// Mantém a mesma "forma" (base44.entities.X.*, base44.auth.*) usada em todo
// o app para que as páginas não precisassem ser reescritas uma a uma.
// Os dados ficam salvos localmente no navegador via IndexedDB (src/lib/db.js).

import { createCollection } from '@/lib/db';
import { localAuth } from '@/lib/localAuth';

export const base44 = {
  entities: {
    Client: createCollection('clients'),
    Appointment: createCollection('appointments'),
    Attendance: createCollection('attendances'),
    Task: createCollection('tasks'),
    Process: createCollection('processes'),
    Document: createCollection('documents'),
    HistoryEvent: createCollection('history_events'),
    User: createCollection('users'),
  },

  auth: {
    loginViaEmailPassword: (email, password) => localAuth.loginViaEmailPassword(email, password),
    register: (data) => localAuth.register(data),
    me: () => localAuth.me(),
    isAuthenticated: () => localAuth.isAuthenticated(),
    logout: () => localAuth.logout(),
    resetPasswordRequest: (email) => localAuth.resetPasswordRequest(email),
    resetPassword: (data) => localAuth.resetPassword(data),
    redirectToLogin: (returnTo) => {
      const encoded = encodeURIComponent(returnTo || window.location.href);
      window.location.href = `/login?returnTo=${encoded}`;
    },
  },

  users: {
    inviteUser: async (email, role) => {
      // Sem servidor de e-mail no modo local: cria a conta diretamente com
      // uma senha temporária que o admin deve repassar ao novo usuário.
      const tempPassword = Math.random().toString(36).slice(-10);
      await localAuth.createUser({ email, password: tempPassword, role });
      return { email, tempPassword };
    },
    list: () => localAuth.listUsers(),
  },
};
