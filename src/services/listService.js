// File: src/services/listService.js
/**
 * List Service - Backward Compatible Entry Point
 * 
 * This file maintains the original import path and interface
 * while internally using the new modular architecture.
 * 
 * All existing code continues to work without changes.
 */

import { listService } from './list/index';

// Re-export the service for backward compatibility
export { listService };
export default listService;