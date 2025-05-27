// Cleanup after each test
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean up after each test case
afterEach(() => {
  cleanup();
  
  // Clear any mocks that were created during the test
  vi.clearAllMocks();
  
  // Clear any timers that might have been set during the test
  vi.clearAllTimers();
  
  // Reset any mock implementations
  vi.resetAllMocks();
  
  // Clear local storage between tests
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
  
  // Clear any fetch mocks
  if (typeof global.fetch !== 'undefined') {
    global.fetch.mockClear();
  }
});

// Reset all mocks before each test
beforeEach(() => {
  vi.restoreAllMocks();
});
