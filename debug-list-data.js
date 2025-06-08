// Debug script to test list data structure
import { listService } from './src/services/listService.js';

async function testListDataStructure() {
  console.log('=== Testing List Data Structure ===\n');
  
  try {
    // Test getting lists
    console.log('1. Testing getLists...');
    const listsResult = await listService.getLists({ limit: 5 });
    console.log('Lists result structure:', {
      success: listsResult.success,
      hasData: !!listsResult.data,
      dataIsArray: Array.isArray(listsResult.data),
      dataLength: listsResult.data?.length,
      firstListId: listsResult.data?.[0]?.id,
      firstListItemCount: listsResult.data?.[0]?.item_count
    });
    
    if (listsResult.data && listsResult.data.length > 0) {
      const testListId = listsResult.data[0].id;
      console.log(`\n2. Testing getListItems for list ${testListId}...`);
      
      // Test getting list items
      const itemsResult = await listService.getListItems(testListId);
      console.log('Items result structure:', {
        success: itemsResult.success,
        hasData: !!itemsResult.data,
        dataIsArray: Array.isArray(itemsResult.data),
        dataLength: itemsResult.data?.length,
        firstItemStructure: itemsResult.data?.[0] ? Object.keys(itemsResult.data[0]) : 'no items'
      });
      
      console.log('\n3. Testing getListDetails...');
      const detailsResult = await listService.getListDetails(testListId);
      console.log('Details result structure:', {
        success: detailsResult.success,
        hasData: !!detailsResult.data,
        dataKeys: detailsResult.data ? Object.keys(detailsResult.data) : 'no data',
        hasItemCount: 'item_count' in (detailsResult.data || {}),
        itemCount: detailsResult.data?.item_count
      });
    }
    
  } catch (error) {
    console.error('Error testing list data structure:', error);
  }
}

// Run the test
testListDataStructure(); 