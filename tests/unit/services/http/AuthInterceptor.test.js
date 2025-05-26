/**
 * Tests for AuthInterceptor
 */
import axios from 'axios';
import AuthInterceptor from '@/services/http/AuthInterceptor';
import { getToken, clearToken } from '@/services/auth/tokenStorage';

// Mock dependencies
jest.mock('@/services/auth/tokenStorage', () => ({
  getToken: jest.fn(),
  clearToken: jest.fn()
}));

jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn()
}));

describe('AuthInterceptor', () => {
  let axiosInstance;
  let requestInterceptorId;
  let responseInterceptorId;
  
  beforeEach(() => {
    // Create a fresh axios instance for each test
    axiosInstance = axios.create();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup interceptors
    requestInterceptorId = AuthInterceptor.setupRequestInterceptor(axiosInstance);
    responseInterceptorId = AuthInterceptor.setupResponseInterceptor(axiosInstance);
  });
  
  afterEach(() => {
    // Clean up interceptors
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  });
  
  describe('setupRequestInterceptor', () => {
    it('should add auth header when token is available', async () => {
      // Setup
      const token = 'test-token';
      getToken.mockReturnValue(token);
      
      const config = {
        url: '/test',
        method: 'get',
        headers: {}
      };
      
      // Execute
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      expect(getToken).toHaveBeenCalled();
    });
    
    it('should not add auth header when token is not available', async () => {
      // Setup
      getToken.mockReturnValue(null);
      
      const config = {
        url: '/test',
        method: 'get',
        headers: {}
      };
      
      // Execute
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(result.headers.Authorization).toBeUndefined();
      expect(getToken).toHaveBeenCalled();
    });
    
    it('should not add auth header for auth endpoints', async () => {
      // Setup
      const token = 'test-token';
      getToken.mockReturnValue(token);
      
      const config = {
        url: '/auth/login',
        method: 'post',
        headers: {}
      };
      
      // Execute
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(result.headers.Authorization).toBeUndefined();
      expect(getToken).not.toHaveBeenCalled();
    });
  });
  
  describe('setupResponseInterceptor', () => {
    it('should handle 401 Unauthorized response by clearing token', async () => {
      // Setup
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        },
        config: {
          url: '/test',
          _retry: false
        }
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(clearToken).toHaveBeenCalled();
    });
    
    it('should not clear token for non-401 errors', async () => {
      // Setup
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        },
        config: {
          url: '/test'
        }
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(clearToken).not.toHaveBeenCalled();
    });
    
    it('should not clear token for network errors', async () => {
      // Setup
      const error = {
        message: 'Network Error',
        config: {
          url: '/test'
        }
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(clearToken).not.toHaveBeenCalled();
    });
  });
});
