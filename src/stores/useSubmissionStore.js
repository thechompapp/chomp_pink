// src/stores/useSubmissionStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config';

const simpleFetchAndParse = async (url, errorContext) => { /* ... */ };

const useSubmissionStore = create(
  devtools(
    (set, get) => ({
      pendingSubmissions: [],
      isLoading: false,
      error: null,

      fetchPendingSubmissions: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const submissions = await simpleFetchAndParse(`${API_BASE_URL}/api/submissions`, 'Pending Submissions');
          set({ pendingSubmissions: submissions, isLoading: false });
          console.log('[SubmissionStore] Pending submissions fetched successfully.');
          return submissions;
        } catch (error) {
          console.error('[SubmissionStore] Error fetching pending submissions:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Keep addPendingSubmission if FloatingQuickAdd uses it directly
      addPendingSubmission: async (submissionData) => {
         // Consider adding loading/error state for this specific action
         console.log("[SubmissionStore] Adding submission:", submissionData);
         try {
           const response = await fetch(`${API_BASE_URL}/api/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
           if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
           }
           const newSubmission = await response.json();
           console.log("[SubmissionStore] Successfully added submission (status pending):", newSubmission);
           // Add to state only if it's immediately considered pending *by this store*
           // Or rely on fetchPendingSubmissions to refresh
           // set(state => ({ pendingSubmissions: [...state.pendingSubmissions, newSubmission] }));
           return newSubmission;
         } catch (error) {
           console.error("[SubmissionStore] Error adding submission:", error);
           // Set specific error state?
           throw new Error(`Error adding submission: ${error.message}`);
         }
       },


      approveSubmission: async (submissionId) => {
        // Add specific loading/error state for approving
        console.log(`[SubmissionStore] Approving submission ${submissionId}`);
        try {
          const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/approve`, { method: 'POST' });
          if (!response.ok) { /* ... error handling ... */ throw new Error('Approval failed'); }
          // Remove from pending list in state
          set(state => ({
              pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId)
          }));
          console.log(`[SubmissionStore] Submission ${submissionId} approved.`);
          return true;
        } catch (error) { console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error); throw error; }
        finally { /* update loading state */ }
      },

      rejectSubmission: async (submissionId) => {
         // Add specific loading/error state for rejecting
         console.log(`[SubmissionStore] Rejecting submission ${submissionId}`);
         try {
           const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/reject`, { method: 'POST' });
           if (!response.ok) { /* ... error handling ... */ throw new Error('Rejection failed'); }
           // Remove from pending list in state
           set(state => ({
               pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId)
           }));
           console.log(`[SubmissionStore] Submission ${submissionId} rejected.`);
           return true;
         } catch (error) { console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error); throw error; }
         finally { /* update loading state */ }
      },


    }),
    { name: 'SubmissionStore' }
  )
);

export default useSubmissionStore;