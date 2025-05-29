const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/commands.js',
    specPattern: 'tests/e2e/**/*.cy.js',
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
  },
  env: {
    // Add environment variables here
    apiUrl: 'http://localhost:5001/api',
  },
});
