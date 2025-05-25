import axios from 'axios';

// Check online status
async function checkOnlineStatus() {
  try {
    const response = await axios.get('http://localhost:5001/api/health', {
      timeout: 5000
    });
    return response.data.status === 'UP';
  } catch (error) {
    console.error('Offline or server error:', error.message);
    return false;
  }
}

// Retry wrapper with exponential backoff
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function testApi() {
  // Check online status first
  const isOnline = await checkOnlineStatus();
  if (!isOnline) {
    console.error('Error: Backend server is not reachable. Please ensure the server is running.');
    return;
  }
  console.log('✓ Backend server is online');
  try {
    // Login to get a token with retry
    console.log('\n=== Testing Authentication ===');
    const loginResponse = await withRetry(async () => {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: 'newtest@example.com',
        password: 'testpassword123'
      });
      return response;
    });

    console.log('Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data || !loginResponse.data.data || !loginResponse.data.data.token) {
      throw new Error('Invalid login response - missing token');
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user || {};
    const userId = user.id;
    const username = user.username || user.email || 'testuser';
    
    if (!userId) {
      throw new Error('Could not determine user ID from login response');
    }
    
    console.log(`Login successful. User ID: ${userId}, Username: ${username}`);
    console.log('Token:', token);

    // Test getting lists with retry
    console.log('\n=== Testing List Retrieval ===');
    const listsResponse = await withRetry(async () => {
      const response = await axios.get('http://localhost:5001/api/lists', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-Id': `test-${Date.now()}`
        },
        params: {
          view: 'all',
          limit: 10,
          sort: 'newest'
        },
        timeout: 10000
      });
      return response;
    });
    
    console.log('✓ Successfully retrieved lists');
    console.log('Lists response status:', listsResponse.status);
    console.log('Lists response headers:', JSON.stringify(listsResponse.headers, null, 2));
    console.log('Lists response data:', JSON.stringify(listsResponse.data, null, 2));
    
    // Store the first list if available for testing
    let firstList = null;
    if (listsResponse.data?.data?.length > 0) {
      firstList = listsResponse.data.data[0];
      console.log('First list in response:', {
        id: firstList.id,
        name: firstList.name,
        type: firstList.list_type,
        item_count: firstList.item_count,
        created_at: firstList.created_at
      });
    } else {
      console.log('No lists found in the response');
    }

    // Test creating a list with all required fields
    console.log('\n=== Testing List Creation ===');
    
    const listData = {
      name: `Test List ${Date.now()}`, // Make name unique with timestamp
      description: 'A test list created via API',
      list_type: 'restaurant',
      is_public: true,
      tags: ['test', 'api-created'],
      city_name: 'Test City',
      // Include user information
      user_id: userId,
      creator_handle: username,
      // Additional metadata that might be needed
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        name: 'Test Location'
      }
    };
    
    console.log('List data being sent:', JSON.stringify(listData, null, 2));
    
    console.log('Creating list with data:', JSON.stringify(listData, null, 2));
    
    let createListResponse;
    try {
      console.log('Sending list creation request...');
      createListResponse = await axios({
        method: 'post',
        url: 'http://localhost:5001/api/lists',
        data: listData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-Id': `test-${Date.now()}`
        },
        timeout: 10000, // 10 second timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: status => status < 500 // Don't throw on 4xx errors
      });
      console.log('Received response from server');
    } catch (error) {
      console.error('\n❌ Error creating list:');
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received. Request details:', {
          method: error.request.method,
          path: error.request.path,
          host: error.request.host,
          protocol: error.request.protocol
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      console.error('Error config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      });
      throw error;
    }
    
    console.log('Create list status:', createListResponse.status);
    console.log('Create list response headers:', JSON.stringify(createListResponse.headers, null, 2));
    console.log('Create list response data:', JSON.stringify(createListResponse.data, null, 2));
    
    if (createListResponse.data && createListResponse.data.success) {
      console.log('✓ Successfully created a new list!');
      
      // The response structure is: { success, message, data: { item_count } }
      // Let's try to fetch the list we just created
      try {
        console.log('\n=== Fetching lists to find the newly created one ===');
        
        // First, try to get the location header if it exists
        const locationHeader = createListResponse.headers['location'] || createListResponse.headers['Location'];
        if (locationHeader) {
          console.log(`Found location header: ${locationHeader}`);
          try {
            const listResponse = await axios.get(`http://localhost:5001${locationHeader}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              },
              timeout: 5000
            });
            console.log('✓ Successfully fetched list from location header:', JSON.stringify(listResponse.data, null, 2));
            return; // Exit after successful fetch
          } catch (locationError) {
            console.error('Error fetching from location header, falling back to list search:', locationError.message);
          }
        }
        
        // If no location header or fetch failed, search for the list
        console.log('No location header found, searching for the list...');
        
        // Wait a moment to ensure the list is available
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Fetching lists with params:', {
          view: 'all',
          limit: 10,
          sort: 'newest',
          userId: userId // Include user ID in the request
        });
        
        const listsResponse = await axios.get('http://localhost:5001/api/lists', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'X-Request-Id': `test-${Date.now()}`,
            'X-User-Id': userId // Include user ID in headers as well
          },
          params: {
            view: 'all',
            limit: 10,
            sort: 'newest',
            userId: userId // Include user ID in query params
          },
          timeout: 10000
        });
        
        console.log('Fetched lists response status:', listsResponse.status);
        console.log('Fetched lists response data:', JSON.stringify(listsResponse.data, null, 2));
        
        if (listsResponse.data?.data?.length > 0) {
          const latestList = listsResponse.data.data[0];
          console.log('✓ Latest list:', {
            id: latestList.id,
            name: latestList.name,
            type: latestList.list_type,
            item_count: latestList.item_count,
            created_at: latestList.created_at
          });
          
          // Test getting the list by ID
          console.log(`\n=== Testing get list by ID: ${latestList.id} ===`);
          try {
            const listResponse = await axios.get(`http://localhost:5001/api/lists/${latestList.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              },
              timeout: 5000
            });
            console.log('✓ Successfully fetched list by ID:', JSON.stringify(listResponse.data, null, 2));
          } catch (listError) {
            console.error('Error fetching list by ID:', listError.response?.data || listError.message);
          }
          
          console.log('\n✓ List created successfully! You can now add items to it.');
        } else {
          console.log('✓ List created successfully, but no lists were returned in the response.');
        }
      } catch (fetchError) {
        console.error('Error fetching list details:', {
          message: fetchError.message,
          response: fetchError.response?.data,
          status: fetchError.response?.status,
          headers: fetchError.response?.headers
        });
        console.log('✓ List created successfully, but there was an error fetching the list details.');
      }
    } else {
      console.error('❌ List creation failed:', createListResponse.data?.message || 'Unknown error');
      if (createListResponse.data?.data) {
        console.error('Validation errors:', createListResponse.data.data);
      }
    }

  } catch (error) {
    console.error('Error:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    } : error.message);
  }
}

testApi().catch(console.error);
