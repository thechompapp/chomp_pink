// Test setup file
import '@testing-library/jest-dom';

// Mock axios globally
import axios from 'axios/dist/node/axios.cjs';
import MockAdapter from 'axios-mock-adapter';

// Create a global mock adapter
global.mockAxios = new MockAdapter(axios);

// Reset mocks after each test
afterEach(() => {
  global.mockAxios.reset();
});
