/**
 * Tests for ApiClientFactory
 */
import axios from 'axios';
import ApiClientFactory from '@/services/http/ApiClientFactory';
import AuthInterceptor from '@/services/http/AuthInterceptor';
import ErrorInterceptor from '@/services/http/ErrorInterceptor';
import LoadingStateManager from '@/services/http/LoadingStateManager';
import OfflineModeHandler from '@/services/http/OfflineModeHandler';
import LoggingInterceptor from '@/services/http/LoggingInterceptor';
import DevelopmentModeHandler from '@/services/http/DevelopmentModeHandler';

// Mock dependencies
jest.mock('@/services/http/AuthInterceptor', () => ({
  setupRequestInterceptor: jest.fn().mockReturnValue(1),
  setupResponseInterceptor: jest.fn().mockReturnValue(2)
}));

jest.mock('@/services/http/ErrorInterceptor', () => ({
  setupResponseInterceptor: jest.fn().mockReturnValue(3)
}));

jest.mock('@/services/http/LoadingStateManager', () => ({
  setupRequestInterceptor: jest.fn().mockReturnValue(4),
  setupResponseInterceptor: jest.fn().mockReturnValue(5)
}));

jest.mock('@/services/http/OfflineModeHandler', () => ({
  setupRequestInterceptor: jest.fn().mockReturnValue(6)
}));

jest.mock('@/services/http/LoggingInterceptor', () => ({
  setVerbosity: jest.fn(),
  setupRequestInterceptor: jest.fn().mockReturnValue(7),
  setupResponseInterceptor: jest.fn().mockReturnValue(8)
}));

jest.mock('@/services/http/DevelopmentModeHandler', () => ({
  setupRequestInterceptor: jest.fn().mockReturnValue(9),
  setupResponseInterceptor: jest.fn().mockReturnValue(10)
}));

jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn()
}));

describe('ApiClientFactory', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('createApiClient', () => {
    it('should create an axios instance with default options', () => {
      // Execute
      const client = ApiClientFactory.createApiClient();
      
      // Verify
      expect(client).toBeDefined();
      expect(client.defaults.baseURL).toBeDefined();
      expect(client.defaults.timeout).toBe(30000);
      expect(client.defaults.withCredentials).toBe(true);
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
      expect(client.defaults.headers['Accept']).toBe('application/json');
      
      // Verify interceptors were set up
      expect(LoggingInterceptor.setVerbosity).toHaveBeenCalledWith('normal');
      expect(LoggingInterceptor.setupRequestInterceptor).toHaveBeenCalled();
      expect(LoggingInterceptor.setupResponseInterceptor).toHaveBeenCalled();
      expect(DevelopmentModeHandler.setupRequestInterceptor).toHaveBeenCalled();
      expect(DevelopmentModeHandler.setupResponseInterceptor).toHaveBeenCalled();
      expect(AuthInterceptor.setupRequestInterceptor).toHaveBeenCalled();
      expect(AuthInterceptor.setupResponseInterceptor).toHaveBeenCalled();
      expect(OfflineModeHandler.setupRequestInterceptor).toHaveBeenCalled();
      expect(LoadingStateManager.setupRequestInterceptor).toHaveBeenCalled();
      expect(LoadingStateManager.setupResponseInterceptor).toHaveBeenCalled();
      expect(ErrorInterceptor.setupResponseInterceptor).toHaveBeenCalled();
    });
    
    it('should create an axios instance with custom options', () => {
      // Setup
      const customOptions = {
        baseURL: 'https://custom-api.example.com',
        timeout: 60000,
        withCredentials: false,
        headers: {
          'X-Custom-Header': 'custom-value'
        },
        enableAuth: false,
        enableLoading: false,
        enableErrorHandling: false,
        enableOfflineMode: false,
        enableLogging: false,
        enableDevMode: false
      };
      
      // Execute
      const client = ApiClientFactory.createApiClient(customOptions);
      
      // Verify
      expect(client).toBeDefined();
      expect(client.defaults.baseURL).toBe(customOptions.baseURL);
      expect(client.defaults.timeout).toBe(customOptions.timeout);
      expect(client.defaults.withCredentials).toBe(customOptions.withCredentials);
      expect(client.defaults.headers['X-Custom-Header']).toBe(customOptions.headers['X-Custom-Header']);
      
      // Verify interceptors were NOT set up
      expect(LoggingInterceptor.setupRequestInterceptor).not.toHaveBeenCalled();
      expect(LoggingInterceptor.setupResponseInterceptor).not.toHaveBeenCalled();
      expect(DevelopmentModeHandler.setupRequestInterceptor).not.toHaveBeenCalled();
      expect(DevelopmentModeHandler.setupResponseInterceptor).not.toHaveBeenCalled();
      expect(AuthInterceptor.setupRequestInterceptor).not.toHaveBeenCalled();
      expect(AuthInterceptor.setupResponseInterceptor).not.toHaveBeenCalled();
      expect(OfflineModeHandler.setupRequestInterceptor).not.toHaveBeenCalled();
      expect(LoadingStateManager.setupRequestInterceptor).not.toHaveBeenCalled();
      expect(LoadingStateManager.setupResponseInterceptor).not.toHaveBeenCalled();
      expect(ErrorInterceptor.setupResponseInterceptor).not.toHaveBeenCalled();
    });
  });
  
  describe('createDefaultApiClient', () => {
    it('should create an axios instance with default options', () => {
      // Setup
      const spy = jest.spyOn(ApiClientFactory, 'createApiClient');
      
      // Execute
      const client = ApiClientFactory.createDefaultApiClient();
      
      // Verify
      expect(client).toBeDefined();
      expect(spy).toHaveBeenCalledWith();
    });
  });
  
  describe('createMinimalApiClient', () => {
    it('should create an axios instance with minimal options', () => {
      // Setup
      const spy = jest.spyOn(ApiClientFactory, 'createApiClient');
      
      // Execute
      const client = ApiClientFactory.createMinimalApiClient();
      
      // Verify
      expect(client).toBeDefined();
      expect(spy).toHaveBeenCalledWith({
        enableLoading: false,
        enableLogging: false,
        enableDevMode: false,
        enableOfflineMode: false
      });
    });
  });
  
  describe('createAuthApiClient', () => {
    it('should create an axios instance for auth requests', () => {
      // Setup
      const spy = jest.spyOn(ApiClientFactory, 'createApiClient');
      
      // Execute
      const client = ApiClientFactory.createAuthApiClient();
      
      // Verify
      expect(client).toBeDefined();
      expect(spy).toHaveBeenCalledWith({
        enableAuth: false,
        loggingVerbosity: 'minimal'
      });
    });
  });
  
  describe('createOfflineCapableApiClient', () => {
    it('should create an axios instance for offline-capable requests', () => {
      // Setup
      const spy = jest.spyOn(ApiClientFactory, 'createApiClient');
      
      // Execute
      const client = ApiClientFactory.createOfflineCapableApiClient();
      
      // Verify
      expect(client).toBeDefined();
      expect(spy).toHaveBeenCalledWith({
        enableOfflineMode: true,
        timeout: 60000
      });
    });
  });
});
