/**
 * FloatingQuickAdd - Backward Compatible Entry Point
 * 
 * This file maintains the original import path and interface
 * while internally using the new modular architecture.
 * 
 * All existing code continues to work without changes.
 */

import FloatingQuickAdd from './FloatingQuickAdd/FloatingQuickAdd';

// Re-export the component for backward compatibility
export default FloatingQuickAdd; 