import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshot: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // Task for database seeding
      on('task', {
        seedDatabase() {
          // Seed test database with NYC restaurant data
          return null
        },
        clearDatabase() {
          // Clear test data
          return null
        },
        log(message) {
          console.log(message)
          return null
        }
      })

      // Environment-specific configuration
      if (config.env.ENVIRONMENT === 'staging') {
        config.baseUrl = 'https://staging.doof.app'
      } else if (config.env.ENVIRONMENT === 'production') {
        config.baseUrl = 'https://doof.app'
      }

      return config
    },
    env: {
      ENVIRONMENT: 'local',
      API_BASE_URL: 'http://localhost:8000/api',
      TEST_USER_EMAIL: 'test@doof.app',
      TEST_USER_PASSWORD: 'TestPassword123!',
      ADMIN_EMAIL: 'admin@doof.app',
      ADMIN_PASSWORD: 'AdminPassword123!',
      GOOGLE_PLACES_API_KEY: 'test-api-key'
    },
    specPattern: [
      'tests/e2e/workflows/**/*.cy.js',
      'tests/e2e/features/**/*.cy.js'
    ],
    supportFile: 'tests/e2e/support/e2e.js',
    fixturesFolder: 'tests/e2e/fixtures',
    videosFolder: 'tests/e2e/videos',
    screenshotsFolder: 'tests/e2e/screenshots'
  }
}) 