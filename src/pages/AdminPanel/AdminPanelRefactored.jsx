/**
 * Admin Panel Backward Compatibility Wrapper
 * 
 * This wrapper maintains full backward compatibility while using the new
 * refactored AdminPanel architecture. Existing imports will continue to work
 * seamlessly while benefiting from the improved modular design.
 * 
 * Key improvements from refactoring:
 * - 821 lines → 339 lines main component (59% reduction)
 * - Single Responsibility Principle compliance
 * - Improved testability and maintainability
 * - Better error handling and state management
 */

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import RefactoredAdminPanel from '@/components/AdminPanel/RefactoredAdminPanel';
import { AdminPanelErrorFallback } from '@/components/AdminPanel/AdminPanelErrorBoundary';

/**
 * Main Admin Panel Component with Error Boundary
 * 
 * This component maintains the same API as the original AdminPanel
 * while using the new modular architecture underneath.
 * 
 * @returns {JSX.Element} Admin panel with error boundary
 */
const AdminPanelRefactored = () => {
  return (
    <ErrorBoundary
      FallbackComponent={AdminPanelErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[AdminPanel] Error caught by boundary:', error);
          console.error('[AdminPanel] Error info:', errorInfo);
        }
        
        // In production, you might want to log to an error tracking service
        // logErrorToService(error, errorInfo);
      }}
      onReset={() => {
        // Reset any global state if needed
        console.log('[AdminPanel] Resetting after error');
      }}
    >
      <RefactoredAdminPanel />
    </ErrorBoundary>
  );
};

// Export for backward compatibility
export default AdminPanelRefactored;

// Named exports for flexibility
export { RefactoredAdminPanel, AdminPanelErrorFallback };

// Legacy compatibility - export as original name
export const AdminPanel = AdminPanelRefactored; 