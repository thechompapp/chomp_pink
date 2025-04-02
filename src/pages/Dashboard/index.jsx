// src/pages/Dashboard.jsx (Refreshes data on approve/merge)
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  // Get state and actions from store
  const {
    pendingSubmissions,
    fetchPendingSubmissions,
    approveSubmission,
    rejectSubmission,
    trendingItems, // Needed for duplicate check display
    fetchTrendingData // Action to refresh relevant data
  } = useAppStore(state => ({ // Select multiple state slices/actions
      pendingSubmissions: state.pendingSubmissions,
      fetchPendingSubmissions: state.fetchPendingSubmissions,
      approveSubmission: state.approveSubmission,
      rejectSubmission: state.rejectSubmission,
      trendingItems: state.trendingItems, // Keep selecting trendingItems
      fetchTrendingData: state.fetchTrendingData,
  }));

  // Local state
  const [mergeTarget, setMergeTarget] = useState(null); // { submissionId, targetId, targetName }
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(null); // Track processing state for specific submission ID
  const [error, setError] = useState(null);

  // Fetch initial data on mount
  const loadInitialData = useCallback(async () => {
      setIsLoadingSubmissions(true);
      setError(null);
      try {
        // Fetch both pending submissions and trending data (for duplicate checks) concurrently
        await Promise.all([
            fetchPendingSubmissions(),
            fetchTrendingData() // Ensure trending data is available for checks
        ]);
      } catch (err) {
        const errorMsg = "Failed to load initial dashboard data: " + (err.message || "Unknown error");
        setError(errorMsg);
        console.error(errorMsg, err);
      } finally {
        setIsLoadingSubmissions(false);
      }
  }, [fetchPendingSubmissions, fetchTrendingData]); // Dependencies

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Run only once on mount

  // --- Duplicate Checking ---
  const findDuplicates = useCallback((submission) => {
    if (submission.type !== 'restaurant' || !Array.isArray(trendingItems)) return [];
    return trendingItems.filter((existing) =>
      existing.name?.toLowerCase() === submission.name?.toLowerCase() &&
      existing.city?.toLowerCase() === submission.city?.toLowerCase() && // trendingItems still has 'city' from mapping
      (existing.neighborhood?.toLowerCase() === submission.neighborhood?.toLowerCase() || (!existing.neighborhood && !submission.neighborhood))
    );
  }, [trendingItems]); // Depends on trendingItems state

  // --- Action Handlers ---
  const handleApprove = useCallback(async (submissionId) => {
    if (isProcessing) return;
    setIsProcessing(submissionId);
    setError(null);
    try {
      const success = await approveSubmission(submissionId);
      if (success) {
          console.log(`Dashboard: Submission ${submissionId} approved. Refreshing data...`);
          // Refresh data AFTER successful approval
          await fetchTrendingData(); // Refresh trending items in case of merge/new item
          // Pending submissions list is updated within approveSubmission action
      }
    } catch (err) {
      setError(`Failed to approve submission ${submissionId}: ${err.message || "Unknown error"}`);
      console.error(`Error approving submission ${submissionId}:`, err);
    } finally {
      setIsProcessing(null);
      setMergeTarget(null); // Ensure merge confirmation is closed if this was a merge approval
    }
  }, [approveSubmission, fetchTrendingData, isProcessing]); // Dependencies

  const handleReject = useCallback(async (submissionId) => {
    if (isProcessing) return;
    // Optional: Confirmation dialog
    // if (!confirm("Are you sure you want to reject this submission?")) return;
    setIsProcessing(submissionId);
    setError(null);
    try {
      await rejectSubmission(submissionId);
       console.log(`Dashboard: Submission ${submissionId} rejected successfully.`);
      // No data refresh needed, pendingSubmissions updated in action
    } catch (err) {
      setError(`Failed to reject submission ${submissionId}: ${err.message || "Unknown error"}`);
      console.error(`Error rejecting submission ${submissionId}:`, err);
    } finally {
      setIsProcessing(null);
      setMergeTarget(null); // Close merge confirmation if open
    }
  }, [rejectSubmission, isProcessing]); // Dependencies

  // Select merge target
  const handleSelectMerge = useCallback((submissionId, targetId, targetName) => {
     setMergeTarget({ submissionId, targetId, targetName });
     setError(null);
  }, []); // No dependencies needed

  // Confirm merge (calls handleApprove)
  const handleConfirmMerge = useCallback(async () => {
      if (!mergeTarget) return;
      console.log(`Dashboard: Confirming merge - Approving submission ${mergeTarget.submissionId} (target: ${mergeTarget.targetId})`);
      await handleApprove(mergeTarget.submissionId);
      // Resetting state is handled in handleApprove's finally block
  }, [mergeTarget, handleApprove]); // Depends on mergeTarget and handleApprove

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
        ) : pendingSubmissions.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No pending submissions to review.</p>
        ) : (
          // Render Submissions List
          <div className="space-y-6">
            {pendingSubmissions.map((submission) => {
              const duplicates = findDuplicates(submission);
              const isItemProcessing = isProcessing === submission.id;
              const isConfirmingMerge = mergeTarget?.submissionId === submission.id;

              return (
                <div key={submission.id} className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition-opacity ${isItemProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Submission Details */}
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{submission.name}</h2>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Type:</span> {submission.type}</p>
                  {submission.location && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Location/Restaurant:</span> {submission.location}</p> )}
                  {submission.city && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">City:</span> {submission.city}</p> )}
                  {submission.neighborhood && ( <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Neighborhood:</span> {submission.neighborhood}</p> )}
                  <p className="text-sm text-gray-600 mb-4"><span className="font-medium">Tags:</span> {submission.tags?.map(tag => `#${tag}`).join(", ") || "None"}</p>

                  {/* Duplicate Section */}
                  {submission.type === 'restaurant' && duplicates.length > 0 && !isConfirmingMerge && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Possible duplicate(s) found:</p>
                      <ul className="list-disc list-inside space-y-1">
                         {duplicates.map((dup) => (
                            <li key={dup.id} className="text-sm text-yellow-700 flex items-center justify-between">
                               <span>{dup.name} ({dup.neighborhood || 'N/A'}, {dup.city || 'N/A'}) - ID: {dup.id}</span>
                                <Button onClick={() => handleSelectMerge(submission.id, dup.id, dup.name)} variant="primary" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-0.5 text-xs" disabled={isItemProcessing}> Merge? </Button>
                           </li> ))}
                      </ul>
                    </div>
                  )}

                  {/* Merge Confirmation Section */}
                  {isConfirmingMerge && (
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