// src/services/submissionService.js
import apiClient from '@/services/apiClient';

const BASE_PATH = '/api/submissions';

const getPendingSubmissions = async () => {
    console.log('[SubmissionService] Fetching pending submissions...');
    try {
        const response = await apiClient(`${BASE_PATH}?status=pending`, 'Fetching Pending Submissions');
        const data = response?.data || [];
        console.log(`[SubmissionService] Received ${Array.isArray(data) ? data.length : 0} pending submissions.`);
        return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (err) {
        console.error('[SubmissionService] Error fetching pending submissions:', err);
        const message = err instanceof Error ? err.message : 'Failed to load pending submissions';
        throw new Error(message);
    }
};

const addSubmission = async (submissionData) => {
    if (!submissionData || !submissionData.type || !submissionData.name) {
        throw new Error("Submission data requires at least type and name.");
    }
    const response = await apiClient(BASE_PATH, 'SubmissionService Add', {
        method: 'POST',
        body: JSON.stringify(submissionData),
    });
    if (!response?.data) {
        throw new Error("Failed to add submission: No data received from server.");
    }
    return response.data;
};

const approveSubmission = async (submissionId) => {
    if (!submissionId) throw new Error("Submission ID required for approval.");
    const endpoint = `/api/admin/submissions/${submissionId}/approve`;
    const response = await apiClient(endpoint, 'SubmissionService Approve', { method: 'POST' });
    if (!response?.data) {
        throw new Error("Failed to approve submission: No data received from server.");
    }
    return response.data;
};

const rejectSubmission = async (submissionId) => {
    if (!submissionId) throw new Error("Submission ID required for rejection.");
    const endpoint = `/api/admin/submissions/${submissionId}/reject`;
    const response = await apiClient(endpoint, 'SubmissionService Reject', { method: 'POST' });
    if (!response?.data) {
        throw new Error("Failed to reject submission: No data received from server.");
    }
    return response.data;
};

export const submissionService = {
    getPendingSubmissions,
    addSubmission,
    approveSubmission,
    rejectSubmission,
};