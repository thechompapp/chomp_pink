// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { submissionService } from '@/services/submissionService';
import { queryClient } from '@/queryClient';

const useSubmissionStore = create(
    devtools(
        (set, get) => ({
            // State: Keep simple state for action status/errors
            isLoading: false,
            isApproving: null, // Store ID being approved
            isRejecting: null, // Store ID being rejected
            error: null,

            // Actions
            clearError: () => set({ error: null }),

            // Fetching is handled by Dashboard/AdminPanel useQuery

            addPendingSubmission: async (submissionData) => {
                 set({ isLoading: true, error: null });
                 try {
                     // Removed console log
                     const newSubmission = await submissionService.addSubmission(submissionData);
                     if (!newSubmission || !newSubmission.id) throw new Error("Invalid response from submission API");
                     // Removed console log
                     set({ isLoading: false });
                     // Invalidate the pending list query to refresh dashboard/admin
                     queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                     queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
                     return newSubmission;
                 } catch (error) {
                     console.error('[SubmissionStore] Error adding submission:', error);
                      const message = error.response?.data?.error || error.message || 'Failed to add submission';
                     set({ isLoading: false, error: message });
                     throw new Error(message); // Re-throw
                 }
             },


            approveSubmission: async (submissionId) => {
                set({ isApproving: submissionId, error: null }); // Track approving ID
                try {
                    await submissionService.approveSubmission(submissionId);
                    // Invalidate relevant queries
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
                    // Potentially invalidate trending/search results if approved items appear there
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                    queryClient.invalidateQueries({ queryKey: ['searchResults'] });
                    // Removed console log
                    set({ isApproving: null }); // Clear loading state on success
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                     const message = error.response?.data?.error || error.message || 'Failed to approve submission';
                    set({ isApproving: null, error: message }); // Clear loading state, set error
                    throw new Error(message); // Re-throw
                }
            },

            rejectSubmission: async (submissionId) => {
                set({ isRejecting: submissionId, error: null }); // Track rejecting ID
                try {
                    await submissionService.rejectSubmission(submissionId);
                    // Invalidate pending lists
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
                    // Removed console log
                    set({ isRejecting: null }); // Clear loading state on success
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
                     const message = error.response?.data?.error || error.message || 'Failed to reject submission';
                     set({ isRejecting: null, error: message }); // Clear loading state, set error
                    throw new Error(message); // Re-throw
                }
            },
        }),
        { name: 'SubmissionStore' }
    )
);

export default useSubmissionStore;