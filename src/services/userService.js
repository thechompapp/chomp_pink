/* src/services/userService.js */
import apiClient, { ApiError } from '@/services/apiClient.js';

// --- Helper Function (if any) ---
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

// Get current user's profile
export const getCurrentUser = async () => {
  const endpoint = '/api/users/me'; // Assuming endpoint for current user
  const context = 'UserService Get Current User';
  try {
    const response = await apiClient(endpoint, context);
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Failed to fetch current user.', response.status || 401, response); // 401 if likely auth issue
    }
    return formatUser(response.data);
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch current user', 500, error);
  }
};

// Get a specific user's public profile by ID or handle
export const getUserProfile = async (identifier) => {
  if (!identifier) throw new ApiError('User ID or handle is required', 400);
  // Adjust endpoint based on whether you use ID or handle
  const endpoint = `/api/users/profile/${encodeURIComponent(String(identifier))}`;
  const context = `UserService Get Profile (${identifier})`;
  try {
    const response = await apiClient(endpoint, context);
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'User profile not found.', response.status || 404, response);
    }
    return formatUser(response.data); // Ensure only public data is formatted/returned
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch user profile', 500, error);
  }
};

// Update current user's profile
export const updateUserProfile = async (profileData) => {
  const endpoint = '/api/users/me'; // Assuming endpoint for updating current user
  const context = 'UserService Update Profile';
  try {
    const response = await apiClient(endpoint, context, {
      method: 'PUT', // or PATCH
      body: JSON.stringify(profileData),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Failed to update profile.', response.status || 500, response);
    }
    return formatUser(response.data);
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to update profile', 500, error);
  }
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