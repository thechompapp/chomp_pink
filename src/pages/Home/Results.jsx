/**
 * Results Component - Legacy File
 * 
 * @deprecated This file has been refactored into smaller, more maintainable components.
 * Please use the new components in src/pages/Home/Results/ for new development:
 * 
 * - Results/index.jsx (main orchestrator)
 * - Results/useResultsData.js (data fetching)
 * - Results/useResultsModal.js (modal state management)
 * - Results/useResultsEvents.js (event handling)
 * - Results/ResultsContent.jsx (infinite scroll content)
 * - Results/ResultsStates.jsx (loading/error/empty states)
 * - Results/ItemSkeleton.jsx (skeleton loading)
 * 
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Import the refactored version
import Results from './Results/index.jsx';

export default Results;