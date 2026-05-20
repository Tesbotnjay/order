import { create } from 'zustand';

const ADMIN_SESSION_KEY = 'admin_session';

interface AdminSession {
  token: string;
  expiresAt: number;
}

interface AdminState {
  token: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  setSession: (token: string, expiresAt: number) => void;
  clearSession: () => void;
  checkSession: () => boolean;
}

function loadSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed: AdminSession = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const existing = loadSession();

export const useAdminStore = create<AdminState>((set, get) => ({
  token: existing?.token ?? null,
  expiresAt: existing?.expiresAt ?? null,
  isAuthenticated: existing !== null,

  setSession: (token, expiresAt) => {
    const session: AdminSession = { token, expiresAt };
    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    set({ token, expiresAt, isAuthenticated: true });
  },

  clearSession: () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    set({ token: null, expiresAt: null, isAuthenticated: false });
  },

  checkSession: () => {
    const { expiresAt } = get();
    if (!expiresAt || Date.now() > expiresAt) {
      get().clearSession();
      return false;
    }
    return true;
  },
}));
