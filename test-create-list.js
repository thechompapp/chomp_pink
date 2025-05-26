import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const API_BASE_URL = 'http://localhost:5001/api';

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'testuser_curl@example.com',
      password: 'password' // Default test password
    });
    
    console.log('Login successful');
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function createList(token) {
  try {
    const listData = {
      name: `Test List ${Date.now()}`,
      description: 'This is a test list',
      list_type: 'restaurant',
      is_public: true,
      city_name: 'Test City'
    };
    
    console.log('Creating list with data:', listData);
    
    const response = await axios.post(`${API_BASE_URL}/lists`, listData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('List created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create list:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

async function getLists(token) {
  try {
    console.log('Fetching lists...');
    const response = await axios.get(`${API_BASE_URL}/lists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Lists retrieved successfully. Total lists:', response.data.length);
    console.log('First 3 lists:', response.data.slice(0, 3));
    return response.data;
  } catch (error) {
    console.error('Failed to fetch lists:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

async function main() {
  try {
    // Step 1: Login and get token
    console.log('Step 1: Logging in...');
    const token = await login();
    
    // Step 2: Get current lists
    console.log('\nStep 2: Getting current lists...');
    await getLists(token);
    
    // Step 3: Create a new list
    console.log('\nStep 3: Creating a new list...');
    const newList = await createList(token);
    
    // Step 4: Get updated lists
    console.log('\nStep 4: Getting updated lists...');
    const updatedLists = await getLists(token);
    
    // Check if the new list is in the response
    const listExists = updatedLists.some(list => list.id === newList.id);
    console.log(`\nVerification: New list ${listExists ? 'was found' : 'was NOT found'} in the lists response`);
    
    if (!listExists) {
      console.error('ERROR: The newly created list is not appearing in the lists response!');
      console.log('\nDebug Info:');
      console.log('- New list ID:', newList.id);
      console.log('- List IDs in response:', updatedLists.map(list => list.id).join(', '));
      
      // Check database directly
      console.log('\nChecking database directly...');
      const dbCheck = await axios.get(`${API_BASE_URL}/debug/check-list/${newList.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Database check result:', dbCheck.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
