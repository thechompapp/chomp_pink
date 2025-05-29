/**
 * Authentication Event Manager
 * 
 * Handles authentication-related event dispatching and listening including:
 * - Login/logout event dispatch
 * - UI refresh events
 * - Offline status change events
 * - Custom auth event management
 */

import { logInfo, logDebug } from '@/utils/logger';
import { AUTH_CONFIG } from './authConfig';

/**
 * Dispatch authentication login complete event
 * @param {Object} userData - User data to include in event
 */
export function dispatchLoginComplete(userData) {
  if (typeof window === 'undefined') return;
  
  try {
    const event = new CustomEvent(AUTH_CONFIG.EVENTS.LOGIN_COMPLETE, {
      detail: { isAuthenticated: true, user: userData }
    });
    window.dispatchEvent(event);
    
    logInfo('[AuthEvents] Login complete event dispatched');
  } catch (error) {
    logDebug('[AuthEvents] Error dispatching login event:', error);
  }
}

/**
 * Dispatch authentication logout complete event
 * @param {Object} options - Logout event options
 */
export function dispatchLogoutComplete(options = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const event = new CustomEvent(AUTH_CONFIG.EVENTS.LOGOUT_COMPLETE, {
      detail: { isAuthenticated: false, cleared: true, ...options }
    });
    window.dispatchEvent(event);
    
    logInfo('[AuthEvents] Logout complete event dispatched');
  } catch (error) {
    logDebug('[AuthEvents] Error dispatching logout event:', error);
  }
}

/**
 * Dispatch UI refresh event to force component updates
 */
export function dispatchUIRefresh() {
  if (typeof window === 'undefined') return;
  
  try {
    const event = new CustomEvent(AUTH_CONFIG.EVENTS.FORCE_UI_REFRESH, {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
    
    logInfo('[AuthEvents] UI refresh event dispatched');
  } catch (error) {
    logDebug('[AuthEvents] Error dispatching UI refresh event:', error);
  }
}

/**
 * Dispatch offline status change event
 * @param {boolean} isOffline - Whether the app is offline
 */
export function dispatchOfflineStatusChange(isOffline) {
  if (typeof window === 'undefined') return;
  
  try {
    const event = new CustomEvent(AUTH_CONFIG.EVENTS.OFFLINE_STATUS_CHANGED, {
      detail: { isOffline }
    });
    window.dispatchEvent(event);
    
    logInfo(`[AuthEvents] Offline status changed: ${isOffline}`);
  } catch (error) {
    logDebug('[AuthEvents] Error dispatching offline status event:', error);
  }
}

/**
 * Dispatch all login-related events
 * @param {Object} userData - User data
 */
export function dispatchLoginEvents(userData) {
  dispatchLoginComplete(userData);
  dispatchUIRefresh();
  dispatchOfflineStatusChange(false); // Login implies we're online
}

/**
 * Dispatch all logout-related events
 * @param {Object} options - Logout options
 */
export function dispatchLogoutEvents(options = {}) {
  dispatchLogoutComplete(options);
  dispatchUIRefresh();
}

/**
 * Listen for authentication events
 * @param {string} eventType - Type of event to listen for
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function to remove listener
 */
export function addEventListener(eventType, callback) {
  if (typeof window === 'undefined') {
    return () => {}; // Return no-op cleanup function
  }
  
  // Validate event type
  const validEvents = Object.values(AUTH_CONFIG.EVENTS);
  if (!validEvents.includes(eventType)) {
    logDebug(`[AuthEvents] Warning: Unknown event type: ${eventType}`);
  }
  
  window.addEventListener(eventType, callback);
  
  logDebug(`[AuthEvents] Added listener for ${eventType}`);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(eventType, callback);
    logDebug(`[AuthEvents] Removed listener for ${eventType}`);
  };
}

/**
 * Add login event listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export function onLoginComplete(callback) {
  return addEventListener(AUTH_CONFIG.EVENTS.LOGIN_COMPLETE, callback);
}

/**
 * Add logout event listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export function onLogoutComplete(callback) {
  return addEventListener(AUTH_CONFIG.EVENTS.LOGOUT_COMPLETE, callback);
}

/**
 * Add UI refresh event listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export function onUIRefresh(callback) {
  return addEventListener(AUTH_CONFIG.EVENTS.FORCE_UI_REFRESH, callback);
}

/**
 * Add offline status change listener
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export function onOfflineStatusChange(callback) {
  return addEventListener(AUTH_CONFIG.EVENTS.OFFLINE_STATUS_CHANGED, callback);
}

/**
 * Remove all authentication event listeners
 * This is useful for cleanup during testing or component unmounting
 */
export function removeAllEventListeners() {
  if (typeof window === 'undefined') return;
  
  Object.values(AUTH_CONFIG.EVENTS).forEach(eventType => {
    // Clone the events to avoid modifying during iteration
    const events = [...(window.eventListeners || [])];
    events.forEach(listener => {
      if (listener.type === eventType) {
        window.removeEventListener(eventType, listener.callback);
      }
    });
  });
  
  logInfo('[AuthEvents] All auth event listeners removed');
}

/**
 * Get list of current event listeners (for debugging)
 * @returns {Array} List of current listeners
 */
export function getEventListeners() {
  if (typeof window === 'undefined') return [];
  
  // This is a simplified version - actual implementation would depend on how listeners are tracked
  return Object.values(AUTH_CONFIG.EVENTS).map(eventType => ({
    eventType,
    hasListeners: typeof window.getEventListeners === 'function' 
      ? window.getEventListeners(window).length > 0 
      : 'unknown'
  }));
} 