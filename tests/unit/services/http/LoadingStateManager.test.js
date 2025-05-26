/**
 * Tests for LoadingStateManager
 */
import axios from 'axios';
import LoadingStateManager from '@/services/http/LoadingStateManager';

// Mock dependencies
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn()
}));

describe('LoadingStateManager', () => {
  let axiosInstance;
  let requestInterceptorId;
  let responseInterceptorId;
  
  beforeEach(() => {
    // Create a fresh axios instance for each test
    axiosInstance = axios.create();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset loading state
    LoadingStateManager.resetLoadingStates();
    
    // Setup interceptors
    requestInterceptorId = LoadingStateManager.setupRequestInterceptor(axiosInstance);
    responseInterceptorId = LoadingStateManager.setupResponseInterceptor(axiosInstance);
  });
  
  afterEach(() => {
    // Clean up interceptors
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  });
  
  describe('startLoading and stopLoading', () => {
    it('should track loading state for a request', () => {
      // Setup
      const config = {
        url: '/test',
        method: 'get'
      };
      
      // Execute
      LoadingStateManager.startLoading(config);
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(true);
      expect(LoadingStateManager.isUrlLoading('/test')).toBe(true);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(1);
      
      // Execute
      LoadingStateManager.stopLoading(config);
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(false);
      expect(LoadingStateManager.isUrlLoading('/test')).toBe(false);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(0);
    });
    
    it('should handle multiple concurrent requests', () => {
      // Setup
      const config1 = {
        url: '/test1',
        method: 'get'
      };
      
      const config2 = {
        url: '/test2',
        method: 'post'
      };
      
      // Execute
      LoadingStateManager.startLoading(config1);
      LoadingStateManager.startLoading(config2);
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(true);
      expect(LoadingStateManager.isUrlLoading('/test1')).toBe(true);
      expect(LoadingStateManager.isUrlLoading('/test2')).toBe(true);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(2);
      
      // Execute
      LoadingStateManager.stopLoading(config1);
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(true);
      expect(LoadingStateManager.isUrlLoading('/test1')).toBe(false);
      expect(LoadingStateManager.isUrlLoading('/test2')).toBe(true);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(1);
      
      // Execute
      LoadingStateManager.stopLoading(config2);
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(false);
      expect(LoadingStateManager.isUrlLoading('/test1')).toBe(false);
      expect(LoadingStateManager.isUrlLoading('/test2')).toBe(false);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(0);
    });
    
    it('should handle missing config or URL', () => {
      // Execute
      LoadingStateManager.startLoading(null);
      LoadingStateManager.startLoading({});
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(false);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(0);
    });
  });
  
  describe('subscribeToLoadingState', () => {
    it('should notify subscribers when loading state changes', () => {
      // Setup
      const mockCallback = jest.fn();
      const unsubscribe = LoadingStateManager.subscribeToLoadingState(mockCallback);
      
      // Verify initial call
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        isLoading: false,
        loadingUrls: [],
        loadingCount: 0
      });
      
      // Reset mock
      mockCallback.mockClear();
      
      // Execute
      LoadingStateManager.startLoading({ url: '/test' });
      
      // Verify
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        isLoading: true,
        loadingUrls: ['/test'],
        loadingCount: 1
      });
      
      // Reset mock
      mockCallback.mockClear();
      
      // Execute
      LoadingStateManager.stopLoading({ url: '/test' });
      
      // Verify
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({
        isLoading: false,
        loadingUrls: [],
        loadingCount: 0
      });
      
      // Unsubscribe
      unsubscribe();
      
      // Reset mock
      mockCallback.mockClear();
      
      // Execute
      LoadingStateManager.startLoading({ url: '/test' });
      
      // Verify
      expect(mockCallback).not.toHaveBeenCalled();
    });
    
    it('should handle invalid callbacks', () => {
      // Execute
      const unsubscribe = LoadingStateManager.subscribeToLoadingState(null);
      
      // Verify
      expect(unsubscribe).toBeInstanceOf(Function);
      
      // Execute
      unsubscribe();
    });
  });
  
  describe('setupRequestInterceptor', () => {
    it('should start loading when request is made', async () => {
      // Setup
      const spy = jest.spyOn(LoadingStateManager, 'startLoading');
      
      const config = {
        url: '/test',
        method: 'get'
      };
      
      // Execute
      await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(spy).toHaveBeenCalledWith(config);
    });
  });
  
  describe('setupResponseInterceptor', () => {
    it('should stop loading on successful response', async () => {
      // Setup
      const spy = jest.spyOn(LoadingStateManager, 'stopLoading');
      
      const response = {
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute
      await axiosInstance.interceptors.response.handlers[0].fulfilled(response);
      
      // Verify
      expect(spy).toHaveBeenCalledWith(response.config);
    });
    
    it('should stop loading on error response', async () => {
      // Setup
      const spy = jest.spyOn(LoadingStateManager, 'stopLoading');
      
      const error = {
        config: {
          url: '/test',
          method: 'get'
        }
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(spy).toHaveBeenCalledWith(error.config);
    });
    
    it('should handle errors without config', async () => {
      // Setup
      const spy = jest.spyOn(LoadingStateManager, 'stopLoading');
      
      const error = {
        message: 'Network Error'
      };
      
      // Execute & Verify
      await expect(
        axiosInstance.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);
      
      expect(spy).not.toHaveBeenCalled();
    });
  });
  
  describe('resetLoadingStates', () => {
    it('should reset all loading states', () => {
      // Setup
      LoadingStateManager.startLoading({ url: '/test1' });
      LoadingStateManager.startLoading({ url: '/test2' });
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(true);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(2);
      
      // Execute
      LoadingStateManager.resetLoadingStates();
      
      // Verify
      expect(LoadingStateManager.isLoading).toBe(false);
      expect(LoadingStateManager.getLoadingState().loadingCount).toBe(0);
    });
  });
});
