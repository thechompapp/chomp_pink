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
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUser = async () => {
  logDebug('[UserService] Fetching current user profile');
  
  return handleApiResponse(
    () => apiClient.get('/api/users/me'),
    'UserService Get Current User'
  ).then(data => {
    return formatUser(data);
  }).catch(error => {
    logError('[UserService] Failed to fetch current user:', error);
    throw error;
  });
};

/**
 * Get a specific user's public profile by ID or handle
 * @param {string|number} identifier - User ID or handle
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (identifier) => {
  if (!identifier) {
    throw new Error('User ID or handle is required');
  }
  
  const encodedIdentifier = encodeURIComponent(String(identifier));
  logDebug(`[UserService] Fetching profile for user: ${identifier}`);
  
  return handleApiResponse(
    () => apiClient.get(`/api/users/profile/${encodedIdentifier}`),
    `UserService Get Profile (${identifier})`
  ).then(data => {
    return formatUser(data); // Ensure only public data is formatted/returned
  }).catch(error => {
    logError(`[UserService] Failed to fetch profile for user ${identifier}:`, error);
    throw error;
  });
};

/**
 * Update current user's profile
 * @param {Object} profileData - Data to update in the user profile
 * @returns {Promise<Object>} Updated user profile data
 */
export const updateUserProfile = async (profileData) => {
  if (!profileData || typeof profileData !== 'object') {
    throw new Error('Valid profile data is required');
  }
  
  logDebug('[UserService] Updating user profile');
  
  return handleApiResponse(
    () => apiClient.put('/api/users/me', profileData),
    'UserService Update Profile'
  ).then(data => {
    return formatUser(data);
  }).catch(error => {
    logError('[UserService] Failed to update user profile:', error);
    throw error;
  });
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