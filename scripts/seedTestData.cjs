// Seed core test data for integration/E2E testing using real API endpoints
// Usage: node scripts/seedTestData.cjs

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5001/api';

const USERS = [
  { email: 'test_testdb@example.com', password: 'password123', name: 'Test User TestDB', username: 'testuser_testdb', role: 'user' },
  { email: 'admin_testdb@example.com', password: 'doof123', name: 'Admin TestDB', username: 'admin_testdb', role: 'admin' }
];

const RESTAURANT = { name: 'Testaurant', address: '123 Test St', city: 'Testville', state: 'TS', zip: '12345' };
const DISH = { name: 'Test Dish', description: 'A delicious test dish', price: 9.99 };
const LIST = { name: 'Test List', description: 'A public test list', isPublic: true };

async function ensureUser(user) {
  // Try by email
  try {
    const res = await axios.get(`${API_BASE}/users/email/${encodeURIComponent(user.email)}`);
    if (res.data && res.data.id) {
      console.log(`User with email ${user.email} already exists (id: ${res.data.id})`);
      return res.data;
    }
  } catch (err) {
    // Not found by email
  }
  // Register user
  try {
    const regRes = await axios.post(`${API_BASE}/auth/register`, user);
    console.log(`Registered user: ${user.email}`);
    return regRes.data.data || regRes.data;
  } catch (err) {
    // If username already exists, try fetching by email again (may have been created with a different email)
    if (err?.response?.data?.error?.code === 'USERNAME_ALREADY_EXISTS') {
      try {
        const res = await axios.get(`${API_BASE}/users/email/${encodeURIComponent(user.email)}`);
        if (res.data && res.data.id) {
          console.log(`User with email ${user.email} found after USERNAME_ALREADY_EXISTS (id: ${res.data.id})`);
          return res.data;
        } else {
          console.warn(`Username '${user.username}' exists but email '${user.email}' does not. Skipping this user.`);
          return null;
        }
      } catch (fetchErr) {
        console.warn(`Username '${user.username}' exists but email '${user.email}' does not. Skipping this user.`);
        return null;
      }
    }
    console.error(`Failed to register user ${user.email}:`, err?.response?.data || err.message);
    throw err;
  }
}

async function loginUser(email, password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data.token || res.data.data?.token;
}

async function ensureRestaurant(token) {
  try {
    const res = await axios.get(`${API_BASE}/restaurants?name=${encodeURIComponent(RESTAURANT.name)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.length > 0) {
      console.log(`Restaurant already exists: ${res.data[0].name}`);
      return res.data[0];
    }
  } catch (err) {}
  const res = await axios.post(`${API_BASE}/restaurants`, RESTAURANT, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Created restaurant: ${res.data.name}`);
  return res.data;
}

async function ensureDish(token, restaurantId) {
  try {
    const res = await axios.get(`${API_BASE}/dishes?name=${encodeURIComponent(DISH.name)}&restaurantId=${restaurantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.length > 0) {
      console.log(`Dish already exists: ${res.data[0].name}`);
      return res.data[0];
    }
  } catch (err) {}
  const res = await axios.post(`${API_BASE}/dishes`, { ...DISH, restaurantId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Created dish: ${res.data.name}`);
  return res.data;
}

async function ensureList(token, userId) {
  try {
    const res = await axios.get(`${API_BASE}/lists?name=${encodeURIComponent(LIST.name)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.length > 0) {
      console.log(`List already exists: ${res.data[0].name}`);
      return res.data[0];
    }
  } catch (err) {}
  const res = await axios.post(`${API_BASE}/lists`, { ...LIST, ownerId: userId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`Created list: ${res.data.name}`);
  return res.data;
}

(async () => {
  try {
    // 1. Ensure users
    const regularUser = await ensureUser(USERS[0]);
    const adminUser = await ensureUser(USERS[1]);
    // 2. Login as regular user
    const userToken = await loginUser(USERS[0].email, USERS[0].password);
    // 3. Create restaurant
    const restaurant = await ensureRestaurant(userToken);
    // 4. Create dish
    await ensureDish(userToken, restaurant.id);
    // 5. Create list
    await ensureList(userToken, regularUser.id);
    console.log('Test data seeded successfully.');
  } catch (err) {
    console.error('Seeding failed:', err?.response?.data || err.message);
    process.exit(1);
  }
})();
