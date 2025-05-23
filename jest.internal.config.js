module.exports = {
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": [
    "<rootDir>/src/tests/setup.js"
  ],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "testMatch": [
    "<rootDir>/tests/*-integration-tests.js"
  ],
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}",
    "doof-backend/**/*.js",
    "!src/tests/**",
    "!**/*.test.js",
    "!**/*.config.js"
  ],
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "coverageDirectory": "/Users/naf/Downloads/doof/coverage",
  "collectCoverage": false
};