/**
 * Authentication test utilities
 */

export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'doof123',
    username: 'admin',
    role: 'admin'
  },
  user: {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    role: 'user'
  }
};

export const login = async (page, user) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
};

export const logout = async (page) => {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/login');
};
