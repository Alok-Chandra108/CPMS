import { createSlice } from '@reduxjs/toolkit';

// Safe helper to check for previous login session hint in localStorage
const hasSessionHint = () => {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('hasSession') === 'true';
  } catch {
    return false;
  }
};

const initialState = {
  user: null,
  accessToken: null,
  role: null,
  isAuthenticated: false,
  // If no prior session hint exists, initialize immediately (0ms) so public pages like /login load instantly
  isInitialized: !hasSessionHint(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.role = user?.role || null;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.loading = false;
      state.error = null;
      try {
        localStorage.setItem('hasSession', 'true');
      } catch {
        // Ignore quota/storage errors in restrictive environments
      }
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.loading = false;
      state.error = null;
      try {
        localStorage.removeItem('hasSession');
      } catch {
        // Ignore storage errors
      }
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCredentials, setAccessToken, clearCredentials, setInitialized, setLoading, setError } =
  authSlice.actions;

export default authSlice.reducer;
