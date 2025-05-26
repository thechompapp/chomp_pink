import { registerTestUser } from './auth-helper.js';

/**
 * Creates a test user if it doesn't exist
 */
export const setupTestUser = async () => {
  console.log('Setting up test user...');
  
  const testUser = {
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  };

  try {
    // Try to register the test user
    const result = await registerTestUser(testUser);
    
    if (result.success) {
      console.log('Test user created successfully');
    } else if (result.error?.includes('already exists')) {
      console.log('Test user already exists');
    } else {
      console.error('Failed to create test user:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('Error setting up test user:', error);
    return false;
  }
};

// Run the setup if this file is executed directly
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  
  describe('Test User Setup', () => {
    it('should set up a test user', async () => {
      const success = await setupTestUser();
      expect(success).toBe(true);
    });
  });
}
