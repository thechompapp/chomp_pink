/**
 * Tests for ErrorInterceptor
 */
import axios from 'axios';
import ErrorInterceptor from '@/services/http/ErrorInterceptor';
import { createMockResponseFromError } from '@/services/mockApi';
import OfflineModeHandler from '@/services/http/OfflineModeHandler';

// Mock dependencies
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn()
}));

jest.mock('@/utils/ErrorHandler', () => ({
  handleApiError: jest.fn()
}));

jest.mock('@/services/mockApi', () => ({
  createMockResponseFromError: jest.fn()
}));

jest.mock('@/services/http/OfflineModeHandler', () => ({
  checkOfflineMode: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn()
}));

describe('ErrorInterceptor', () => {
  let axiosInstance;
  let responseInterceptorId;
  
  beforeEach(() => {
    // Create a fresh axios instance for each test
    axiosInstance = axios.create();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup interceptors
    responseInterceptorId = ErrorInterceptor.setupResponseInterceptor(axiosInstance);
  });
  
  afterEach(() => {
    // Clean up interceptors
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  });
  
  describe('handleResponseError', () => {
    it('should handle offline mode errors', async () => {
      // Setup
      OfflineModeHandler.checkOfflineMode.mockReturnValue(true);
      
      const mockResponse = { data: { mock: true } };
      createMockResponseFromError.mockResolvedValue(mockResponse);
      
      const error = {
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute
      const result = await ErrorInterceptor.handleResponseError(error, {
        showToast: false,
        offlineHandlingEnabled: true,
        mockEnabled: true
      });
      
      // Verify
      expect(result).toBe(mockResponse);
      expect(OfflineModeHandler.checkOfflineMode).toHaveBeenCalled();
      expect(createMockResponseFromError).toHaveBeenCalledWith(error);
    });
    
    it('should reject with offline error when mock is not available', async () => {
      // Setup
      OfflineModeHandler.checkOfflineMode.mockReturnValue(true);
      createMockResponseFromError.mockResolvedValue(null);
      
      const error = {
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute & Verify
      await expect(
        ErrorInterceptor.handleResponseError(error, {
          showToast: false,
          offlineHandlingEnabled: true,
          mockEnabled: true
        })
      ).rejects.toEqual(expect.objectContaining({
        offline: true,
        message: expect.any(String)
      }));
      
      expect(OfflineModeHandler.checkOfflineMode).toHaveBeenCalled();
      expect(createMockResponseFromError).toHaveBeenCalledWith(error);
    });
    
    it('should handle network errors', async () => {
      // Setup
      OfflineModeHandler.checkOfflineMode.mockReturnValue(false);
      
      const error = {
        message: 'Network Error',
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute & Verify
      await expect(
        ErrorInterceptor.handleResponseError(error, {
          showToast: false
        })
      ).rejects.toEqual(error);
    });
    
    it('should handle retry logic for specific status codes', async () => {
      // Setup
      OfflineModeHandler.checkOfflineMode.mockReturnValue(false);
      
      const error = {
        response: {
          status: 503,
          data: { message: 'Service Unavailable' }
        },
        config: {
          url: '/test',
          method: 'get',
          axios: jest.fn().mockResolvedValue({ data: 'success' })
        }
      };
      
      // Mock setTimeout
      jest.useFakeTimers();
      
      // Execute
      const promise = ErrorInterceptor.handleResponseError(error, {
        showToast: false,
        retryEnabled: true,
        retryCount: 0
      });
      
      // Fast-forward timers
      jest.runAllTimers();
      
      // Verify
      const result = await promise;
      expect(result).toEqual({ data: 'success' });
      expect(error.config.axios).toHaveBeenCalledWith(error.config);
    });
    
    it('should handle specific status codes with appropriate messages', async () => {
      // Setup
      OfflineModeHandler.checkOfflineMode.mockReturnValue(false);
      
      const testCases = [
        { status: 400, message: 'Bad Request' },
        { status: 404, message: 'Not Found' },
        { status: 408, message: 'Request Timeout' },
        { status: 429, message: 'Too Many Requests' },
        { status: 500, message: 'Internal Server Error' }
      ];
      
      for (const testCase of testCases) {
        const { status, message } = testCase;
        
        // Reset mocks
        jest.clearAllMocks();
        
        const error = {
          response: {
            status,
            data: { message }
          },
          config: {
            url: '/test',
            method: 'get'
          }
        };
        
        // Execute & Verify
        await expect(
          ErrorInterceptor.handleResponseError(error, {
            showToast: false,
            retryEnabled: false
          })
        ).rejects.toEqual(error);
      }
    });
  });
  
  describe('setupResponseInterceptor', () => {
    it('should pass successful responses through', async () => {
      // Setup
      const response = {
        data: { success: true },
        status: 200
      };
      
      // Execute
      const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response);
      
      // Verify
      expect(result).toBe(response);
    });
    
    it('should handle error responses', async () => {
      // Setup
      const spy = jest.spyOn(ErrorInterceptor, 'handleResponseError');
      
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        },
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(spy).toHaveBeenCalledWith(error);
    });
  });
});
