/* src/pages/Dashboard/index.jsx */
import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionService } from '@/services/submissionService'; // Use service
import useSubmissionStore from '@/stores/useSubmissionStore'; // Use store for actions
import Button from '@/components/Button.jsx';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import SubmissionSkeleton from '@/pages/Dashboard/SubmissionSkeleton.jsx';
import QueryResultDisplay from '@/components/QueryResultDisplay.jsx'; // Import QueryResultDisplay

// Fetcher using the service
const fetchPendingSubmissionsData = async () => {
  // Service returns the raw data array
  const submissions = await submissionService.getPendingSubmissions();
  return submissions; // Return the array directly
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  // Zustand state for tracking mutation status (optional, can also use useMutation states)
  const isApproving = useSubmissionStore(state => state.isApproving);
  const isRejecting = useSubmissionStore(state => state.isRejecting);
  const submissionError = useSubmissionStore(state => state.error);
  const clearSubmissionError = useSubmissionStore(state => state.clearError);

  // UseQuery to fetch pending submissions
  const queryResult = useQuery({ // Use a standard name like queryResult
    queryKey: ['pendingSubmissions'], // Unique key for this query
    queryFn: fetchPendingSubmissionsData,
    refetchOnWindowFocus: true, // Refetch when window is focused
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });

  // UseMutation hook for approving submissions
  const approveMutation = useMutation({
    mutationFn: (submissionId) => submissionService.approveSubmission(submissionId),
    onSuccess: () => {
      // Invalidate the pending submissions query to refetch
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      clearSubmissionError(); // Clear any previous errors
    },
    onError: (error) => {
      console.error('[Dashboard] Approve failed:', error);
      // Error will be handled via submissionError state if needed, or locally
    },
  });

  // UseMutation hook for rejecting submissions
  const rejectMutation = useMutation({
    mutationFn: (submissionId) => submissionService.rejectSubmission(submissionId),
    onSuccess: () => {
      // Invalidate the pending submissions query to refetch
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      clearSubmissionError(); // Clear any previous errors
    },
    onError: (error) => {
      console.error('[Dashboard] Reject failed:', error);
      // Error will be handled via submissionError state if needed, or locally
    },
  });


  const handleApprove = useCallback((id) => {
    approveMutation.mutate(id);
  }, [approveMutation]);

  const handleReject = useCallback((id) => {
    rejectMutation.mutate(id);
  }, [rejectMutation]);

  // Loading component for QueryResultDisplay
  const LoadingSubmissions = () => (
      <div className="space-y-4">
        <SubmissionSkeleton />
        <SubmissionSkeleton />
        <SubmissionSkeleton />
      </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">Pending Submissions</h1>

      {/* Display general submission action error if any */}
      {submissionError && (
           <ErrorMessage message={submissionError} onRetry={clearSubmissionError} />
       )}

      {/* Use QueryResultDisplay to handle loading/error/data states */}
      <QueryResultDisplay
        queryResult={queryResult} // Pass the whole result object
        loadingMessage="Loading submissions..." // Optional: will be overridden by LoadingComponent
        LoadingComponent={<LoadingSubmissions />} // Use skeleton component
        errorMessagePrefix="Failed to load submissions"
        noDataMessage="No pending submissions!"
        isDataEmpty={(data) => !data || data.length === 0} // Custom check for empty array
        ErrorChildren={ // Content to show within the ErrorMessage component
            <Button variant="secondary" size="sm" onClick={() => queryResult.refetch()}>Try Again</Button>
        }
      >
        {(submissions) => ( // Children is a function receiving the data
           <div className="space-y-4">
              {submissions.map((submission) => {
                  const isProcessing = approveMutation.isPending && approveMutation.variables === submission.id ||
                                      rejectMutation.isPending && rejectMutation.variables === submission.id;
                  return (
                    <div key={submission.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3">
                       <div className="flex justify-between items-start gap-4">
                          <div>
                              <p className="font-semibold text-lg text-gray-900 capitalize">{submission.type}: {submission.name}</p>
                              {submission.location && <p className="text-sm text-gray-600">Location: {submission.location}</p>}
                              {submission.city && <p className="text-sm text-gray-600">City: {submission.city}</p>}
                              {submission.neighborhood && <p className="text-sm text-gray-600">Neighborhood: {submission.neighborhood}</p>}
                              {submission.tags && submission.tags.length > 0 && <p className="text-sm text-gray-600">Tags: #{submission.tags.join(' #')}</p>}
                              {submission.place_id && <p className="text-xs text-gray-400 mt-1">Place ID: {submission.place_id}</p>}
                          </div>
                          <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                              <p>Submitted by: @{submission.user_handle || 'Unknown'}</p>
                              <p>{new Date(submission.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                          <Button
                              size="sm"
                              variant="primary" // Changed variant for visual cue
                              onClick={() => handleApprove(submission.id)}
                              disabled={isProcessing}
                              className="min-w-[90px] justify-center"
                          >
                              {isProcessing && approveMutation.variables === submission.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Approve'}
                           </Button>
                           <Button
                              size="sm"
                              variant="tertiary" // Changed variant
                              onClick={() => handleReject(submission.id)}
                              disabled={isProcessing}
                              className="min-w-[90px] justify-center text-red-600 hover:bg-red-50 hover:border-red-300"
                           >
                              {isProcessing && rejectMutation.variables === submission.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Reject'}
                           </Button>
                       </div>
                       {/* Display specific error for this submission if mutation failed */}
                       {(approveMutation.isError && approveMutation.variables === submission.id) &&
                           <p className="text-xs text-red-500 mt-1">Approve failed: {approveMutation.error.message}</p>}
                       {(rejectMutation.isError && rejectMutation.variables === submission.id) &&
                           <p className="text-xs text-red-500 mt-1">Reject failed: {rejectMutation.error.message}</p>}
                    </div>
                  );
              })}
           </div>
        )}
      </QueryResultDisplay>
    </div>
  );
};

export default Dashboard;