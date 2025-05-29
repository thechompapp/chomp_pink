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
        
        // Debug: Log authentication context
        console.log('=== Authentication Context ===');
        console.log(`User ID from login: ${userId}`);
        console.log(`Token: ${token.substring(0, 30)}...`);
        
        // Debug: Log request details
        const listNameEncoded = encodeURIComponent(listData.name);
        
        // Try different query approaches to find the list
        const queryApproaches = [
          { name: 'All lists with user ID filter', params: { view: 'all', limit: 100, sort: 'newest', userId } },
          { name: 'Created by user only', params: { view: 'created', limit: 100, sort: 'newest' } },
          { name: 'Search by name', params: { view: 'all', limit: 100, query: listData.name } },
          { name: 'Search by name with user ID', params: { view: 'all', limit: 100, query: listData.name, userId } }
        ];
        
        let foundList = null;
        let listsResponse = null;
        
        for (const approach of queryApproaches) {
          console.log(`\n=== Trying approach: ${approach.name} ===`);
          console.log('Params:', JSON.stringify(approach.params, null, 2));
          
          try {
            // Make the API request with the current approach
            listsResponse = await axios.get('http://localhost:5001/api/lists', {
              params: {
                ...approach.params,
                _t: Date.now() // Prevent caching
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Request-Id': `test-${Date.now()}`,
                'X-User-Id': userId,
                'X-Test-Mode': 'true'
              },
              timeout: 10000
            });
            
            console.log(`Response status: ${listsResponse.status}`);
            
            // Check both possible response structures
            const responseData = listsResponse.data.data?.data || listsResponse.data.data || [];
            console.log(`Found ${responseData.length} lists in response`);
            
            // Log first few list names for debugging
            if (responseData.length > 0) {
              console.log('First few list names:');
              responseData.slice(0, 3).forEach((list, i) => {
                console.log(`  ${i + 1}. ID: ${list.id}, Name: ${list.name}, User ID: ${list.user_id}`);
              });
            }
            
            // Try to find our list
            foundList = responseData.find(list => 
              list.name === listData.name || 
              (list.id && list.id.toString() === createResponse.data.data?.listId?.toString())
            );
            
            if (foundList) {
              console.log(`✓ Found list with ID: ${foundList.id}`);
              console.log('List details:', {
                id: foundList.id,
                name: foundList.name,
                user_id: foundList.user_id,
                is_public: foundList.is_public,
                created_at: foundList.created_at
              });
              
              // Test getting the list by ID
              console.log(`\n=== Testing get list by ID: ${foundList.id} ===`);
              try {
                const listResponse = await axios.get(`http://localhost:5001/api/lists/${foundList.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Request-Id': `test-${Date.now()}`,
                    'X-User-Id': userId,
                    'X-Test-Mode': 'true'
                  },
                  timeout: 10000
                });
                console.log('✓ Successfully fetched list by ID:', JSON.stringify(listResponse.data, null, 2));
                return; // Exit after successful fetch
              } catch (listError) {
                console.error('Error fetching list by ID:', {
                  message: listError.message,
                  status: listError.response?.status,
                  data: listError.response?.data
                });
              }
              break;
            } else {
              console.log('✗ List not found in this response');
            }
          } catch (error) {
            console.error(`Error with ${approach.name}:`, {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data
            });
          }
        }
        
        if (!foundList) {
          console.log('\n✗ Could not find the newly created list in any of the queries');
          if (listsResponse) {
            console.log('Last response data structure:', Object.keys(listsResponse.data));
            console.log('Last response data:', JSON.stringify(listsResponse.data, null, 2));
          }
          
          // Try to find the list directly in the database using raw SQL
          console.log('\n=== Checking database directly for the list ===');
          try {
            // First, let's check if the list exists in the database
            const dbCheckQuery = `
              SELECT id, name, user_id, is_public, created_at 
              FROM lists 
              WHERE user_id = $1 AND name = $2 
              ORDER BY created_at DESC 
              LIMIT 1;
            `;
            
            const dbCheckParams = [userId, listData.name];
            console.log('Executing database query:', dbCheckQuery);
            console.log('With parameters:', dbCheckParams);
            
            const dbCheck = await axios.post('http://localhost:5001/api/query', {
              query: dbCheckQuery,
              params: dbCheckParams
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Request-Id': `test-${Date.now()}`,
                'X-User-Id': userId,
                'X-Test-Mode': 'true',
                'X-Admin-Override': 'true' // This header might be needed for raw queries
              },
              timeout: 10000
            });
            
            console.log('Raw database check result:', JSON.stringify(dbCheck.data, null, 2));
            
            if (dbCheck.data.rows && dbCheck.data.rows.length > 0) {
              const listFromDb = dbCheck.data.rows[0];
              console.log('✓ List found in database but not in API response');
              console.log('This suggests an issue with the API query logic');
              console.log('List details from database:', listFromDb);
              
              // Try to fetch the list by ID directly through the API
              console.log(`\n=== Trying direct fetch by ID: ${listFromDb.id} ===`);
              try {
                const directFetch = await axios.get(`http://localhost:5001/api/lists/${listFromDb.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Request-Id': `test-${Date.now()}`,
                    'X-User-Id': userId,
                    'X-Test-Mode': 'true'
                  },
                  timeout: 10000
                });
                console.log('✓ Successfully fetched list by ID directly:', JSON.stringify(directFetch.data, null, 2));
                
                // If we got here, the list exists but wasn't in the search results
                console.log('\n=== Debugging List Retrieval ===');
                console.log('The list exists in the database and can be fetched by ID, but does not appear in search results.');
                console.log('Possible issues:');
                console.log('1. The list might not be marked as public');
                console.log('2. The list might have a different user_id than expected');
                console.log('3. There might be a transaction that was not committed');
                
                // Check list visibility settings
                console.log('\nList visibility check:');
                console.log(`- List ID: ${listFromDb.id}`);
                console.log(`- User ID: ${listFromDb.user_id} (expected: ${userId})`);
                console.log(`- Is Public: ${listFromDb.is_public}`);
                console.log(`- Created At: ${listFromDb.created_at}`);
                
              } catch (directError) {
                console.error('Error fetching list by ID directly:', {
                  message: directError.message,
                  status: directError.response?.status,
                  data: directError.response?.data
                });
                
                if (directError.response?.status === 404) {
                  console.log('\nThe list was found in the database but the API returns 404.');
                  console.log('This suggests there might be an issue with the list retrieval logic or permissions.');
                }
              }
            } else {
              console.log('✗ List not found in database');
              console.log('This suggests the list was not actually created in the database');
              
              // Check if there was a transaction that wasn't committed
              console.log('\n=== Checking for uncommitted transactions ===');
              const txCheck = await axios.post('http://localhost:5001/api/query', {
                query: 'SELECT * FROM pg_stat_activity WHERE state = $1',
                params: ['idle in transaction']
              }, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  'X-Request-Id': `test-${Date.now()}`,
                  'X-Admin-Override': 'true'
                },
                timeout: 5000
              }).catch(e => ({}));
              
              console.log('Idle transactions:', JSON.stringify(txCheck.data, null, 2));
            }
          } catch (dbError) {
            console.error('Error checking database:', {
              message: dbError.message,
              status: dbError.response?.status,
              data: dbError.response?.data
            });
            console.log('\n=== Debugging Steps ===');
            console.log('1. Check if the list was actually created in the database');
            console.log('2. Verify the user has permission to view the list');
            console.log('3. Check the server logs for any errors during list creation');
            console.log('4. Verify the list is marked as public if trying to view without authentication');
          }
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
