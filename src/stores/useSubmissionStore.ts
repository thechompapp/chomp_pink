/* src/stores/useSubmissionStore.ts */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { submissionService } from '@/services/submissionService'; // Use typed service
import { queryClient } from '@/queryClient';
import type { Submission, CreateSubmissionData } from '@/types/Submission'; // Import types

// Define State and Actions Interfaces
interface SubmissionState {
    isLoading: boolean; // General loading for add
    isApproving: number | null; // Store submission ID being approved
    isRejecting: number | null; // Store submission ID being rejected
    error: string | null;
    // Note: Pending submissions themselves are fetched via useQuery in components
}

interface SubmissionActions {
    clearError: () => void;
    addPendingSubmission: (submissionData: CreateSubmissionData) => Promise<Submission>;
    approveSubmission: (submissionId: number | string) => Promise<boolean>;
    rejectSubmission: (submissionId: number | string) => Promise<boolean>;
}

type SubmissionStore = SubmissionState & SubmissionActions;

// Create the store with types
const useSubmissionStore = create<SubmissionStore>()(
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
                     // submissionService returns the created Submission
                     const newSubmission = await submissionService.addSubmission(submissionData);
                     if (!newSubmission || !newSubmission.id) {
                          throw new Error("Invalid response from submission API");
                     }
                     set({ isLoading: false });
                     // Invalidate queries that show pending submissions
                     queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                     queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] }); // Invalidate admin view
                     return newSubmission;
                 } catch (error: any) {
                     console.error('[SubmissionStore] Error adding submission:', error);
                      const message = error?.message || 'Failed to add submission';
                     set({ isLoading: false, error: message });
                     throw new Error(message); // Re-throw
                 }
             },

            approveSubmission: async (submissionId) => {
                set({ isApproving: Number(submissionId), error: null });
                try {
                    // submissionService returns the updated Submission on success
                    await submissionService.approveSubmission(submissionId);
                    // Invalidate relevant queries
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
                    // Optionally invalidate other caches if approved items appear elsewhere
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                    queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                    queryClient.invalidateQueries({ queryKey: ['searchResults'] });

                    set({ isApproving: null });
                    return true;
                } catch (error: any) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                     const message = error?.message || 'Failed to approve submission';
                    set({ isApproving: null, error: message });
                    throw new Error(message); // Re-throw
                }
            },

            rejectSubmission: async (submissionId) => {
                set({ isRejecting: Number(submissionId), error: null });
                try {
                    // submissionService returns the updated Submission on success
                    await submissionService.rejectSubmission(submissionId);
                    // Invalidate pending lists
                    queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
                    queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });

                    set({ isRejecting: null });
                    return true;
                } catch (error: any) {
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