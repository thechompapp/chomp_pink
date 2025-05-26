/**
 * Tests for OfflineModeHandler
 */
import axios from 'axios';
import OfflineModeHandler from '@/services/http/OfflineModeHandler';

// Mock dependencies
jest.mock('@/utils/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator.onLine
const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
const mockNavigatorOnLine = (online) => {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => online
  });
};

// Mock window event listeners
const eventListeners = {};
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalDispatchEvent = window.dispatchEvent;

window.addEventListener = jest.fn((event, cb) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(cb);
});

window.removeEventListener = jest.fn((event, cb) => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter(listener => listener !== cb);
  }
});

window.dispatchEvent = jest.fn(event => {
  if (eventListeners[event.type]) {
    eventListeners[event.type].forEach(listener => listener(event));
  }
  return true;
});

describe('OfflineModeHandler', () => {
  let axiosInstance;
  let requestInterceptorId;
  
  beforeEach(() => {
    // Create a fresh axios instance for each test
    axiosInstance = axios.create();
    
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Reset event listeners
    Object.keys(eventListeners).forEach(key => {
      eventListeners[key] = [];
    });
    
    // Set navigator.onLine to true by default
    mockNavigatorOnLine(true);
    
    // Setup interceptors
    requestInterceptorId = OfflineModeHandler.setupRequestInterceptor(axiosInstance);
  });
  
  afterEach(() => {
    // Clean up interceptors
    axiosInstance.interceptors.request.eject(requestInterceptorId);
  });
  
  afterAll(() => {
    // Restore original properties and methods
    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine);
    }
    
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    window.dispatchEvent = originalDispatchEvent;
  });
  
  describe('initialize', () => {
    it('should add event listeners for online/offline events', () => {
      // Verify
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
  
  describe('checkOfflineMode', () => {
    it('should return false when navigator.onLine is true and no stored value', () => {
      // Setup
      mockNavigatorOnLine(true);
      
      // Execute
      const result = OfflineModeHandler.checkOfflineMode(true);
      
      // Verify
      expect(result).toBe(false);
    });
    
    it('should return true when navigator.onLine is false', () => {
      // Setup
      mockNavigatorOnLine(false);
      
      // Execute
      const result = OfflineModeHandler.checkOfflineMode(true);
      
      // Verify
      expect(result).toBe(true);
    });
    
    it('should return stored value when available (boolean format)', () => {
      // Setup
      mockNavigatorOnLine(true);
      localStorageMock.setItem('offline-mode', 'true');
      
      // Execute
      const result = OfflineModeHandler.checkOfflineMode(true);
      
      // Verify
      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('offline-mode');
    });
    
    it('should return stored value when available (object format)', () => {
      // Setup
      mockNavigatorOnLine(true);
      localStorageMock.setItem('offline-mode', JSON.stringify({
        enabled: true,
        timestamp: Date.now(),
        bypassAuth: true
      }));
      
      // Execute
      const result = OfflineModeHandler.checkOfflineMode(true);
      
      // Verify
      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('offline-mode');
    });
    
    it('should use cached value when not forcing refresh', () => {
      // Setup
      mockNavigatorOnLine(false);
      
      // First call to set the cache
      OfflineModeHandler.checkOfflineMode(true);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Change navigator.onLine
      mockNavigatorOnLine(true);
      
      // Execute (should use cached value)
      const result = OfflineModeHandler.checkOfflineMode(false);
      
      // Verify
      expect(result).toBe(true); // Still using cached value (offline)
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });
  
  describe('setOfflineMode', () => {
    it('should update offline mode state (non-persistent)', () => {
      // Execute
      OfflineModeHandler.setOfflineMode(true, false);
      
      // Verify
      expect(OfflineModeHandler.checkOfflineMode()).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('offline-mode');
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
    
    it('should update offline mode state (persistent)', () => {
      // Execute
      OfflineModeHandler.setOfflineMode(true, true, false);
      
      // Verify
      expect(OfflineModeHandler.checkOfflineMode()).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('offline-mode', expect.any(String));
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
      
      // Check stored value
      const storedValue = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(storedValue.enabled).toBe(true);
      expect(storedValue.bypassAuth).toBe(false);
    });
  });
  
  describe('handleOnlineEvent and handleOfflineEvent', () => {
    it('should update offline mode when online event is triggered', () => {
      // Setup
      OfflineModeHandler.setOfflineMode(true);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Execute
      window.dispatchEvent(new Event('online'));
      
      // Verify
      expect(OfflineModeHandler.checkOfflineMode()).toBe(false);
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'app:online'
      }));
    });
    
    it('should update offline mode when offline event is triggered', () => {
      // Setup
      OfflineModeHandler.setOfflineMode(false);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Execute
      window.dispatchEvent(new Event('offline'));
      
      // Verify
      expect(OfflineModeHandler.checkOfflineMode()).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'app:offline'
      }));
    });
  });
  
  describe('shouldAllowRequestInOfflineMode', () => {
    it('should allow GET requests in offline mode', () => {
      // Setup
      const config = {
        url: '/test',
        method: 'get'
      };
      
      // Execute
      const result = OfflineModeHandler.shouldAllowRequestInOfflineMode(config);
      
      // Verify
      expect(result).toBe(true);
    });
    
    it('should allow requests with allowOffline flag', () => {
      // Setup
      const config = {
        url: '/test',
        method: 'post',
        allowOffline: true
      };
      
      // Execute
      const result = OfflineModeHandler.shouldAllowRequestInOfflineMode(config);
      
      // Verify
      expect(result).toBe(true);
    });
    
    it('should not allow non-GET requests without allowOffline flag', () => {
      // Setup
      const config = {
        url: '/test',
        method: 'post'
      };
      
      // Execute
      const result = OfflineModeHandler.shouldAllowRequestInOfflineMode(config);
      
      // Verify
      expect(result).toBe(false);
    });
    
    it('should handle missing config', () => {
      // Execute
      const result = OfflineModeHandler.shouldAllowRequestInOfflineMode(null);
      
      // Verify
      expect(result).toBe(false);
    });
  });
  
  describe('setupRequestInterceptor', () => {
    it('should add offline flag to request in offline mode', async () => {
      // Setup
      OfflineModeHandler.setOfflineMode(true);
      
      const config = {
        url: '/test',
        method: 'get'
      };
      
      // Execute
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(result.isOffline).toBe(true);
    });
    
    it('should not modify request when not in offline mode', async () => {
      // Setup
      OfflineModeHandler.setOfflineMode(false);
      
      const config = {
        url: '/test',
        method: 'get'
      };
      
      // Execute
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);
      
      // Verify
      expect(result.isOffline).toBeUndefined();
    });
  });
});
