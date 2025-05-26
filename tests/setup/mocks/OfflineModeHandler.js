// Mock for OfflineModeHandler
export class OfflineModeHandler {
  constructor() {
    this._offlineMode = false;
    this._lastOfflineCheck = 0;
    this._requestQueue = [];
    this._isInitialized = false;
    this.initialize();
  }

  initialize() {
    if (this._isInitialized) return;
    this._isInitialized = true;
  }

  checkOfflineMode(force = false) {
    return false; // Always online in tests
  }

  isOfflineMode() {
    return false; // Always online in tests
  }

  handleOnlineEvent() {
    // Process any queued requests
    this._processQueue();
  }

  handleOfflineEvent() {
    // No-op for tests
  }

  setupRequestInterceptor(axiosInstance) {
    // No-op for tests
    return () => {}; // Return cleanup function
  }

  setupResponseInterceptor(axiosInstance) {
    // No-op for tests
    return () => {}; // Return cleanup function
  }

  _processQueue() {
    // No-op for tests
  }

  // Static methods
  static setupRequestInterceptor(axiosInstance) {
    // No-op for tests
    return () => {}; // Return cleanup function
  }

  static setupResponseInterceptor(axiosInstance) {
    // No-op for tests
    return () => {}; // Return cleanup function
  }
}

// Export the class itself, not an instance
export default OfflineModeHandler;
