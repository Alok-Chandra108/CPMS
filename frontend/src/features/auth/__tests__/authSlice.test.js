import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  setCredentials,
  clearCredentials,
  setInitialized,
} from '../authSlice';

// Provide a mock localStorage on globalThis for Node test environment
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

globalThis.localStorage = mockStorage;

describe('authSlice session hint & initialization', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('sets hasSession in localStorage when credentials are set', () => {
    const initialState = {
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false,
      isInitialized: false,
      loading: false,
      error: null,
    };

    const action = setCredentials({
      user: { id: '123', role: 'student', name: 'Alok' },
      accessToken: 'test-token',
    });

    const state = authReducer(initialState, action);

    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitialized).toBe(true);
    expect(state.user).toEqual({ id: '123', role: 'student', name: 'Alok' });
    expect(mockStorage.getItem('hasSession')).toBe('true');
  });

  it('removes hasSession from localStorage on clearCredentials', () => {
    mockStorage.setItem('hasSession', 'true');

    const loggedInState = {
      user: { id: '123', role: 'student' },
      accessToken: 'test-token',
      role: 'student',
      isAuthenticated: true,
      isInitialized: true,
      loading: false,
      error: null,
    };

    const state = authReducer(loggedInState, clearCredentials());

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isInitialized).toBe(true);
    expect(mockStorage.getItem('hasSession')).toBeNull();
  });

  it('updates isInitialized to true on setInitialized action', () => {
    const uninitState = {
      user: null,
      accessToken: null,
      role: null,
      isAuthenticated: false,
      isInitialized: false,
      loading: false,
      error: null,
    };

    const state = authReducer(uninitState, setInitialized());
    expect(state.isInitialized).toBe(true);
  });
});
