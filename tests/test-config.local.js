// Test configuration with environment variables
process.env.API_BASE_URL = 'http://localhost:5001/api';
process.env.TEST_USER_EMAIL = 'test@example.com';
process.env.TEST_USER_PASSWORD = 'testpass123';
process.env.TEST_USER_USERNAME = 'testuser';
process.env.TEST_ADMIN_EMAIL = 'admin@example.com';
process.env.TEST_ADMIN_PASSWORD = 'adminpass123';
process.env.TEST_ADMIN_USERNAME = 'admin';

console.log('Test configuration loaded');
