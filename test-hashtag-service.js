/* test-hashtag-service.js */
/**
 * Test script to verify the hashtagService functionality
 * Run this script to test the API client integration and error handling
 */
import { hashtagService } from './src/services/hashtagService.js';
import { logInfo, logError, logDebug } from './src/utils/logger.js';

// Set debug level to show detailed logs
process.env.DEBUG_LEVEL = 'debug';

// Test the getTopHashtags function
async function testGetTopHashtags() {
  logInfo('🧪 Testing getTopHashtags...');
  
  try {
    // Test with default parameters
    const hashtags = await hashtagService.getTopHashtags(10);
    logInfo(`✅ Successfully fetched ${hashtags.length} top hashtags:`, hashtags);
    
    // Test with options object
    const hashtagsWithOptions = await hashtagService.getTopHashtags({ 
      limit: 5, 
      refresh: true 
    });
    logInfo(`✅ Successfully fetched ${hashtagsWithOptions.length} top hashtags with options:`, hashtagsWithOptions);
    
    // Test caching - this should use cached results
    logInfo('Testing cache functionality...');
    const cachedHashtags = await hashtagService.getTopHashtags(10);
    logInfo(`✅ Successfully retrieved ${cachedHashtags.length} hashtags from cache`);
    
    return true;
  } catch (error) {
    logError('❌ Error testing getTopHashtags:', error);
    return false;
  }
}

// Test the searchHashtags function
async function testSearchHashtags() {
  logInfo('🧪 Testing searchHashtags...');
  
  try {
    // Test with a search query
    const query = 'ita'; // Should match "Italian"
    const hashtags = await hashtagService.searchHashtags(query, 5);
    logInfo(`✅ Successfully searched for "${query}" and found ${hashtags.length} hashtags:`, hashtags);
    
    // Test with a different query
    const query2 = 'mex'; // Should match "Mexican"
    const hashtags2 = await hashtagService.searchHashtags(query2, 5);
    logInfo(`✅ Successfully searched for "${query2}" and found ${hashtags2.length} hashtags:`, hashtags2);
    
    // Test cache clearing
    hashtagService.clearCache();
    logInfo('✅ Successfully cleared hashtag cache');
    
    return true;
  } catch (error) {
    logError('❌ Error testing searchHashtags:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  logInfo('🚀 Starting hashtag service tests...');
  
  const topHashtagsResult = await testGetTopHashtags();
  const searchHashtagsResult = await testSearchHashtags();
  
  const allPassed = topHashtagsResult && searchHashtagsResult;
  
  if (allPassed) {
    logInfo('✅ All hashtag service tests passed!');
  } else {
    logError('❌ Some hashtag service tests failed.');
  }
  
  return allPassed;
}

// Execute tests
runTests().catch(error => {
  logError('❌ Unhandled error during tests:', error);
  process.exit(1);
});
