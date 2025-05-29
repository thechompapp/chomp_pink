/**
 * Test data factories and utilities
 */

export const createTestUser = (overrides = {}) => ({
  email: `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
  password: 'password123',
  username: `user-${Math.random().toString(36).substr(2, 5)}`,
  role: 'user',
  ...overrides,
});

export const createTestRestaurant = (overrides = {}) => ({
  name: `Restaurant ${Math.random().toString(36).substr(2, 5)}`,
  description: 'Test restaurant description',
  address: '123 Test St, Test City',
  cuisine: 'Test Cuisine',
  price_range: '$$',
  ...overrides,
});

export const createTestDish = (overrides = {}) => ({
  name: `Dish ${Math.random().toString(36).substr(2, 5)}`,
  description: 'Test dish description',
  price: '12.99',
  category: 'Main',
  ...overrides,
});
