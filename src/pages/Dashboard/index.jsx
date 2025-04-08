/* src/pages/Dashboard/index.jsx */
import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { submissionService } from '@/services/submissionService';
import Button from "@/components/Button.jsx";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import ErrorMessage from "@/components/UI/ErrorMessage.jsx";
import SubmissionSkeleton from "@/pages/Dashboard/SubmissionSkeleton.jsx";
import QueryResultDisplay from "@/components/QueryResultDisplay.jsx";

// Fetcher Function
const fetchPendingSubmissionsData = async () => {
  try {
    const response = await submissionService.getPendingSubmissions();
    return response.data || []; // Adjust based on actual service response structure
  } catch (error) {
    console.error('[Dashboard] Error fetching pending submissions:', error);
    throw error; // Let React Query handle the error
  }
};

// Component Definition
const Dashboard = React.memo(() => {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['pendingSubmissions'],
    queryFn: fetchPendingSubmissionsData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const approveSubmission = useSubmissionStore(state => state.approveSubmission);
  const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
  const storeError = useSubmissionStore(state => state.error);
  const clearStoreError = useSubmissionStore(state => state.clearError);
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const handleAction = useCallback(async (type, submissionId) => {
    setProcessingId(submissionId);
    setActionType(type);
    try {
      if (type === 'approve') {
        await approveSubmission(submissionId);
      } else {
        await rejectSubmission(submissionId);
      }
      queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
    } catch (error) {
      console.error(`[Dashboard] Error ${type}ing submission ${submissionId}:`, error);
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  }, [approveSubmission, rejectSubmission, queryClient]);

  const handleApprove = useCallback((submissionId) => handleAction('approve', submissionId), [handleAction]);
  const handleReject = useCallback((submissionId) => handleAction('reject', submissionId), [handleAction]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Pending Submissions</h1>

      {storeError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
          <span className="flex items-center"><AlertTriangle size={16} className="mr-2" /> {storeError}</span>
          <button onClick={clearStoreError} className="text-red-700 hover:text-red-900 font-bold text-lg" aria-label="Clear error">&times;</button>
        </div>
      )}

      <QueryResultDisplay
        queryResult={queryResult}
        loadingMessage="Loading pending submissions..."
        errorMessagePrefix="Error loading submissions"
        noDataMessage="No pending submissions to review."
      >
        {(pendingSubmissions) => (
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => {
              const isProcessingThis = processingId === submission.id;
              const isApproving = isProcessingThis && actionType === 'approve';
              const isRejecting = isProcessingThis && actionType === 'reject';

              return (
                <div key={submission.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
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
                  {Array.isArray(submission.tags) && submission.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {submission.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">#{tag}</span>
                      ))}
                    </div>
                  )}
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