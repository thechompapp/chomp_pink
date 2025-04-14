/* src/stores/useSubmissionStore.js */
/* REMOVED: All TypeScript syntax */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { submissionService } from '@/services/submissionService'; // Use JS service
import { queryClient } from '@/queryClient';
// REMOVED: import type { Submission, CreateSubmissionData } from '@/types/Submission';

// REMOVED: Define State and Actions Interfaces
// REMOVED: interface SubmissionState { ... }
// REMOVED: interface SubmissionActions { ... }
// REMOVED: type SubmissionStore = SubmissionState & SubmissionActions;

// Create the store without TS types
const useSubmissionStore = create/*REMOVED: <SubmissionStore>*/()(
    devtools(
        (set, get) => ({
            // Initial State
            isLoading: false,
            isApproving: null, // Store submission ID being approved
            isRejecting: null, // Store submission ID being rejected
            error: null,
            // Note: Pending submissions themselves are fetched via useQuery in components

            // Actions
            clearError: () => set({ error: null }),

            addPendingSubmission: async (submissionData) => { // REMOVED: Type hints
                 set({ isLoading: true, error: null });
                 try {
                     const newSubmission = await submissionService.addSubmission(submissionData);
                     // Basic validation on response
                     if (!newSubmission || !newSubmission.id) {
                          throw new Error("Invalid response from submission API");
                     }
                     set({ isLoading: false });
                     // Invalidate queries that show pending submissions
                     queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                     queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] }); // Invalidate admin view
                     return newSubmission; // Return the created submission
                 } catch (error/*REMOVED: : any*/) {
                     console.error('[SubmissionStore] Error adding submission:', error);
                      const message = error?.message || 'Failed to add submission';
                     set({ isLoading: false, error: message });
                     throw new Error(message); // Re-throw for component error handling
                 }
             },

            approveSubmission: async (submissionId) => { // REMOVED: Type hints
                set({ isApproving: Number(submissionId), error: null });
                try {
                    // submissionService.approveSubmission should return the updated submission or handle errors
                    await submissionService.approveSubmission(submissionId);
                    // Invalidate relevant queries on success
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
                    // Optionally invalidate other caches if approved items appear elsewhere
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                    queryClient.invalidateQueries({ queryKey: ['searchResults'] });

                    set({ isApproving: null });
                    return true; // Indicate success
                } catch (error/*REMOVED: : any*/) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                     const message = error?.message || 'Failed to approve submission';
                    set({ isApproving: null, error: message });
                    throw new Error(message); // Re-throw
                }
            },

            rejectSubmission: async (submissionId) => { // REMOVED: Type hints
                set({ isRejecting: Number(submissionId), error: null });
                try {
                    // submissionService.rejectSubmission should return the updated submission or handle errors
                    await submissionService.rejectSubmission(submissionId);
                    // Invalidate pending lists on success
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });

                    set({ isRejecting: null });
                    return true; // Indicate success
                } catch (error/*REMOVED: : any*/) {
                    console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
                     const message = error?.message || 'Failed to reject submission';
                     set({ isRejecting: null, error: message });
                    throw new Error(message); // Re-throw
                }
            },
        }),
        { name: 'SubmissionStore' } // Devtools name
    )
);

export default useSubmissionStore;