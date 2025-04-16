/* src/stores/useSubmissionStore.js */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { submissionService } from '@/services/submissionService'; // Use JS service
import { queryClient } from '@/queryClient';

// Create the store without TS types
const useSubmissionStore = create()(
    devtools(
        (set, get) => ({
            // Initial State
            isLoading: false,
            isApproving: null,
            isRejecting: null,
            error: null,

            // Actions
            clearError: () => set({ error: null }),

            addPendingSubmission: async (submissionData) => {
                 set({ isLoading: true, error: null });
                 try {
                     const newSubmission = await submissionService.addSubmission(submissionData);
                     if (!newSubmission || !newSubmission.id) {
                          throw new Error("Invalid response from submission API");
                     }
                     set({ isLoading: false });

                     // *** USE REFETCH INSTEAD OF INVALIDATE ***
                     // Explicitly refetch the query for pending submissions in the admin panel.
                     console.log("[SubmissionStore] Refetching Admin Pending Submissions query...");
                     await queryClient.refetchQueries({
                         queryKey: ['adminData', { tab: 'submissions', status: 'pending' }],
                         // type: 'active', // Only refetch if the query is active (component mounted) - default
                         exact: false // Use partial matching for the key
                     });
                     // Also invalidate (or refetch) the user's own submission list
                     await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] }); // Invalidate is fine here

                     return newSubmission;
                 } catch (error) {
                     console.error('[SubmissionStore] Error adding submission:', error);
                      const message = error?.message || 'Failed to add submission';
                     set({ isLoading: false, error: message });
                     throw new Error(message);
                 }
             },

            approveSubmission: async (submissionId) => {
                set({ isApproving: Number(submissionId), error: null });
                try {
                    await submissionService.approveSubmission(submissionId);
                    // *** USE REFETCH FOR ADMIN DATA ***
                    console.log("[SubmissionStore] Refetching adminData queries after approval...");
                    await queryClient.refetchQueries({ queryKey: ['adminData', { tab: 'submissions' }], exact: false }); // Refetch pending, approved, rejected
                    await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] }); // Invalidate user's list

                    // Optionally invalidate other caches
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                    queryClient.invalidateQueries({ queryKey: ['searchResults'] });

                    set({ isApproving: null });
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                     const message = error?.message || 'Failed to approve submission';
                    set({ isApproving: null, error: message });
                    throw new Error(message);
                }
            },

            rejectSubmission: async (submissionId) => {
                set({ isRejecting: Number(submissionId), error: null });
                try {
                    await submissionService.rejectSubmission(submissionId);
                    // *** USE REFETCH FOR ADMIN DATA ***
                    console.log("[SubmissionStore] Refetching adminData queries after rejection...");
                    await queryClient.refetchQueries({ queryKey: ['adminData', { tab: 'submissions' }], exact: false }); // Refetch pending, approved, rejected
                    await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] }); // Invalidate user's list

                    set({ isRejecting: null });
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
                     const message = error?.message || 'Failed to reject submission';
                     set({ isRejecting: null, error: message });
                    throw new Error(message);
                }
            },
        }),
        { name: 'SubmissionStore' }
    )
);

export default useSubmissionStore;