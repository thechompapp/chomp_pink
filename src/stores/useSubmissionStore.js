/* src/stores/useSubmissionStore.js */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { submissionService } from '@/services/submissionService';
import { queryClient } from '@/queryClient';

const useSubmissionStore = create()(
    devtools(
        (set, get) => ({
            // Initial State
            isLoading: false,
            isApproving: null,
            isRejecting: null,
            error: null,
            lastSubmissionTimestamp: null,

            // Actions
            clearError: () => set({ error: null }),

            addPendingSubmission: async (submissionData) => {
                set({ isLoading: true, error: null });
                try {
                    const newSubmission = await submissionService.addSubmission(submissionData);
                    if (!newSubmission || !newSubmission.id) {
                        throw new Error("Invalid response from submission API");
                    }

                    // Invalidate both the user's submissions and the broader admin data query
                    console.log("[SubmissionStore] Invalidating mySubmissions and adminData queries...");
                    await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
                    // *** MODIFIED: Broaden invalidation key ***
                    await queryClient.invalidateQueries({ queryKey: ['adminData'] });

                    // Update timestamp if still needed elsewhere, or remove if not used for this refresh
                    set({ isLoading: false, lastSubmissionTimestamp: Date.now() });

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
                    console.log("[SubmissionStore] Invalidating adminData and mySubmissions after approval...");
                    await queryClient.invalidateQueries({ queryKey: ['adminData'] }); // Broad invalidation
                    await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });

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
                    console.log("[SubmissionStore] Invalidating adminData and mySubmissions after rejection...");
                    await queryClient.invalidateQueries({ queryKey: ['adminData'] }); // Broad invalidation
                    await queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });

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