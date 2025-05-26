/**
 * Setup file for dish service tests
 * 
 * This provides a simplified test setup that doesn't rely on environment variables
 */

// Mock environment variables
process.env.API_BASE_URL = 'http://localhost:5001/api';
process.env.TEST_USER_EMAIL = 'testuser@example.com';
process.env.TEST_USER_PASSWORD = 'testpassword123';
process.env.TEST_USER_USERNAME = 'testuser';
process.env.TEST_ADMIN_EMAIL = 'admin@example.com';
process.env.TEST_ADMIN_PASSWORD = 'adminpassword123';
process.env.TEST_ADMIN_USERNAME = 'adminuser';

// Mock modules
vi.mock('@/services/apiClient', () => ({
  apiClient: vi.fn()
}));

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
