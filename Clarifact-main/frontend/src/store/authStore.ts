import { create } from 'zustand';
import type { AuthState, User } from '@/types';
import { loginUser, registerUser, getMe, logoutUser } from '@/services/api';

// Map backend user → frontend User shape
function mapUser(backendUser: any): User {
  return {
    id: backendUser.id,
    name: backendUser.profile?.name || backendUser.email?.split('@')[0] || 'User',
    email: backendUser.email,
    avatar: undefined,
    role: backendUser.role || 'user',
    trustScore: backendUser.trustScores?.[0]?.score
      ? Math.round(backendUser.trustScores[0].score * 100)
      : 50,
    claimsChecked: backendUser._count?.claims || backendUser.claims?.length || 0,
    joinedAt: backendUser.createdAt || new Date().toISOString(),
    badges: (backendUser.badges || []).map((b: any) => ({
      id: b.badge?.id || b.id,
      name: b.badge?.name || b.name || 'Badge',
      icon: (b.badge?.code || b.code) === 'community-verified' ? '✅' : '🏅',
      description: b.badge?.description || b.description || '',
    })),
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('clarifact-token'),
  isAuthenticated: !!localStorage.getItem('clarifact-token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await loginUser(email, password);
      const token = data.token;
      localStorage.setItem('clarifact-token', token);
      set({
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      // Fetch full user profile
      try {
        const meData = await getMe();
        set({ user: mapUser(meData.user) });
      } catch {
        // Token worked but /me failed — set basic user
        set({
          user: {
            id: data.user?.id || '',
            name: email.split('@')[0],
            email,
            role: data.user?.role || 'user',
            trustScore: 50,
            claimsChecked: 0,
            joinedAt: new Date().toISOString(),
            badges: [],
          },
        });
      }
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await registerUser(email, password);
      const token = data.token;
      localStorage.setItem('clarifact-token', token);
      set({
        user: {
          id: data.user?.id || '',
          name: name || email.split('@')[0],
          email,
          role: 'user',
          trustScore: 50,
          claimsChecked: 0,
          joinedAt: new Date().toISOString(),
          badges: [],
        },
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch {
      // Logout is best-effort (JWT is stateless)
    }
    localStorage.removeItem('clarifact-token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// ─── Hydrate user on app load if token exists ───
const token = localStorage.getItem('clarifact-token');
if (token) {
  getMe()
    .then((data) => {
      useAuthStore.setState({ user: mapUser(data.user) });
    })
    .catch(() => {
      // Token is invalid — clear it
      localStorage.removeItem('clarifact-token');
      useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
    });
}
