import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '@/utils/apiClient';
import { queryClient } from '@/queryClient';

const useSubmissionStore = create(
    devtools(
        (set, get) => ({
            pendingSubmissions: [],
            isLoading: false,
            error: null,

            clearError: () => set({ error: null }),

            fetchPendingSubmissions: async () => {
                if (get().isLoading) return;
                set({ isLoading: true, error: null });
                try {
                    const data = await apiClient('/api/submissions/pending', 'Fetch Pending Submissions') || [];
                    set({ pendingSubmissions: Array.isArray(data) ? data : [], isLoading: false });
                    console.log('[SubmissionStore] fetchPendingSubmissions completed.');
                    return data;
                } catch (error) {
                    console.error('[SubmissionStore] Error fetching pending submissions:', error);
                    set({ error: error.message || 'Failed to fetch submissions', isLoading: false });
                    throw error;
                }
            },

            approveSubmission: async (submissionId) => {
                set({ error: null });
                try {
                    await apiClient(`/api/submissions/${submissionId}/approve`, 'Approve Submission', { method: 'POST' });
                    set(state => ({
                        pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
                    }));
                    queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                    console.log(`[SubmissionStore] Submission ${submissionId} approved.`);
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error approving submission ${submissionId}:`, error);
                    set({ error: error.message || 'Failed to approve submission' });
                    throw error;
                }
            },

            rejectSubmission: async (submissionId) => {
                set({ error: null });
                try {
                    await apiClient(`/api/submissions/${submissionId}/reject`, 'Reject Submission', { method: 'POST' });
                    set(state => ({
                        pendingSubmissions: state.pendingSubmissions.filter(s => s.id !== submissionId),
                    }));
                    console.log(`[SubmissionStore] Submission ${submissionId} rejected.`);
                    return true;
                } catch (error) {
                    console.error(`[SubmissionStore] Error rejecting submission ${submissionId}:`, error);
                    set({ error: error.message || 'Failed to reject submission' });
                    throw error;
                }
            },
        }),
        { name: 'SubmissionStore' }
    )
);

export default useSubmissionStore;