import TokenBlacklist from '../models/tokenBlacklistModel.js';

/**
 * Cleans up expired tokens from the blacklist
 * @returns {Promise<{success: boolean, count: number, error: Error|null}>}
 */
export const cleanupExpiredTokens = async () => {
  try {
    console.log('Starting cleanup of expired tokens...');
    const count = await TokenBlacklist.cleanupExpiredTokens();
    console.log(`Successfully cleaned up ${count} expired tokens`);
    return { success: true, count, error: null };
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return { success: false, count: 0, error };
  }
};

// Run cleanup on a schedule (every hour)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Starts the periodic token cleanup job
 */
export const startTokenCleanupJob = () => {
  // Run immediately on startup
  cleanupExpiredTokens().catch(console.error);
  
  // Then run on schedule
  return setInterval(() => {
    cleanupExpiredTokens().catch(console.error);
  }, CLEANUP_INTERVAL_MS);
};

// Check if this module is being run directly (for testing)
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  console.log('Running token cleanup directly...');
  cleanupExpiredTokens()
    .then(() => {
      console.log('Token cleanup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to clean up tokens:', error);
      process.exit(1);
    });
}
