import db from '../config/db.js';

/**
 * Token Blacklist Model
 * Stores invalidated JWT tokens until they expire
 */
class TokenBlacklist {
  /**
   * Add a token to the blacklist
   * @param {string} token - The JWT token to blacklist
   * @param {Date} expiresAt - When the token expires (from JWT exp claim)
   * @returns {Promise<Object>} - The created blacklist entry
   */
  static async addToBlacklist(token, expiresAt) {
    try {
      const result = await db.query(
        'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) RETURNING id',
        [token, expiresAt]
      );
      return { id: result.rows[0].id, token, expiresAt };
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - The JWT token to check
   * @returns {Promise<boolean>} - True if token is blacklisted
   */
  static async isTokenBlacklisted(token) {
    if (!token) {
      console.log('No token provided to isTokenBlacklisted');
      return false;
    }

    try {
      console.log(`Checking if token is blacklisted: ${token.substring(0, 10)}...`);
      const result = await db.query(
        'SELECT * FROM token_blacklist WHERE token = $1',
        [token]
      );
      
      const isBlacklisted = result.rows.length > 0;
      if (isBlacklisted) {
        console.log(`Token is blacklisted: ${token.substring(0, 10)}...`);
        console.log('Blacklist entry:', result.rows[0]);
      } else {
        console.log('Token is not blacklisted');
        // Log the first few tokens in the blacklist for debugging
        const allTokens = await db.query('SELECT token, expires_at FROM token_blacklist LIMIT 5');
        console.log('First few blacklisted tokens:', allTokens.rows);
      }
      
      return isBlacklisted;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // Fail open - if there's an error checking, assume token is not blacklisted
      // This prevents locking users out due to database issues
      return false;
    }
  }

  /**
   * Clean up expired tokens from the blacklist
   * @returns {Promise<number>} - Number of tokens removed
   */
  static async cleanupExpiredTokens() {
    try {
      console.log('Starting cleanup of expired tokens...');
      const result = await db.query(
        'DELETE FROM token_blacklist WHERE expires_at < NOW()'
      );
      
      // For postgres, rowCount contains the number of rows affected
      const affectedRows = result.rowCount || 0;
      
      console.log(`Successfully cleaned up ${affectedRows} expired tokens`);
      return affectedRows;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      // Don't throw, just log the error and return 0
      return 0;
    }
  }
}

export default TokenBlacklist;
