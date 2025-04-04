// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';

const useSubmissionStore = create(
  devtools(
    (set, get) => ({
      pendingSubmissions: [],
      isLoading: false,
      error: null, // Keep unified error state

      // Action to clear error
      clearError: () => set({ error: null }),

      fetchPendingSubmissions: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null }); // Clear error on new fetch
        try {
          const submissions = await apiClient('/api/submissions', 'Pending Submissions') || [];
          set({ pendingSubmissions: submissions, isLoading: false });
          // Removed console.log
          return submissions;
        } catch (error) {
          console.error('[SubmissionStore] Error fetching pending submissions:', error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message, isLoading: false, pendingSubmissions: [] });
           } else {
              set({ isLoading: false, error: error.message });
           }
        }
      },

      addPendingSubmission: async (submissionData) => {
        // Consider adding specific loading/error state for this action if needed
        // set({ isAdding: true, error: null }); // Example
        set({ error: null }); // Clear previous general errors
        // Removed console.log
        try {
          const newSubmission = await apiClient('/api/submissions', 'Add Submission', {
            method: 'POST',
            body: JSON.stringify(submissionData),
          });
          // Removed console.log
          // Optionally add to local state or rely on next fetchPendingSubmissions
          return newSubmission;
        } catch (error) {
          console.error("[SubmissionStore] Error adding submission:", error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message }); // Set unified error
          } else {
              set({ error: error.message });
          }
           throw error; // Re-throw for component handling
        }
        // finally { set({ isAdding: false }); } // Example
      },

      approveSubmission: async (submissionId) => {
        // Consider adding specific loading/error state
        set({ error: null }); // Clear previous errors
        // Removed console.log
        try {
          await apiClient(`/api/submissions/${submissionId}/approve`, 'Approve Submission', { method: 'POST' });
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          // Removed console.log
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
                set({ error: error.message }); // Set unified error
           } else {
                set({ error: error.message });
           }
           throw error;
        }
      },

      rejectSubmission: async (submissionId) => {
        // Consider adding specific loading/error state
        set({ error: null }); // Clear previous errors
        // Removed console.log
        try {
          await apiClient(`/api/submissions/${submissionId}/reject`, 'Reject Submission', { method: 'POST' });
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          // Removed console.log
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
          if (error.message !== 'Session expired or invalid. Please log in again.') {
              set({ error: error.message }); // Set unified error
          } else {
              set({ error: error.message });
          }
          throw error;
        }
      },
    }),
    { name: 'SubmissionStore' }
  )
);

export default useSubmissionStore;