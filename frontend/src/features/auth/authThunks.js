import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser as loginApi, logoutUser as logoutApi, refreshToken as refreshApi } from '../../api/authApi';
import { setCredentials, clearCredentials, setAccessToken } from './authSlice';
import { clearProfileState } from '../profile/profileSlice';
import { clearApplications } from '../applications/applicationSlice';
import { clearDrives } from '../drives/driveSlice';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await loginApi(credentials);
      // Clear any previous user's profile/application/drive state before
      // setting new credentials — prevents cross-user data bleed in Redux.
      dispatch(clearProfileState());
      dispatch(clearApplications());
      dispatch(clearDrives());
      dispatch(
        setCredentials({
          user: data.data.user,
          accessToken: data.data.accessToken,
          // refreshToken is stored in httpOnly cookie by backend
        })
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Login failed' }
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await logoutApi();
      dispatch(clearCredentials());
      dispatch(clearProfileState());
      dispatch(clearApplications());
      dispatch(clearDrives());
    } catch (error) {
      // Clear credentials even if API call fails
      dispatch(clearCredentials());
      dispatch(clearProfileState());
      dispatch(clearApplications());
      dispatch(clearDrives());
      return rejectWithValue(
        error.response?.data || { message: 'Logout failed' }
      );
    }
  }
);

// Helper: wait for ms milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: attempt refresh with retries (handles Render.com cold starts)
const attemptRefresh = async (retries = 2, delayMs = 4000) => {
  try {
    // No need to send refreshToken in body - httpOnly cookie sent automatically via withCredentials: true
    return await refreshApi();
  } catch (error) {
    const status = error.response?.status;

    // Definitive auth failure — do not retry
    if (status === 401 || status === 403) throw error;

    // Network/server error — retry if we have attempts left
    if (retries > 0) {
      await sleep(delayMs);
      return attemptRefresh(retries - 1, delayMs);
    }

    throw error;
  }
};

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Retry up to 2 times (total 3 attempts) with 4s gap — covers Render cold start (~30s)
      const { data } = await attemptRefresh(2, 4000);

      dispatch(
        setCredentials({
          user: data.data.user,
          accessToken: data.data.accessToken,
          // refreshToken is stored in httpOnly cookie by backend
        })
      );
      return data;
    } catch (error) {
      // Clear session only after all retries are exhausted
      try {
        localStorage.removeItem('hasSession');
      } catch {}
      dispatch(clearCredentials());
      dispatch(clearProfileState());
      dispatch(clearApplications());
      dispatch(clearDrives());
      return rejectWithValue(
        error.response?.data || { message: 'Token refresh failed' }
      );
    }
  }
);
