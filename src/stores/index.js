/**
 * Stores Index
 * 
 * Exports all store modules for easier imports
 */

// Export auth stores
export * from './auth';

// Export individual store modules
export { default as useAuthStore } from './useAuthStore';

// Legacy exports for backward compatibility
export { getIsAuthenticated, getCurrentUser, getIsSuperuser, getSuperuserStatusReady } from './useAuthStore';
