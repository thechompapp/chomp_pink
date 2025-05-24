// Filename: /src/hooks/useBulkAddProcessor.test.jsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBulkAddProcessor from './useBulkAddProcessor';
import axios from 'axios';
import { apiClient, API_ENDPOINTS, TEST_TIMEOUT } from '../../tests/setup/api-test-config.js';

// Mock axios for testing without relying on the actual API
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      defaults: { headers: { common: {} } }
    })),
    defaults: { headers: { common: {} } },
    post: vi.fn(),
    get: vi.fn()
  }
}));

// This will ensure all API calls use the correct backend URL (port 5001)
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2, // Allow retries for real API calls
        retryDelay: 1000,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// We're using TEST_TIMEOUT from api-test-config.js

// Override the API base URL to use port 5001 instead of 3000
process.env.VITE_API_BASE_URL = 'http://localhost:5001';

// We're using the verifyBackendServer function imported from test-api-setup.js

describe('useBulkAddProcessor Hook', () => {
  // Ensure backend is available before running any tests
  beforeAll(async () => {
    await verifyBackendServer();
  });
  
  beforeEach(() => {
    // Reset state between tests
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.errors).toEqual([]);
    expect(result.current.duplicates).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.parseError).toBeNull();
    expect(result.current.submitStatus).toEqual({ state: 'idle', message: '', data: null });
  }, TEST_TIMEOUT);

  it('should process valid input data', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // Sample input data for a restaurant
    const inputData = 'Test Restaurant, 123 Main St, New York, NY';

    await act(async () => {
      await result.current.processInputData(inputData);
    });

    // Check that the data was processed
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items[0]).toHaveProperty('name');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.parseError).toBeNull();
  }, TEST_TIMEOUT);

  it('should handle empty input data', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.processInputData('');
    });

    expect(result.current.parseError).not.toBeNull();
    expect(result.current.items).toEqual([]);
  }, TEST_TIMEOUT);

  it('should reset state correctly', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // First process some data
    const inputData = 'Test Restaurant, 123 Main St, New York, NY';
    
    await act(async () => {
      await result.current.processInputData(inputData);
    });

    // Verify we have data
    expect(result.current.items.length).toBeGreaterThan(0);

    // Now reset
    act(() => {
      result.current.resetState();
    });

    // Verify state is reset
    expect(result.current.items).toEqual([]);
    expect(result.current.errors).toEqual([]);
    expect(result.current.duplicates).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.parseError).toBeNull();
    expect(result.current.submitStatus).toEqual({ state: 'idle', message: '', data: null });
  }, TEST_TIMEOUT);

  it.skip('should submit bulk add data to the API', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // First process some data
    const inputData = 'Test Restaurant, 123 Main St, New York, NY';
    
    await act(async () => {
      await result.current.processInputData(inputData);
    });

    // Verify we have data
    expect(result.current.items.length).toBeGreaterThan(0);

    // Now submit the data
    await act(async () => {
      await result.current.submitBulkAdd();
    });

    // Check the submission status
    expect(result.current.submitStatus.state).toBe('success');
    expect(result.current.submitStatus.data).toHaveProperty('added');
  }, TEST_TIMEOUT);

  it('should handle invalid input data format', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // Invalid format (missing address)
    const inputData = 'Just a restaurant name';

    await act(async () => {
      await result.current.processInputData(inputData);
    });

    // Should have errors or incomplete items
    expect(result.current.errors.length > 0 || 
           result.current.items.some(item => item.status === 'incomplete')).toBe(true);
  }, TEST_TIMEOUT);

  it('should detect duplicates in input data', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // Duplicate entries
    const inputData = `Test Restaurant, 123 Main St, New York, NY
Test Restaurant, 123 Main St, New York, NY`;

    await act(async () => {
      await result.current.processInputData(inputData);
    });

    // Should have detected duplicates
    expect(result.current.duplicates.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  it.skip('should handle API errors gracefully', async () => {
    const { result } = renderHook(() => useBulkAddProcessor(), {
      wrapper: createWrapper()
    });

    // Create an invalid item that will cause API errors
    result.current.items = [{ name: '', status: 'valid' }]; // Empty name should cause validation error

    await act(async () => {
      await result.current.submitBulkAdd();
    });

    // Check that the error was handled gracefully
    expect(result.current.submitStatus.state).toBe('error');
  }, TEST_TIMEOUT);
});
