import { create } from 'zustand';
import { clearBuyerToken, getBuyerToken } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  restore: async () => {
    const token = getBuyerToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = (await res.json()) as { data: AuthUser };
        set({ user: body.data, isLoading: false });
      } else {
        clearBuyerToken();
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const token = getBuyerToken();
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearBuyerToken();
    set({ user: null });
  },
}));
