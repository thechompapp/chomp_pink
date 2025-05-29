/**
 * Password Service
 * 
 * Handles password-related operations (reset, change)
 */
import { getDefaultApiClient } from '@/services/http';
import { logDebug, logError } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers.js';

const API_ENDPOINT = '/auth';

/**
 * PasswordService - Handles password-related operations
 */
const PasswordService = {
  /**
   * Requests a password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Success status or error object
   */
  async requestPasswordReset(email) {
    logDebug('[PasswordService] Requesting password reset for email:', email);
    
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/request-password-reset`, { email }),
      'PasswordService.requestPasswordReset'
    );
    
    if (result.success) {
      logDebug('[PasswordService] Password reset email sent successfully');
    } else {
      logDebug('[PasswordService] Failed to send password reset email');
    }
    
    return result.success 
      ? { success: true, message: 'Password reset email sent successfully' }
      : { success: false, error: result.error };
  },

  /**
   * Resets the user's password using a reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success status
   */
  async resetPassword(token, newPassword) {
    logDebug('[PasswordService] Attempting to reset password with token');
    
    if (!token || !newPassword) {
      return { success: false, error: 'Token and new password are required' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/reset-password`, { token, newPassword }),
      'PasswordService.resetPassword'
    );
    
    if (result.success) {
      logDebug('[PasswordService] Password reset successfully');
    } else {
      logDebug('[PasswordService] Failed to reset password');
    }
    
    return result.success 
      ? { success: true, message: 'Password reset successfully' }
      : { success: false, error: result.error };
  },

  /**
   * Changes the user's password (when already authenticated)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success status
   */
  async changePassword(currentPassword, newPassword) {
    logDebug('[PasswordService] Attempting to change password');
    
    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Current password and new password are required' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/change-password`, { currentPassword, newPassword }),
      'PasswordService.changePassword'
    );
    
    if (result.success) {
      logDebug('[PasswordService] Password changed successfully');
    } else {
      logDebug('[PasswordService] Failed to change password');
    }
    
    return result.success 
      ? { success: true, message: 'Password changed successfully' }
      : { success: false, error: result.error };
  },

  /**
   * Validates password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength score and feedback
   */
  validatePasswordStrength(password) {
    if (!password) {
      return { 
        isValid: false, 
        score: 0,
        feedback: 'Password is required'
      };
    }
    
    // Basic password validation rules
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Calculate strength score (0-4)
    let score = 0;
    if (password.length >= minLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChars) score++;
    
    // Generate feedback
    let feedback = '';
    if (password.length < minLength) {
      feedback += 'Password should be at least 8 characters long. ';
    }
    if (!hasUppercase) {
      feedback += 'Add uppercase letters. ';
    }
    if (!hasLowercase) {
      feedback += 'Add lowercase letters. ';
    }
    if (!hasNumbers) {
      feedback += 'Add numbers. ';
    }
    if (!hasSpecialChars) {
      feedback += 'Add special characters. ';
    }
    
    // Determine if password is valid (score of 3 or higher)
    const isValid = score >= 3;
    
    return {
      isValid,
      score,
      feedback: feedback || 'Password is strong',
      strengthLabel: [
        'Very weak',
        'Weak',
        'Fair',
        'Good',
        'Strong'
      ][score]
    };
  }
};

export default PasswordService;
