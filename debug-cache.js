// Debug script to test cache clearing
import listService from './doof-backend/services/listService.js';

const userId = 104;

console.log('=== Testing Service Cache ===');

try {
  // Clear cache if it exists
  if (global.cacheManager && global.cacheManager.clear) {
    global.cacheManager.clear();
    console.log('Cache cleared');
  }

  // Call the service method directly
  const result = await listService.getUserLists(userId, { limit: 2 });
  
  console.log('Service result structure:', {
    success: result.success,
    dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
    dataLength: result.data?.length,
    firstItemCount: result.data?.[0]?.item_count
  });
  
  if (result.data && result.data.length > 0) {
    console.log('\nFirst list details:');
    console.log(`ID: ${result.data[0].id}, Name: ${result.data[0].name}, Count: ${result.data[0].item_count}`);
  }
  
} catch (error) {
  console.error('Service error:', error);
}

process.exit(0); 