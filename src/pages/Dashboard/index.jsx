/* src/pages/Dashboard/index.jsx */
import React, { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionService } from '@/services/submissionService';
import useSubmissionStore from '@/stores/useSubmissionStore';
import Button from '@/components/Button.jsx';
import { Loader2 } from 'lucide-react';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import SubmissionSkeleton from '@/pages/Dashboard/SubmissionSkeleton.jsx';
import QueryResultDisplay from '@/components/QueryResultDisplay.jsx';

// Fetcher using the service
const fetchPendingSubmissionsData = async () => {
  const submissions = await submissionService.getPendingSubmissions();
  return Array.isArray(submissions) ? submissions : []; // Ensure array return
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { isApproving, isRejecting, error: submissionError, clearError: clearSubmissionError } =
    useSubmissionStore((state) => ({
      isApproving: state.isApproving,
      isRejecting: state.isRejecting,
      error: state.error,
      clearError: state.clearError,
    }));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pendingSubmissions'],
    queryFn: fetchPendingSubmissionsData,
    refetchOnWindowFocus: true,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const approveMutation = useMutation({
    mutationFn: (submissionId) => submissionService.approveSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      clearSubmissionError();
    },
    onError: (err) => {
      console.error('[Dashboard] Approve failed:', err);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (submissionId) => submissionService.rejectSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      clearSubmissionError();
    },
    onError: (err) => {
      console.error('[Dashboard] Reject failed:', err);
    },
  });

  const handleApprove = useCallback(
    (id) => {
      approveMutation.mutate(id);
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    (id) => {
      rejectMutation.mutate(id);
    },
    [rejectMutation]
  );

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

      {submissionError && <ErrorMessage message={submissionError} onRetry={clearSubmissionError} />}

      <QueryResultDisplay
        queryResult={{ data, isLoading, error, refetch }}
        LoadingComponent={<LoadingSubmissions />}
        errorMessagePrefix="Failed to load submissions"
        noDataMessage="No pending submissions!"
        isDataEmpty={(d) => !d || d.length === 0}
        ErrorChildren={<Button variant="secondary" size="sm" onClick={() => refetch()}>Try Again</Button>}
      >
        {(submissions) => (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const isProcessing =
                (approveMutation.isPending && approveMutation.variables === submission.id) ||
                (rejectMutation.isPending && rejectMutation.variables === submission.id);

              return (
                <div
                  key={submission.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-lg text-gray-900 capitalize">
                        {submission.type}: {submission.name}
                      </p>
                      {submission.location && (
                        <p className="text-sm text-gray-600">Location: {submission.location}</p>
                      )}
                      {submission.city && <p className="text-sm text-gray-600">City: {submission.city}</p>}
                      {submission.neighborhood && (
                        <p className="text-sm text-gray-600">Neighborhood: {submission.neighborhood}</p>
                      )}
                      {submission.tags && submission.tags.length > 0 && (
                        <p className="text-sm text-gray-600">Tags: #{submission.tags.join(' #')}</p>
                      )}
                      {submission.place_id && (
                        <p className="text-xs text-gray-400 mt-1">Place ID: {submission.place_id}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                      <p>Submitted by: @{submission.user_handle || 'Unknown'}</p>
                      <p>{new Date(submission.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100 mt-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(submission.id)}
                      disabled={isProcessing || isApproving}
                      className="min-w-[90px] justify-center"
                    >
                      {isProcessing && approveMutation.variables === submission.id ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        'Approve'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onClick={() => handleReject(submission.id)}
                      disabled={isProcessing || isRejecting}
                      className="min-w-[90px] justify-center text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      {isProcessing && rejectMutation.variables === submission.id ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        'Reject'
                      )}
                    </Button>
                  </div>
                  {(approveMutation.isError && approveMutation.variables === submission.id) && (
                    <p className="text-xs text-red-500 mt-1">
                      Approve failed: {approveMutation.error.message}
                    </p>
                  )}
                  {(rejectMutation.isError && rejectMutation.variables === submission.id) && (
                    <p className="text-xs text-red-500 mt-1">
                      Reject failed: {rejectMutation.error.message}
                    </p>
                  )}
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