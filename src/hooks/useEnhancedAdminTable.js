/**
 * Enhanced Admin Table Hook - Legacy File
 * 
 * @deprecated This file has been refactored into smaller, more maintainable hooks.
 * Please use the new hooks in src/hooks/admin/ for new development:
 * 
 * - useAdminTable (main orchestrator)
 * - useAdminTableData (data fetching)
 * - useAdminTableMutations (CRUD operations)
 * - useAdminTableSelection (row selection)
 * - useAdminTableFiltering (filtering & pagination)
 * 
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Import the refactored version
import { useEnhancedAdminTable as useAdminTableRefactored } from './admin/useAdminTable';

/**
 * @deprecated Use the refactored hooks in src/hooks/admin/ instead
 */
export const useEnhancedAdminTable = useAdminTableRefactored;

export default useEnhancedAdminTable; 