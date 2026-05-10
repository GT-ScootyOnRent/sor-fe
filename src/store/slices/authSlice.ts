import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  cityId?: number;
  userType: 'user' | 'admin' | 'superadmin';
}

interface AuthState {
  user: User | null;
  token: string | null;  // Keep for backward compat, but cookies are primary
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// User info still stored in localStorage for UI persistence
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: null, // Tokens now in HttpOnly cookies
  refreshToken: null,
  isAuthenticated: !!storedUser, // Based on user presence
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token?: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token ?? null; // Optional - cookies are primary
      state.refreshToken = action.payload.refreshToken ?? null;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store user info for UI persistence (tokens in HttpOnly cookies)
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('userId', action.payload.user.id.toString());
      // Also store token for immediate API calls after fresh login
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      if (action.payload.user.name) {
        localStorage.setItem('userName', action.payload.user.name);
      }
      if (action.payload.user.phone) {
        localStorage.setItem('userPhone', action.payload.user.phone);
      }
      if (action.payload.user.email) {
        localStorage.setItem('userEmail', action.payload.user.email);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage (cookies cleared by server on /api/Auth/logout)
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken'); // Legacy cleanup
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
