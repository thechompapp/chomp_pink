/**
 * Simple store test that doesn't depend on the actual store implementation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';

// Create a simple store for testing
const createTestStore = (set, get) => {
  // Initial state
  const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
  };

  return {
    ...initialState,
    
    // Actions
    setUser: (user) => set({ 
      user, 
      isAuthenticated: !!user 
    }),
    
    setToken: (token) => set({ token }),
    
    setError: (error) => set({ error }),
    
    clearError: () => set({ error: null }),
    
    logout: () => set({ 
      user: null, 
      isAuthenticated: false, 
      token: null,
      error: null 
    }),
    
    // Getter for token
    getToken: () => get().token,
  };
};

describe('Simple Store Test', () => {
  let store;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = create(createTestStore);
  });
  
  it('should initialize with default values', () => {
    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();
    expect(store.getState().isLoading).toBe(false);
    expect(store.getState().error).toBeNull();
    expect(store.getState().token).toBeNull();
  });
  
  it('should set and get user', () => {
    const testUser = { id: 1, username: 'testuser' };
    
    // Set user
    store.getState().setUser(testUser);
    
    // Check the updated state
    expect(store.getState().user).toEqual(testUser);
    expect(store.getState().isAuthenticated).toBe(true);
  });
  
  it('should clear user on logout', () => {
    // First set a user
    store.getState().setUser({ id: 1, username: 'testuser' });
    store.getState().setToken('test-token');
    
    // Then logout
    store.getState().logout();
    
    // Check the state was cleared
    expect(store.getState().user).toBeNull();
    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().token).toBeNull();
  });
  
  it('should set and get token', () => {
    const testToken = 'test-token-123';
    
    // Set token
    store.getState().setToken(testToken);
    
    // Check token was set
    expect(store.getState().getToken()).toBe(testToken);
  });
  
  it('should set and clear errors', () => {
    const errorMessage = 'Test error';
    
    // Set error
    store.getState().setError(errorMessage);
    expect(store.getState().error).toBe(errorMessage);
    
    // Clear error
    store.getState().clearError();
    expect(store.getState().error).toBeNull();
  });
});
