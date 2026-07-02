import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: { name: string };
  shop_id: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('erp_user') || 'null'),
  token: localStorage.getItem('erp_token'),
  setAuth: (user, token) => {
    localStorage.setItem('erp_user', JSON.stringify(user));
    localStorage.setItem('erp_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_token');
    set({ user: null, token: null });
  },
}));
