import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

async function updateUserPassword(userId, currentPassword, newPassword, token) {
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
    console.error('Error updating password:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function main() {
  const adminToken = process.env.ADMIN_TOKEN; // You'll need to set this
  const userId = 1; // Assuming test user ID is 1
  const currentPassword = 'testpassword123';
  const newPassword = 'testpassword123';

  try {
    console.log('Updating user password...');
    const result = await updateUserPassword(userId, currentPassword, newPassword, adminToken);
    console.log('Password updated successfully:', result);
  } catch (error) {
    console.error('Failed to update password:', error.message);
  }
}

main();
