export default {
  "test": {
    "environment": "jsdom",
    "setupFiles": [
      "./src/tests/setup.js"
    ],
    "include": [
      "./tests/*-integration-tests.{js,jsx}"
    ],
    "timeout": 20000
  }
};