// Simple script to test API endpoints
import axios from 'axios';

// Configure axios for testing
const api = axios.create({
  baseURL: 'http://localhost:5173/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Test endpoints
async function testEndpoints() {
  console.log('🧪 Testing API endpoints...');
  
  try {
    console.log('\n📋 Testing /filters/cities');
    const citiesResponse = await api.get('/filters/cities');
    console.log('✅ Success:', citiesResponse.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
  }
  
  try {
    console.log('\n📋 Testing /hashtags/top');
    const hashtagsResponse = await api.get('/hashtags/top');
    console.log('✅ Success:', hashtagsResponse.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
  }
  
  try {
    console.log('\n📋 Testing /lists');
    const listsResponse = await api.get('/lists', {
      params: {
        page: 1,
        limit: 10,
        isPublic: true
      }
    });
    console.log('✅ Success:', listsResponse.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    }
  }
}

// Run tests
testEndpoints();
