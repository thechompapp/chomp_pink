// src/pages/Dashboard/index.jsx
// UPDATE: Refactored to use React Query for fetching pending submissions
import React, { useState, useCallback } from "react"; // Removed useEffect, useRef
import { useQuery, useQueryClient } from '@tanstack/react-query'; // *** IMPORT React Query hooks ***
// Keep store import for MUTATIONS (approve/reject) and potentially duplicate checking
import useSubmissionStore from '@/stores/useSubmissionStore';
import useTrendingStore from '@/stores/useTrendingStore'; // Keep for duplicate checking for now
// Other imports
import Button from "@/components/Button";
import { Loader2, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from '@/config'; // Import base URL

// *** Define Fetcher Function ***
const fetchPendingSubmissionsData = async () => {
    console.log("[fetchPendingSubmissionsData] Fetching pending submissions...");
    const url = `${API_BASE_URL}/api/submissions`; // Assumes endpoint returns pending by default
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch submissions (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchPendingSubmissionsData] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
             console.error(`[fetchPendingSubmissionsData] Invalid data format received:`, data);
             throw new Error("Invalid data format for submissions.");
        }
        console.log(`[fetchPendingSubmissionsData] Successfully fetched ${data.length} submissions.`);
        // Format data if needed (e.g., ensure tags is array)
        return data.map(sub => ({
            ...sub,
            tags: Array.isArray(sub.tags) ? sub.tags : [],
        }));
    } catch (err) {
        console.error(`[fetchPendingSubmissionsData] Error fetching submissions:`, err);
        throw new Error(err.message || "Could not load submissions."); // Rethrow error
    }
};


const Dashboard = () => {
  const queryClient = useQueryClient(); // Get query client instance

  // --- Fetch Pending Submissions with React Query ---
  const {
      data: pendingSubmissions = [], // Default to empty array
      isLoading: isLoadingSubmissions, // Replaces isLoading from store
      isError: isFetchError, // Replaces error check from store
      error: fetchError, // Replaces error state from store
      refetch // Function to refetch
  } = useQuery({
      queryKey: ['pendingSubmissions'], // Unique key
      queryFn: fetchPendingSubmissionsData, // Use the fetcher
      // Optional config
      // staleTime: 1000 * 60 * 1, // 1 minute
  });
  // --- End React Query Fetch ---

  // Keep store actions for mutations
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);

  // Still need trending items for duplicate checking (consider moving duplicate check logic later)
  const trendingItems = useTrendingStore(state => state.trendingItems);

  // Local state for UI interactions (keep these)
  const [mergeTarget, setMergeTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null); // ID of the submission being approved/rejected/merged
  const [actionError, setActionError] = useState(null); // For errors specific to component actions (approve/reject/merge)

  // Duplicate finding logic (remains the same for now)
  const findDuplicates = useCallback((submission) => { /* ... keep existing duplicate logic ... */ }, [trendingItems]);

  // --- Action Handlers (using store actions + query invalidation) ---
  const handleApprove = useCallback(async (submissionId) => {
    if (processingId) return;
    setProcessingId(submissionId); setActionError(null);
    try {
      await approveSubmission(submissionId); // Call store action
      console.log(`[Dashboard] Submission ${submissionId} approved action completed.`);
      // *** Invalidate the query cache to refetch the list ***
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
    } catch (err) {
      console.error(`[Dashboard] Failed to approve submission ${submissionId}:`, err);
      setActionError(`Approval failed: ${err.message || "Unknown error"}`);
    } finally { setProcessingId(null); setMergeTarget(null); }
  }, [approveSubmission, processingId, queryClient]); // Add queryClient dependency

  const handleReject = useCallback(async (submissionId) => {
     if (processingId) return;
     setProcessingId(submissionId); setActionError(null);
     try {
       await rejectSubmission(submissionId); // Call store action
       console.log(`[Dashboard] Submission ${submissionId} reject action completed.`);
       // *** Invalidate the query cache to refetch the list ***
       queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
     } catch (err) {
       console.error(`[Dashboard] Failed to reject submission ${submissionId}:`, err);
       setActionError(`Rejection failed: ${err.message || "Unknown error"}`);
     } finally { setProcessingId(null); setMergeTarget(null); }
   }, [rejectSubmission, processingId, queryClient]); // Add queryClient dependency

  const handleSelectMerge = useCallback((submissionId, targetId, targetName) => { /* ... keep existing ... */ }, []);

  const handleConfirmMerge = useCallback(async () => {
    if (!mergeTarget || processingId) return;
    console.log(`[Dashboard] Confirming merge - Approving submission ${mergeTarget.submissionId} (target: ${mergeTarget.targetId})`);
    // handleApprove already invalidates the query
    await handleApprove(mergeTarget.submissionId);
    // Backend should handle associating with the targetId upon approval if merge is intended
  }, [mergeTarget, handleApprove, processingId]);


  // --- Render Logic ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

        {/* Display Fetch Error (from useQuery) */}
        {isFetchError && !isLoadingSubmissions && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
                <span>Error loading submissions: {fetchError?.message || 'Unknown error'}</span>
                {/* Disable retry while loading */}
                <Button onClick={() => refetch()} variant="tertiary" size="sm" className="ml-4" disabled={isLoadingSubmissions}>Retry</Button>
            </div>
        )}
        {/* Display Local Action Error */}
        {actionError && (
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{actionError}</span>
             <button onClick={() => setActionError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
           </div>
         )}

        {/* Loading State (from useQuery) */}
        {isLoadingSubmissions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-500"/>
            <p className="text-gray-500">Loading pending submissions...</p>
          </div>
        // Empty State (check after loading and no error)
        ) : !isFetchError && (!Array.isArray(pendingSubmissions) || pendingSubmissions.length === 0) ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="text-gray-500">No pending submissions to review.</p>
          </div>
        // Display Submissions (using data from useQuery)
        ) : (
          <div className="space-y-4">
            {Array.isArray(pendingSubmissions) && pendingSubmissions.map((submission) => {
              if (!submission || typeof submission.id === 'undefined') {
                console.warn("[Dashboard] Skipping rendering invalid submission:", submission);
                return null;
              }
              const duplicates = findDuplicates(submission);
              const isItemProcessing = processingId === submission.id;
              const isConfirmingMerge = mergeTarget?.submissionId === submission.id;

              return (
                // Keep the existing JSX structure for rendering each submission card
                <div
                    key={submission.id}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-opacity ${isItemProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* ... Submission Details ... */}
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">{submission.name || "Unnamed Submission"}</h2>
                  {/* ... other details ... */}
                   <p><span className="font-medium text-gray-700">Tags:</span> {(Array.isArray(submission.tags) && submission.tags.length > 0 ? submission.tags.map(tag => `#${tag}`).join(", ") : null) || "None"}</p>
                  {/* ... Duplicate Section ... */}
                  {/* ... Merge Confirmation Section ... */}
                  {/* ... Action Buttons (Approve/Reject) ... */}
                   {!isConfirmingMerge && (
                     <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                       <Button onClick={() => handleApprove(submission.id)} variant="primary" size="sm" className="bg-green-600 hover:bg-green-700" disabled={isItemProcessing}>
                         {isItemProcessing && processingId === submission.id ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Approve New
                       </Button>
                       <Button onClick={() => handleReject(submission.id)} variant="tertiary" size="sm" className="border-red-500 text-red-600 hover:bg-red-50" disabled={isItemProcessing}>
                         {isItemProcessing && processingId === submission.id ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Reject
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