/* src/services/userService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

// --- Helper Function for data formatting ---
const formatUser = (user) => {
  if (!user || typeof user.id !== 'number') return null;
  return {
    id: user.id,
    username: user.username || null,
    email: user.email || null, // Be cautious about exposing email if not needed
    handle: user.handle || null,
    // Add other relevant user fields (e.g., profile picture URL, bio)
    // Avoid returning sensitive data like password hashes!
  };
};

// --- Service Functions ---

/**
 * Get current user's profile
 * @returns {Promise<Object>} User profile data or null if error
 */
export const getCurrentUser = () => {
  return handleApiResponse(
    () => apiClient.get('/users/me'),
    'userService.getCurrentUser'
  );
};

/**
 * Get a specific user's public profile by ID or handle
 * @param {string|number} identifier - User ID or handle
 * @returns {Promise<Object>} User profile data or null if error
 */
export const getUserProfile = async (identifier) => {
  if (!identifier) {
    logError('[UserService] User ID or handle is required');
    return null;
  }
  
  const encodedIdentifier = encodeURIComponent(String(identifier));
  logDebug(`[UserService] Fetching profile for user: ${identifier}`);
  
  const result = await handleApiResponse(
    () => apiClient.get(`/api/users/profile/${encodedIdentifier}`),
    `UserService.getUserProfile (${identifier})`
  );
  
  if (!result.success) {
    logError(`[UserService] Failed to fetch profile for user ${identifier}:`, result.error);
    return null;
  }
  
  return formatUser(result.data); // Ensure only public data is formatted/returned
};

/**
 * Update current user's profile
 * @param {Object} profileData - Data to update in the user profile
 * @returns {Promise<Object>} Updated user profile data or null if error
 */
export const updateUserProfile = async (profileData) => {
  if (!profileData || typeof profileData !== 'object') {
    logError('[UserService] Valid profile data is required');
    return null;
  }
  
  logDebug('[UserService] Updating user profile');
  
  const result = await handleApiResponse(
    () => apiClient.put('/api/users/me', profileData),
    'UserService.updateUserProfile'
  );
  
  if (!result.success) {
    logError('[UserService] Failed to update user profile:', result.error);
    return null;
  }
  
  return formatUser(result.data);
};


// --- Service Object Export ---
export const userService = {
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  // Add other user-related functions here
};

// --- Default Export ---
export default userService;