/**
 * API Configuration Override
 * 
 * This module overrides the default API configuration for tests to ensure
 * they use the correct backend URL. It should be imported at the top of 
 * test files to ensure the override takes effect before any API calls are made.
 */

// Override the global process.env for tests
process.env.VITE_API_BASE_URL = 'http://localhost:5001';
process.env.VITE_FRONTEND_URL = 'http://localhost:5175';
process.env.VITE_MOCK_API_ENABLED = 'false';

// Log the override
console.log('🔧 API Configuration Override:');
console.log(`   Backend URL: ${process.env.VITE_API_BASE_URL}`);
console.log(`   Frontend URL: ${process.env.VITE_FRONTEND_URL}`);
console.log(`   Mock API Enabled: ${process.env.VITE_MOCK_API_ENABLED}`);

// Export the configuration for reference
export const API_CONFIG = {
  BACKEND_URL: process.env.VITE_API_BASE_URL,
  FRONTEND_URL: process.env.VITE_FRONTEND_URL,
  MOCK_API_ENABLED: process.env.VITE_MOCK_API_ENABLED === 'true'
};

// Export a function to verify the backend server is available
export async function verifyBackendServer() {
  const url = `${API_CONFIG.BACKEND_URL}/api/health`;
  
  try {
    console.log(`Checking connection to ${url}...`);
    
    // Use fetch instead of axios to avoid any configuration issues
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Backend server returned status ${response.status}`);
    }
    
    console.log('✅ Backend server is connected and ready for tests');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ BACKEND SERVER IS NOT AVAILABLE');
    console.error('Error details:', error.message);
    throw new Error('Backend server MUST be running to execute these tests. Please start the server and try again.');
  }
}
