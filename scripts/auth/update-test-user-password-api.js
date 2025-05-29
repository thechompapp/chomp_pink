import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

async function login(email, password) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function updatePassword(userId, currentPassword, newPassword, token) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/${userId}/password`,
      { currentPassword, newPassword },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Password update failed:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  const testEmail = 'test@example.com';
  const currentPassword = 'testpassword123'; // Current password
  const newPassword = 'testpassword123';     // New password (same for now, but can be different)

  try {
    console.log('Logging in...');
    const loginData = await login(testEmail, currentPassword);
    
    if (!loginData?.data?.token) {
      throw new Error('Login failed: No token received');
    }
    
    const token = loginData.data.token;
    const userId = loginData.data.user.id;
    
    console.log('Updating password...');
    const result = await updatePassword(userId, currentPassword, newPassword, token);
    
    console.log('Password updated successfully:', result);
    
    // Verify the new password works
    console.log('Verifying new password...');
    await login(testEmail, newPassword);
    console.log('Password verification successful!');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
