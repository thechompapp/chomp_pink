// Custom test environment for Vitest
import { Environment } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class CustomTestEnvironment extends Environment {
  constructor(environmentOptions, context) {
    super(environmentOptions, context);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();
    
    // Set up global test variables
    this.global.__TEST__ = true;
    this.global.__VITEST__ = true;
    
    // Add path aliases
    this.global.__dirname = __dirname;
    this.global.__filename = __filename;
    
    // Set up fetch mock if needed
    if (typeof this.global.fetch === 'undefined') {
      const { fetch, Headers, Request, Response } = await import('node-fetch');
      this.global.fetch = fetch;
      this.global.Headers = Headers;
      this.global.Request = Request;
      this.global.Response = Response;
    }
    
    // Set up environment variables
    process.env.NODE_ENV = 'test';
    process.env.TZ = 'UTC';
    
    // Set up axios defaults
    const axios = (await import('axios')).default;
    axios.defaults.adapter = require('axios/lib/adapters/http');
    
    // Add cleanup function
    this.global.afterEach(() => {
      // Clean up any test-specific state here
    });
  }

  async teardown() {
    await super.teardown();
    // Clean up any resources here
  }

  getVmContext() {
    return super.getVmContext();
  }

  async handleTestEvent(event) {
    // Handle test events if needed
  }
}
