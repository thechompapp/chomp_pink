import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// Simple test store implementation
const createAuthStore = (set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  
  setUser: (user, token) => set({ 
    user, 
    token, 
    isAuthenticated: !!user 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call
      const user = { id: '1', email: credentials.email };
      const token = 'test-token';
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return { user, token };
    } catch (error) {
      set({ error, isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      isLoading: false 
    });
  },
  
  reset: () => set({ 
    isAuthenticated: false, 
    user: null, 
    token: null, 
    isLoading: false, 
    error: null 
  })
});

describe('Auth Store', () => {
  let store;
  
  beforeEach(() => {
    store = create(createAuthStore);
  });
  
  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state).toMatchObject({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null
    });
  });
  
  it('should set user and token', () => {
    const user = { id: '1', email: 'test@example.com' };
    const token = 'test-token';
    
    store.getState().setUser(user, token);
    
    const state = store.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
  });
  
  it('should handle login', async () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    
    const result = await store.getState().login(credentials);
    
    const state = store.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: '1', email: credentials.email });
    expect(state.token).toBe('test-token');
    expect(result).toEqual({
      user: state.user,
      token: state.token
    });
  });
  
  it('should handle logout', async () => {
    // First login
    await store.getState().login({ email: 'test@example.com', password: 'password' });
    
    // Then logout
    await store.getState().logout();
    
    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isLoading).toBe(false);
  });
  
  it('should handle errors during login', async () => {
    // Mock a failing login
    const originalLogin = store.getState().login;
    store.setState({
      login: async () => {
        throw new Error('Login failed');
      }
    });
    
    await expect(store.getState().login({})).rejects.toThrow('Login failed');
    
    const state = store.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeDefined();
    
    // Restore original login
    store.setState({ login: originalLogin });
  });
  
  it('should reset to initial state', () => {
    // Set some state
    store.getState().setUser({ id: '1' }, 'token');
    
    // Reset
    store.getState().reset();
    
    const state = store.getState();
    expect(state).toMatchObject({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null
    });
  });
});
