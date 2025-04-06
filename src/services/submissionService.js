// src/services/submissionService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const BASE_PATH = '/api/submissions';

// Function to fetch pending submissions (for Dashboard)
const getPendingSubmissions = async () => {
    console.log('[SubmissionService] Fetching pending submissions...');
    try {
        // Use apiClient with the correct endpoint and error context
        const data = await apiClient(`${BASE_PATH}?status=pending`, 'Fetching Pending Submissions');
        // Ensure array is returned; apiClient already parses JSON or returns null/throws
        console.log(`[SubmissionService] Received ${Array.isArray(data) ? data.length : 0} pending submissions.`);
        // Filter out any potentially null/invalid submissions just in case
        return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (err) {
        console.error('[SubmissionService] Error fetching pending submissions:', err);
        // Re-throw the error so useQuery can handle it
        throw new Error(err.message || 'Failed to load pending submissions');
    }
};


const addSubmission = async (submissionData) => {
     // Add validation if needed before sending
     // e.g., if (!submissionData.name || !submissionData.type) throw new Error("Name and Type required");
     return await apiClient(BASE_PATH, 'SubmissionService Add', {
         method: 'POST',
         body: JSON.stringify(submissionData),
     });
};

const approveSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required.");
     // Specify expected response/behavior for approval
    return await apiClient(`<span class="math-inline">\{BASE\_PATH\}/</span>{submissionId}/approve`, 'SubmissionService Approve', { method: 'POST' });
};

const rejectSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required.");
     // Specify expected response/behavior for rejection
    return await apiClient(`<span class="math-inline">\{BASE\_PATH\}/</span>{submissionId}/reject`, 'SubmissionService Reject', { method: 'POST' });
};

export const submissionService = {
    getPendingSubmissions, // Export the new function
    addSubmission,
    approveSubmission,
    rejectSubmission,
};