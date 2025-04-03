import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { API_BASE_URL } from '@/config'; // Named export

const simpleFetchAndParse = async (url, errorContext) => {
  console.log(`[${errorContext} Store] Fetching from ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${errorContext} Store] HTTP error! status: ${response.status}, body: ${errorBody}`);
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) { /* ignore parsing error */ }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    if (!text) return [];
    const rawData = JSON.parse(text);
    return Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
  } catch (error) {
    console.error(`[${errorContext} Store] Network or parsing error (${url}):`, error);
    throw new Error(`Error processing ${errorContext}: ${error.message}`);
  }
};

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

      addPendingSubmission: async (submissionData) => {
        console.log("[SubmissionStore] Adding submission:", submissionData);
        try {
          const response = await fetch(`${API_BASE_URL}/api/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
          const newSubmission = await response.json();
          console.log("[SubmissionStore] Successfully added submission (status pending):", newSubmission);
          return newSubmission;
        } catch (error) {
          console.error("[SubmissionStore] Error adding submission:", error);
          throw new Error(`Error adding submission: ${error.message}`);
        }
      },

      approveSubmission: async (submissionId) => {
        console.log(`[SubmissionStore] Approving submission ${submissionId}`);
        try {
          const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/approve`, { method: 'POST' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Approval failed');
          }
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          console.log(`[SubmissionStore] Submission ${submissionId} approved.`);
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
          throw error;
        }
      },

      rejectSubmission: async (submissionId) => {
        console.log(`[SubmissionStore] Rejecting submission ${submissionId}`);
        try {
          const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/reject`, { method: 'POST' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Rejection failed');
          }
          set((state) => ({
            pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
          }));
          console.log(`[SubmissionStore] Submission ${submissionId} rejected.`);
          return true;
        } catch (error) {
          console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
          throw error;
        }
      },
    }),
    { name: 'SubmissionStore' }
  )
);

export default useSubmissionStore;