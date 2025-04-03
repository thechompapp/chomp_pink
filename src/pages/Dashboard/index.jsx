// src/pages/Dashboard/index.jsx
// UPDATE: Use useSubmissionStore
import React, { useState, useEffect, useCallback, useRef } from "react";
// Import specific stores needed
import useSubmissionStore from '@/stores/useSubmissionStore';
import useTrendingStore from '@/stores/useTrendingStore'; // Keep for duplicate checking for now
// Other imports
import Button from "@/components/Button";
import { Loader2, AlertTriangle } from "lucide-react"; // Added AlertTriangle

const Dashboard = () => {
  // Select state and actions from useSubmissionStore
  const pendingSubmissions = useSubmissionStore(state => state.pendingSubmissions);
  const fetchPendingSubmissions = useSubmissionStore(state => state.fetchPendingSubmissions);
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  // Get loading/error state from the store
  const isLoadingSubmissions = useSubmissionStore(state => state.isLoading);
  const submissionError = useSubmissionStore(state => state.error);

  // Still need trending items for duplicate checking (consider moving duplicate check logic)
  const trendingItems = useTrendingStore(state => state.trendingItems);

  // Local state for UI interactions
  const [mergeTarget, setMergeTarget] = useState(null); // { submissionId, targetId, targetName }
  const [processingId, setProcessingId] = useState(null); // ID of the submission being approved/rejected/merged
  const [localError, setLocalError] = useState(null); // For errors specific to this component's actions

  const fetchAttempted = useRef(false);

  // Fetch initial data using the store action
  const loadInitialData = useCallback(async () => {
    if (fetchAttempted.current || isLoadingSubmissions) return; // Prevent refetch if already attempted or loading
    fetchAttempted.current = true;
    setLocalError(null); // Clear local errors on fetch attempt
    console.log("[Dashboard] loadInitialData triggered via store action.");
    try {
      await fetchPendingSubmissions();
      console.log("[Dashboard] fetchPendingSubmissions completed.");
      // Data and loading/error state are handled by the store
    } catch (err) {
      // Error is already set in the store, but log it here too
      console.error("[Dashboard] Error during fetchPendingSubmissions:", err);
      // Optional: setLocalError("Could not load submissions initially.")
    }
  }, [fetchPendingSubmissions, isLoadingSubmissions]);

  // Effect to load data on mount
  useEffect(() => {
    console.log("[Dashboard] Mount useEffect running loadInitialData.");
    loadInitialData();
  }, [loadInitialData]);

  // Duplicate finding logic (remains the same for now)
  const findDuplicates = useCallback((submission) => {
    // ... (keep existing duplicate logic using trendingItems) ...
    if (submission.type !== 'restaurant' || !Array.isArray(trendingItems)) return [];
    const subNameLower = submission.name?.toLowerCase();
    const subCityLower = submission.city?.toLowerCase();
    const subNeighborhoodLower = submission.neighborhood?.toLowerCase();

    return trendingItems.filter((existing) => {
        if(!existing) return false; // Skip if existing item is invalid
      const existingNameLower = existing.name?.toLowerCase();
      const existingCityLower = existing.city_name?.toLowerCase() || existing.city?.toLowerCase(); // Check both possible city name fields
      const existingNeighborhoodLower = existing.neighborhood_name?.toLowerCase() || existing.neighborhood?.toLowerCase(); // Check both possible neighborhood fields

      // Basic check: name and city must match
      if (existingNameLower !== subNameLower || existingCityLower !== subCityLower) return false;

      // Neighborhood check: either both exist and match, or both are null/undefined
      const neighborhoodsMatch = (existingNeighborhoodLower === subNeighborhoodLower) ||
                                 (!existingNeighborhoodLower && !subNeighborhoodLower);

      return neighborhoodsMatch;
    });
  }, [trendingItems]);

  // --- Action Handlers (using store actions) ---
  const handleApprove = useCallback(async (submissionId) => {
    if (processingId) return; // Prevent concurrent actions
    setProcessingId(submissionId);
    setLocalError(null);
    try {
      await approveSubmission(submissionId);
      console.log(`[Dashboard] Submission ${submissionId} approved action completed.`);
      // Data removal from pendingSubmissions is handled by the store
      // Optional: trigger a refetch if needed, though store should update state
      // await fetchPendingSubmissions();
    } catch (err) {
      console.error(`[Dashboard] Failed to approve submission ${submissionId}:`, err);
      setLocalError(`Approval failed: ${err.message || "Unknown error"}`);
    } finally {
      setProcessingId(null);
      setMergeTarget(null); // Reset merge target after action
    }
  }, [approveSubmission, processingId]); // Removed fetchPendingSubmissions dependency

  const handleReject = useCallback(async (submissionId) => {
     if (processingId) return;
     setProcessingId(submissionId);
     setLocalError(null);
     try {
       await rejectSubmission(submissionId);
       console.log(`[Dashboard] Submission ${submissionId} reject action completed.`);
       // Data removal from pendingSubmissions is handled by the store
     } catch (err) {
       console.error(`[Dashboard] Failed to reject submission ${submissionId}:`, err);
       setLocalError(`Rejection failed: ${err.message || "Unknown error"}`);
     } finally {
       setProcessingId(null);
       setMergeTarget(null); // Reset merge target after action
     }
   }, [rejectSubmission, processingId]); // Removed fetchPendingSubmissions dependency

  const handleSelectMerge = useCallback((submissionId, targetId, targetName) => {
    setMergeTarget({ submissionId, targetId, targetName });
    setLocalError(null); // Clear errors when selecting merge
  }, []);

  const handleConfirmMerge = useCallback(async () => {
    if (!mergeTarget || processingId) return;
    console.log(`[Dashboard] Confirming merge - Approving submission ${mergeTarget.submissionId} (target: ${mergeTarget.targetId})`);
    // Merging implies approving the submission
    await handleApprove(mergeTarget.submissionId);
    // Backend should handle associating with the targetId upon approval if merge is intended
  }, [mergeTarget, handleApprove, processingId]);

  // --- Render Logic ---
  return (
    // Using lighter background for consistency if PageContainer doesn't force one
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8"> {/* Adjusted padding */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1> {/* Adjusted margin */}

        {/* Display Store Error */}
        {submissionError && !isLoadingSubmissions && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
                <span>Error loading submissions: {submissionError}</span>
                <Button onClick={loadInitialData} variant="tertiary" size="sm" className="ml-4">Retry</Button>
            </div>
        )}
        {/* Display Local Action Error */}
        {localError && (
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{localError}</span>
             <button onClick={() => setLocalError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
           </div>
         )}

        {/* Loading State */}
        {isLoadingSubmissions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
            <p className="text-gray-500">Loading pending submissions...</p>
          </div>
        // Empty State (check after loading and no error)
        ) : !submissionError && (!Array.isArray(pendingSubmissions) || pendingSubmissions.length === 0) ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="text-gray-500">No pending submissions to review.</p>
          </div>
        // Display Submissions
        ) : (
          <div className="space-y-4"> {/* Reduced space */}
            {Array.isArray(pendingSubmissions) && pendingSubmissions.map((submission) => {
              // Basic validation
              if (!submission || typeof submission.id === 'undefined') {
                console.warn("[Dashboard] Skipping rendering invalid submission:", submission);
                return null;
              }

              const duplicates = findDuplicates(submission);
              const isItemProcessing = processingId === submission.id;
              const isConfirmingMerge = mergeTarget?.submissionId === submission.id;

              return (
                <div
                    key={submission.id}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-opacity ${isItemProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Submission Details */}
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">{submission.name || "Unnamed Submission"}</h2>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{submission.type || "N/A"}</p>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    {submission.location && ( <p><span className="font-medium text-gray-700">Location/Restaurant:</span> {submission.location}</p> )}
                    {submission.city && ( <p><span className="font-medium text-gray-700">City:</span> {submission.city}</p> )}
                    {submission.neighborhood && ( <p><span className="font-medium text-gray-700">Neighborhood:</span> {submission.neighborhood}</p> )}
                    <p><span className="font-medium text-gray-700">Tags:</span> {(Array.isArray(submission.tags) && submission.tags.length > 0 ? submission.tags.map(tag => `#${tag}`).join(", ") : null) || "None"}</p>
                    {submission.place_id && ( <p><span className="font-medium text-gray-700">Place ID:</span> {submission.place_id}</p> )}
                  </div>

                  {/* Duplicate Section */}
                  {submission.type === 'restaurant' && duplicates.length > 0 && !isConfirmingMerge && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                      <p className="font-medium text-yellow-800 mb-1.5">Possible duplicate(s):</p>
                      <ul className="space-y-1">
                        {duplicates.map((dup) => (
                          dup && typeof dup.id !== 'undefined' ? (
                            <li key={dup.id} className="text-yellow-700 flex items-center justify-between text-xs">
                              <span>{dup.name || 'N/A'} ({dup.neighborhood_name || dup.neighborhood || 'N/A'}, {dup.city_name || dup.city || 'N/A'}) - ID: {dup.id}</span>
                              <Button onClick={() => handleSelectMerge(submission.id, dup.id, dup.name)} variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white !px-1.5 !py-0.5 !text-xs" disabled={isItemProcessing}> Merge? </Button>
                            </li>
                          ) : null
                        ))}
                      </ul>
                    </div>
                  )}

                   {/* Merge Confirmation Section */}
                   {isConfirmingMerge && mergeTarget && (
                     <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                       <p className="text-blue-800 mb-2"> Confirm Merge: Approve submission for <strong>"{submission.name}"</strong> and link to existing <strong>"{mergeTarget.targetName}"</strong> (ID: {mergeTarget.targetId})? </p>
                       <div className="flex gap-2">
                         <Button onClick={handleConfirmMerge} variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={isItemProcessing}>
                           {isItemProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Confirm Merge
                         </Button>
                         <Button onClick={() => setMergeTarget(null)} variant="tertiary" size="sm" disabled={isItemProcessing}> Cancel </Button>
                       </div>
                     </div>
                   )}

                  {/* Action Buttons (Approve/Reject) */}
                  {!isConfirmingMerge && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                      <Button onClick={() => handleApprove(submission.id)} variant="primary" size="sm" className="bg-green-600 hover:bg-green-700" disabled={isItemProcessing}>
                        {isItemProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Approve New
                      </Button>
                      <Button onClick={() => handleReject(submission.id)} variant="tertiary" size="sm" className="border-red-500 text-red-600 hover:bg-red-50" disabled={isItemProcessing}>
                        {isItemProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default Dashboard;