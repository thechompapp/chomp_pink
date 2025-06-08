// Simple test script to debug frontend service 
import { execSync } from 'child_process';

// Mock the frontend service logic
async function testFrontendService() {
  console.log('🔍 Testing frontend service logic...\n');
  
  try {
    // 1. Test direct API call
    console.log('1. Direct API call:');
    const curlCommand = `curl -s "http://localhost:5175/api/lists?isPublic=true&limit=2"`;
    const rawResponse = execSync(curlCommand, { encoding: 'utf8' });
    const apiData = JSON.parse(rawResponse);
    
    console.log('   Raw API Response:', {
      success: apiData.success,
      dataLength: apiData.data?.length,
      firstItemCount: apiData.data?.[0]?.item_count,
      fullResponse: apiData
    });
    
    // 2. Simulate frontend service parsing logic (from listService.js)
    console.log('\n2. Frontend service parsing simulation:');
    
    let result = {
      success: true,
      message: 'Success', 
      data: [],
      pagination: {
        page: 1,
        limit: 2,
        total: 0,
        totalPages: 0
      }
    };
    
    // Mimic the nested structure handling from listService.js
    if (apiData && apiData.data && Array.isArray(apiData.data)) {
      console.log('   ✅ Using Case 2c: response.data.data (double-nested)');
      result.data = apiData.data; // Extract the actual list items
      
      // Handle pagination if available
      if (apiData.pagination) {
        result.pagination = {
          ...result.pagination,
          ...apiData.pagination,
          page: apiData.pagination.page || result.pagination.page,
          limit: apiData.pagination.limit || result.pagination.limit,
          total: apiData.pagination.total || apiData.data.length,
          totalPages: apiData.pagination.totalPages || 
                     Math.ceil((apiData.pagination.total || apiData.data.length) / (apiData.pagination.limit || result.pagination.limit))
        };
      } else {
        // Use total from the response.data if available, otherwise use array length
        result.pagination.total = apiData.total || apiData.data.length;
        result.pagination.totalPages = Math.ceil(result.pagination.total / result.pagination.limit);
      }
    }
    
    console.log('   Parsed result:', {
      success: result.success,
      dataLength: result.data.length,
      firstItemCount: result.data[0]?.item_count,
      pagination: result.pagination
    });
    
    // 3. Check what would be displayed in UI
    console.log('\n3. UI Display Simulation:');
    result.data.forEach((list, index) => {
      console.log(`   List ${index + 1}: "${list.name}" - ${list.item_count} items (created: ${list.created_at?.substring(0, 10)})`);
    });
    
    // 4. Check if the issue is in component rendering
    console.log('\n4. Component Data Check:');
    console.log('   Data being passed to components:', {
      hasData: result.data.length > 0,
      firstListStructure: result.data[0] ? Object.keys(result.data[0]) : 'no data',
      itemCountValues: result.data.map(list => list.item_count)
    });
    
    // 5. Test the service wrapper behavior (check if it's caching old data)
    console.log('\n5. Service wrapper behavior test:');
    const withServiceParams = `curl -s "http://localhost:5175/api/lists?isPublic=true&limit=2&page=1&sortBy=popularity&sortOrder=desc"`;
    const serviceResponse = execSync(withServiceParams, { encoding: 'utf8' });
    const serviceData = JSON.parse(serviceResponse);
    
    console.log('   Service wrapper response:', {
      success: serviceData.success,
      dataLength: serviceData.data?.length,
      firstItemCount: serviceData.data?.[0]?.item_count,
      isMatchingPrevious: JSON.stringify(serviceData.data) === JSON.stringify(apiData.data)
    });
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testFrontendService(); 