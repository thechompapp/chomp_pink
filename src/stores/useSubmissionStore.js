// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient'; // Import the new client

const useSubmissionStore = create(
  devtools(
    (set, get) => ({
      pendingSubmissions: [],
      isLoading: false,
      error: null,

      // Note: Fetching submissions might eventually need auth if only admins can see them
      fetchPendingSubmissions: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          // Use apiClient, expect array back
          const submissions = await apiClient('/api/submissions', 'Pending Submissions') || [];
          set({ pendingSubmissions: submissions, isLoading: false });
          console.log('[SubmissionStore] Pending submissions fetched successfully.');
          return submissions;
        } catch (error) {
          console.error('[SubmissionStore] Error fetching pending submissions:', error);
           // apiClient handles logout on 401
           if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message, isLoading: false, pendingSubmissions: [] });
           } else {
              set({ isLoading: false });
           }
           // Optional re-throw
        }
      },

      // Adding a submission might require auth depending on app logic
      addPendingSubmission: async (submissionData) => {
        console.log("[SubmissionStore] Adding submission:", submissionData);
        // Consider adding loading/error state for this specific action if needed
        try {
          // Use apiClient for POST, expect created submission object
          const newSubmission = await apiClient('/api/submissions', 'Add Submission', {
            method: 'POST',
            body: JSON.stringify(submissionData),
          });
          console.log("[SubmissionStore] Successfully added submission (status pending):", newSubmission);
          // Optionally add to local state if fetchPendingSubmissions isn't called immediately after
          // set((state) => ({ pendingSubmissions: [...state.pendingSubmissions, newSubmission] }));
          return newSubmission;
        } catch (error) {
          console.error("[SubmissionStore] Error adding submission:", error);
           // apiClient handles logout on 401
           // Re-throw other errors for the calling component (e.g., FloatingQuickAdd)
           throw error;
        }
      },

      // Approving/Rejecting likely requires admin auth, handled by apiClient token sending + backend check
      approveSubmission: async (submissionId) => {
        console.log(`[SubmissionStore] Approving submission ${submissionId}`);
        // Consider adding loading/error state
        try {
          // Use apiClient for POST, expect updated submission or success message
          await apiClient(`/api/submissions/${submissionId}/approve`, 'Approve Submission', { method: 'POST' });
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          console.log(`[SubmissionStore] Submission ${submissionId} approved locally.`);
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
           // apiClient handles logout on 401
           throw error; // Re-throw other errors
        }
      },

      rejectSubmission: async (submissionId) => {
        console.log(`[SubmissionStore] Rejecting submission ${submissionId}`);
         // Consider adding loading/error state
        try {
          // Use apiClient for POST
          await apiClient(`/api/submissions/${submissionId}/reject`, 'Reject Submission', { method: 'POST' });
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          console.log(`[SubmissionStore] Submission ${submissionId} rejected locally.`);
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
          // apiClient handles logout on 401
          throw error; // Re-throw other errors
        }
      },
    }),
    { name: 'SubmissionStore' }
  )
);

export default useSubmissionStore;