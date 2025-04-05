// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/utils/apiClient'; // Corrected import path
import { queryClient } from '@/queryClient'; // Corrected import path

const useSubmissionStore = create(
    devtools(
        (set, get) => ({
            pendingSubmissions: [],
            isLoading: false,
            error: null,

            clearError: () => set({ error: null }),

            // NOTE: Fetching is now handled by useQuery in Dashboard/index.jsx
            // This action can be removed or kept for potential other uses.
            // fetchPendingSubmissions: async () => {
            //     if (get().isLoading) return;
            //     set({ isLoading: true, error: null });
            //     try {
            //         // Assuming endpoint fetches only pending
            //         const data = await apiClient('/api/submissions?status=pending', 'Fetch Pending Submissions') || [];
            //         set({ pendingSubmissions: Array.isArray(data) ? data : [], isLoading: false });
            //         console.log('[SubmissionStore] fetchPendingSubmissions completed.');
            //         return data;
            //     } catch (error) {
            //         console.error('[SubmissionStore] Error fetching pending submissions:', error);
            //         set({ error: error.message || 'Failed to fetch submissions', isLoading: false });
            //         throw error;
            //     }
            // },

            // Action to add a submission (likely used by FloatingQuickAdd)
             addPendingSubmission: async (submissionData) => {
                 set({ isLoading: true, error: null }); // Indicate loading/clear previous error
                 try {
                     console.log('[SubmissionStore] Attempting to add pending submission:', submissionData);
                     const newSubmission = await apiClient('/api/submissions', 'Add Pending Submission', {
                         method: 'POST',
                         body: JSON.stringify(submissionData), // Ensure body is stringified
                     });

                     if (!newSubmission || !newSubmission.id) {
                         throw new Error("Invalid response from submission API");
                     }
                     console.log('[SubmissionStore] Submission added successfully:', newSubmission);

                     // Optionally add to local state if needed immediately, though dashboard refetches
                     // set(state => ({
                     //     pendingSubmissions: [...state.pendingSubmissions, newSubmission]
                     // }));

                     set({ isLoading: false });
                     return newSubmission; // Return the created submission

                 } catch (error) {
                     console.error('[SubmissionStore] Error adding submission:', error);
                     set({ isLoading: false, error: error.message || 'Failed to add submission' });
                     throw error; // Re-throw for the calling component (e.g., useFormHandler)
                 }
             },


            approveSubmission: async (submissionId) => {
                set({ error: null }); // Clear previous errors specific to actions
                try {
                    await apiClient(`/api/submissions/${submissionId}/approve`, 'Approve Submission', { method: 'POST' });
                    // No need to update local pendingSubmissions state if Dashboard refetches via query invalidation
                    // set(state => ({
                    //     pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
                    // }));
                    // Invalidate the query used by the Dashboard to trigger a refetch
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] }); // Also invalidate trending if approval affects it
                    console.log(`[SubmissionStore] Submission ${submissionId} approved. Invalidated pendingSubmissions query.`);
                    return true; // Indicate success
                } catch (error) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                    set({ error: error.message || 'Failed to approve submission' }); // Set action-specific error
                    throw error; // Re-throw for the calling component
                }
            },

            rejectSubmission: async (submissionId) => {
                set({ error: null }); // Clear previous errors specific to actions
                try {
                    await apiClient(`/api/submissions/${submissionId}/reject`, 'Reject Submission', { method: 'POST' });
                     // No need to update local pendingSubmissions state if Dashboard refetches via query invalidation
                    // set(state => ({
                    //     pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
                    // }));
                     // Invalidate the query used by the Dashboard to trigger a refetch
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    console.log(`[SubmissionStore] Submission ${submissionId} rejected. Invalidated pendingSubmissions query.`);
                    return true; // Indicate success
                } catch (error) {
                    console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
                     set({ error: error.message || 'Failed to reject submission' }); // Set action-specific error
                    throw error; // Re-throw for the calling component
                }
            },
        }),
        { name: 'SubmissionStore' }
    )
);

export default useSubmissionStore;