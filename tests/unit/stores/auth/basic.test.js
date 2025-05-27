import { describe, it, expect, vi } from 'vitest';
import { create } from 'zustand';

// Simple test store
describe('Basic Zustand Store', () => {
  it('should create a store with initial state', () => {
    const useStore = create((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    // Test the store
    const { getState } = useStore;
    expect(getState().count).toBe(0);
    
    // Test updating state
    getState().increment();
    expect(getState().count).toBe(1);
  });
});
