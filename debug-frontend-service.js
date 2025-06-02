// Debug script to test frontend listService.getListItems
import axios from 'axios';

// Simple API client setup
const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
});

// Simple handleApiResponse function
const handleApiResponse = async (apiCall, context) => {
  try {
    const response = await apiCall();
    console.log(`[${context}] Raw axios response:`, {
      status: response.status,
      data: response.data
    });
    
    // If the response is already in the expected format, return it directly
    if (typeof response.data === 'object' && 'success' in response.data) {
      return {
        success: response.data.success !== undefined ? response.data.success : true,
        message: response.data.message || 'Operation successful',
        data: response.data.data !== undefined ? response.data.data : (Array.isArray(response.data) ? response.data : []),
        ...(response.data.pagination && { pagination: response.data.pagination })
      };
    }
    
    // Handle various response formats to normalize them
    if (response?.data !== undefined) {
      return {
        success: true,
        message: 'Operation successful',
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: 'Unrecognized API response format',
      data: []
    };
  } catch (error) {
    console.error(`[${context}] API Error:`, error.message);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
};

// Test the getListItems function
async function testGetListItems() {
  console.log('Testing getListItems for list 58...');
  
  const result = await handleApiResponse(
    () => apiClient.get('/lists/58/items'),
    'TestScript.getListItems'
  );
  
  console.log('Final result:', result);
  console.log('Result data type:', typeof result.data);
  console.log('Result data is array:', Array.isArray(result.data));
  console.log('Result data length:', result.data?.length);
  
  if (Array.isArray(result.data) && result.data.length > 0) {
    console.log('First item:', result.data[0]);
  }
}

testGetListItems().catch(console.error); 