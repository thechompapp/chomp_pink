// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../utils/apiClient';
import { queryClient } from '@/queryClient'; // Import from the new central file

const useSubmissionStore = create(
  devtools(
    (set, get) => ({
      // ... state ...
      clearError: () => set({ error: null }),
      fetchPendingSubmissions: async () => { /* ... */ },
      addPendingSubmission: async (submissionData) => { /* ... */ },
      approveSubmission: async (submissionId) => {
        set({ error: null });
        try {
          await apiClient(`/api/submissions/${submissionId}/approve`, 'Approve Submission', { method: 'POST' });
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['trendingData'] });
          queryClient.invalidateQueries({ queryKey: ['trendingPageData'] });
          // Note: Dashboard invalidates ['pendingSubmissions'] itself
          console.log(`[SubmissionStore] Invalidated trending queries after approving submission ${submissionId}.`);
          return true;
        } catch (error) {
          // ... error handling ...
           console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
           if (error.message !== 'Session expired or invalid. Please log in again.') {
                set({ error: error.message });
           } else {
                set({ error: error.message });
           }
           throw error;
        }
      },
      rejectSubmission: async (submissionId) => { /* ... */ },
    }),
    { name: 'SubmissionStore' }
  )
);

export default useSubmissionStore;