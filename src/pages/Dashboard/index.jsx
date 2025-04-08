/* src/pages/Dashboard/index.jsx */
import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { submissionService } from '@/services/submissionService'; // Use global import alias
import Button from "@/components/Button"; // Use global import alias
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import ErrorMessage from "@/components/UI/ErrorMessage"; // Keep for store errors
import SubmissionSkeleton from "@/pages/Dashboard/SubmissionSkeleton"; // Use global import alias
import QueryResultDisplay from "@/components/QueryResultDisplay"; // Import the new component

// Fetcher Function (remains the same)
const fetchPendingSubmissionsData = async () => { /* ... */ };

// Component Definition
const Dashboard = React.memo(() => {
  const queryClient = useQueryClient();

  // React Query setup - Result object passed to QueryResultDisplay
  const queryResult = useQuery({
      queryKey: ['pendingSubmissions'],
      queryFn: fetchPendingSubmissionsData,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: true,
  });

  // Destructure only what's needed *outside* QueryResultDisplay if necessary
  // const { data: pendingSubmissions = [] } = queryResult; // Can get data inside render prop

  // Store actions and local state (remains the same)
  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  const storeError = useSubmissionStore(state => state.error); // Still need store error for actions
  const clearStoreError = useSubmissionStore(state => state.clearError);
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null);

  // --- Callbacks (remain the same) ---
  const handleAction = useCallback(async (type, submissionId) => { /* ... */ }, [approveSubmission, rejectSubmission, processingId, clearStoreError, queryClient]); // Added queryClient if needed inside
  const handleApprove = useCallback((submissionId) => { handleAction('approve', submissionId); }, [handleAction]);
  const handleReject = useCallback((submissionId) => { handleAction('reject', submissionId); }, [handleAction]);

  // --- Render Logic ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

      {/* Action Error Display (from store - keep this separate) */}
      {storeError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
          <span className="flex items-center"><AlertTriangle size={16} className="mr-2" /> {storeError}</span>
          <button onClick={clearStoreError} className="text-red-700 hover:text-red-900 font-bold text-lg" aria-label="Clear error">&times;</button>
        </div>
      )}

      {/* Use QueryResultDisplay to handle loading/error/empty/success states */}
      <QueryResultDisplay
        queryResult={queryResult}
        loadingMessage="Loading pending submissions..."
        errorMessagePrefix="Error loading submissions"
        noDataMessage="No pending submissions to review."
        // Optionally override isDataEmpty if needed, default checks for empty array
        // isDataEmpty={(data) => !data || data.length === 0}
      >
        {/* Render function receives the fetched data on success */}
        {(pendingSubmissions) => (
           <div className="space-y-4">
              {/* Memoization for list rendering can still be useful if data reference changes often */}
              {pendingSubmissions.map((submission) => {
                  const isProcessingThis = processingId === submission.id;
                  const isApproving = isProcessingThis && actionType === 'approve';
                  const isRejecting = isProcessingThis && actionType === 'reject';

                  // Submission Card Rendering Logic (remains the same)
                  return (
                      <div key={submission.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100`}>
                          {/* Submission Info */}
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3 gap-2">
                               <div>
                                  <h3 className="text-base font-semibold text-gray-900 break-words">{submission.name}</h3>
                                  <p className="text-sm text-gray-600 capitalize">Type: {submission.type}</p>
                                  <p className="text-sm text-gray-500">
                                      Location: {submission.location || `${submission.neighborhood || ''}${submission.neighborhood && submission.city ? ', ' : ''}${submission.city || ''}` || 'N/A'}
                                  </p>
                                  {submission.place_id && <p className="text-xs text-gray-400 mt-1">Place ID: {submission.place_id}</p>}
                              </div>
                              <p className="text-xs text-gray-400 mt-1 sm:mt-0 flex-shrink-0">
                                  Submitted: {new Date(submission.created_at).toLocaleDateString()}
                              </p>
                          </div>
                          {/* Tags */}
                          {Array.isArray(submission.tags) && submission.tags.length > 0 && (
                               <div className="mb-3 flex flex-wrap gap-1">
                                   {submission.tags.map(tag => (
                                       <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">#{tag}</span>
                                   ))}
                               </div>
                          )}
                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
                               <Button variant="primary" size="sm" onClick={() => handleApprove(submission.id)} disabled={isProcessingThis} className="flex items-center justify-center w-[100px]">
                                   {isApproving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle size={16} className="mr-1" />}
                                   {isApproving ? '...' : 'Approve'}
                               </Button>
                               <Button variant="tertiary" size="sm" onClick={() => handleReject(submission.id)} disabled={isProcessingThis} className="text-red-600 hover:bg-red-50 flex items-center justify-center w-[90px]">
                                    {isRejecting ? <Loader2 className="animate-spin h-4 w-4" /> : <XCircle size={16} className="mr-1" />}
                                    {isRejecting ? '...' : 'Reject'}
                               </Button>
                          </div>
                      </div>
                  );
              })}
           </div>
        )}
      </QueryResultDisplay>
    </div>
  );
});

export default Dashboard;