// src/services/submissionService.js
// *** CORRECTED IMPORT PATH for apiClient ***
import apiClient from './apiClient.js'; // Use relative path since they are in the same directory

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

// Function to add a new submission
const addSubmission = async (submissionData) => {
     // Add validation if needed before sending
     // e.g., if (!submissionData.name || !submissionData.type) throw new Error("Name and Type required");
     // Basic check for required fields often handled by backend route validation, but can add here too
     if (!submissionData || !submissionData.type || !submissionData.name) {
         throw new Error("Submission data requires at least type and name.");
     }
     return await apiClient(BASE_PATH, 'SubmissionService Add', {
         method: 'POST',
         body: JSON.stringify(submissionData),
     });
};

// Function to approve a submission
const approveSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required for approval.");
     // Construct the correct endpoint path
     const endpoint = `${BASE_PATH}/${submissionId}/approve`;
     return await apiClient(endpoint, 'SubmissionService Approve', { method: 'POST' });
};

// Function to reject a submission
const rejectSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required for rejection.");
      // Construct the correct endpoint path
     const endpoint = `${BASE_PATH}/${submissionId}/reject`;
     return await apiClient(endpoint, 'SubmissionService Reject', { method: 'POST' });
};

// Export the service object with all functions
export const submissionService = {
    getPendingSubmissions,
    addSubmission,
    approveSubmission,
    rejectSubmission,
};