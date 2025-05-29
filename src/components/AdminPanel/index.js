/**
 * AdminPanel Components Index
 * 
 * Central export point for all AdminPanel-related components.
 * These components are specific to the AdminPanel feature but organized
 * in the main components directory following React conventions.
 */

// Main AdminPanel component
export { default as RefactoredAdminPanel } from './RefactoredAdminPanel';

// Error boundary component
export { AdminPanelErrorFallback, default as AdminPanelErrorBoundary } from './AdminPanelErrorBoundary';

// Default export for convenience
export { default } from './RefactoredAdminPanel'; 