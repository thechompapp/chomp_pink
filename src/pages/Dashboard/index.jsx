// src/pages/Dashboard/index.jsx (Refactored Zustand selectors)
import React, { useState, useEffect, useCallback } from "react";
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  // --- Refactored State Selection ---
  // Select each state slice individually for better performance and to prevent unnecessary re-renders
  const pendingSubmissions = useAppStore(state => state.pendingSubmissions);
  const fetchPendingSubmissions = useAppStore(state => state.fetchPendingSubmissions);
  const approveSubmission = useAppStore(state => state.approveSubmission);
  const rejectSubmission = useAppStore(state => state.rejectSubmission);
  const trendingItems = useAppStore(state => state.trendingItems); // Still needed for duplicate check
  const fetchTrendingData = useAppStore(state => state.fetchTrendingData); // Still needed for duplicate check refresh

  // Local state remains the same
  const [mergeTarget, setMergeTarget] = useState(null); // { submissionId, targetId, targetName }
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null); // Track processing state for specific submission ID
  const [error, setError] = useState(null);

  // Fetch initial data on mount - useCallback dependencies are stable actions
  const loadInitialData = useCallback(async () => {
      setIsLoadingSubmissions(true);
      setError(null);
      console.log("[Dashboard] loadInitialData triggered."); // Add log
      try {
        // Fetch both pending submissions and trending data (for duplicate checks) concurrently
        await Promise.all([
            fetchPendingSubmissions(),
            fetchTrendingData() // Ensure trending data is available for checks
        ]);
        console.log("[Dashboard] loadInitialData fetches completed."); // Add log
      } catch (err) {
        const errorMsg = "Failed to load initial dashboard data: " + (err.message || "Unknown error");
        setError(errorMsg);
        console.error("[Dashboard] " + errorMsg, err);
      } finally {
        setIsLoadingSubmissions(false);
         console.log("[Dashboard] loadInitialData finished."); // Add log
      }
  }, [fetchPendingSubmissions, fetchTrendingData]); // Dependencies are stable actions

  // Run loadInitialData only once on mount
  useEffect(() => {
    console.log("[Dashboard] Mount useEffect running loadInitialData."); // Add log
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadInitialData]); // loadInitialData is memoized by useCallback and its deps are stable

  // --- Duplicate Checking ---
  // Depends only on trendingItems, which is now selected individually
  const findDuplicates = useCallback((submission) => {
    if (submission.type !== 'restaurant' || !Array.isArray(trendingItems)) return [];
    // Ensure checks handle potentially null/undefined values gracefully
    const subNameLower = submission.name?.toLowerCase();
    const subCityLower = submission.city?.toLowerCase();
    const subNeighborhoodLower = submission.neighborhood?.toLowerCase();

    return trendingItems.filter((existing) => {
        const existingNameLower = existing.name?.toLowerCase();
        const existingCityLower = existing.city?.toLowerCase(); // trendingItems has 'city' from mapping
        const existingNeighborhoodLower = existing.neighborhood?.toLowerCase();

        return existingNameLower === subNameLower &&
               existingCityLower === subCityLower &&
               (existingNeighborhoodLower === subNeighborhoodLower || (!existingNeighborhoodLower && !subNeighborhoodLower));
        });
  }, [trendingItems]); // Depends only on trendingItems

  // --- Action Handlers ---
  // Dependencies are now individually selected stable actions or local state setters
  const handleApprove = useCallback(async (submissionId) => {
    if (isProcessing) return;
    setIsProcessing(submissionId);
    setError(null);
    try {
      const success = await approveSubmission(submissionId);
      if (success) {
          console.log(`[Dashboard] Submission ${submissionId} approved. Refreshing trending data...`);
          // Refresh trending data AFTER successful approval
          await fetchTrendingData();
          // Pending submissions list is updated within approveSubmission action in the store
      } else {
         // Handle potential approval failure reported by the action
         throw new Error("Approval action returned false.");
      }
    } catch (err) {
      const errorMsg = `Failed to approve submission ${submissionId}: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error(`[Dashboard] ${errorMsg}`, err);
    } finally {
      setIsProcessing(null);
      setMergeTarget(null); // Reset merge target state
    }
  }, [approveSubmission, fetchTrendingData, isProcessing, setIsProcessing, setMergeTarget, setError]); // Added setters to dependency array

  const handleReject = useCallback(async (submissionId) => {
    if (isProcessing) return;
    setIsProcessing(submissionId);
    setError(null);
    try {
      await rejectSubmission(submissionId);
       console.log(`[Dashboard] Submission ${submissionId} rejected successfully.`);
      // Pending submissions list is updated within rejectSubmission action
    } catch (err) {
      const errorMsg = `Failed to reject submission ${submissionId}: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error(`[Dashboard] ${errorMsg}`, err);
    } finally {
      setIsProcessing(null);
      setMergeTarget(null); // Reset merge target state
    }
  }, [rejectSubmission, isProcessing, setIsProcessing, setMergeTarget, setError]); // Added setters to dependency array

  // Select merge target - only depends on local state setter
  const handleSelectMerge = useCallback((submissionId, targetId, targetName) => {
     setMergeTarget({ submissionId, targetId, targetName });
     setError(null); // Clear any previous errors when selecting merge
  }, [setMergeTarget, setError]); // Added setters to dependency array

  // Confirm merge (calls handleApprove) - depends on local state and handleApprove
  const handleConfirmMerge = useCallback(async () => {
      if (!mergeTarget) return;
      console.log(`[Dashboard] Confirming merge - Approving submission ${mergeTarget.submissionId} (target: ${mergeTarget.targetId})`);
      await handleApprove(mergeTarget.submissionId);
      // Resetting state is handled in handleApprove's finally block
  }, [mergeTarget, handleApprove]); // Depends on mergeTarget state and handleApprove callback

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pending Submissions</h1>

        {/* Global Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-sm hover:text-red-900">✕</button>
          </div>
        )}

        {/* Loading State */}
        {isLoadingSubmissions ? (
          <div className="flex items-center justify-center py-10">
             <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
             <p className="text-gray-500">Loading pending submissions...</p>
           </div>
        ) : !Array.isArray(pendingSubmissions) || pendingSubmissions.length === 0 ? ( // Check if array and empty
          <p className="text-gray-500 text-center py-10">No pending submissions to review.</p>
        ) : (
          // Render Submissions List
          <div className="space-y-6">
            {pendingSubmissions.map((submission) => {
              // Ensure submission is valid before processing
              if (!submission || typeof submission.id === 'undefined') {
                  console.warn("[Dashboard] Skipping rendering invalid submission:", submission);
                  return null;
              }

              const duplicates = findDuplicates(submission);
              const isItemProcessing = isProcessing === submission.id;
              const isConfirmingMerge = mergeTarget?.submissionId === submission.id;

              return (
                <div key={submission.id} className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-opacity ${isItemProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Submission Details */}
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{submission.name || "Unnamed Submission"}</h2>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Type:</span> {submission.type || "N/A"}</p>
                  {submission.location && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Location/Restaurant:</span> {submission.location}</p> )}
                  {submission.city && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">City:</span> {submission.city}</p> )}
                  {submission.neighborhood && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Neighborhood:</span> {submission.neighborhood}</p> )}
                  <p className="text-sm text-gray-600 mb-4"><span className="font-medium">Tags:</span> {(Array.isArray(submission.tags) ? submission.tags.map(tag => `#${tag}`).join(", ") : null) || "None"}</p>

                  {/* Duplicate Section */}
                  {submission.type === 'restaurant' && duplicates.length > 0 && !isConfirmingMerge && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Possible duplicate(s) found:</p>
                      <ul className="list-disc list-inside space-y-1">
                         {duplicates.map((dup) => (
                           // Ensure dup is valid
                            dup && typeof dup.id !== 'undefined' ? (
                               <li key={dup.id} className="text-sm text-yellow-700 flex items-center justify-between">
                                   <span>{dup.name || 'N/A'} ({dup.neighborhood || 'N/A'}, {dup.city || 'N/A'}) - ID: {dup.id}</span>
                                    <Button onClick={() => handleSelectMerge(submission.id, dup.id, dup.name)} variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-0.5 text-xs" disabled={isItemProcessing}> Merge? </Button>
                               </li>
                            ) : null
                         ))}
                      </ul>
                    </div>
                  )}

                  {/* Merge Confirmation Section */}
                  {isConfirmingMerge && mergeTarget && ( // Ensure mergeTarget is not null
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 mb-3"> Confirm Merge: Approve submission for <strong>"{submission.name}"</strong> and associate it with existing restaurant <strong>"{mergeTarget.targetName}"</strong> (ID: {mergeTarget.targetId})? </p>
                      <div className="flex gap-3">
                          <Button onClick={handleConfirmMerge} variant="primary" className="bg-blue-600 hover:bg-blue-700" disabled={isItemProcessing}>
                             {isItemProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Confirm Merge & Approve
                          </Button>
                          <Button onClick={() => setMergeTarget(null)} variant="tertiary" disabled={isItemProcessing}> Cancel Merge </Button>
                       </div>
                    </div>
                  )}

                  {/* Action Buttons (Approve/Reject) */}
                  {!isConfirmingMerge && (
                       <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                         <Button onClick={() => handleApprove(submission.id)} variant="primary" className="bg-green-600 hover:bg-green-700" disabled={isItemProcessing}>
                           {isItemProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Approve New
                         </Button>
                         <Button onClick={() => handleReject(submission.id)} variant="tertiary" className="border-red-500 text-red-600 hover:bg-red-50" disabled={isItemProcessing}>
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
    </div>
  );
};

export default Dashboard;