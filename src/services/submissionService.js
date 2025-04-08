// src/services/submissionService.js
import apiClient from '@/services/apiClient'; // Use alias

const BASE_PATH = '/api/submissions';

// Function to fetch pending submissions (for Dashboard)
const getPendingSubmissions = async () => {
    console.log('[SubmissionService] Fetching pending submissions...');
    try {
        // Use apiClient with the correct endpoint and error context
        // Expecting { data: Submission[] }
        const response = await apiClient(`${BASE_PATH}?status=pending`, 'Fetching Pending Submissions');
        const data = response?.data || [];
        // Ensure array is returned; apiClient already parses JSON or returns null/throws
        console.log(`[SubmissionService] Received ${Array.isArray(data) ? data.length : 0} pending submissions.`);
        // Filter out any potentially null/invalid submissions just in case
        return Array.isArray(data) ? data.filter(Boolean) : [];
    } catch (err) {
        console.error('[SubmissionService] Error fetching pending submissions:', err);
        // Re-throw the error so useQuery can handle it
        // Ensure err has a message property
        const message = err instanceof Error ? err.message : 'Failed to load pending submissions';
        throw new Error(message);
    }
};

// Function to add a new submission
const addSubmission = async (submissionData) => {
     // Basic check for required fields
     if (!submissionData || !submissionData.type || !submissionData.name) {
         throw new Error("Submission data requires at least type and name.");
     }
     // Expecting { data: Submission }
     const response = await apiClient(BASE_PATH, 'SubmissionService Add', {
         method: 'POST',
         body: JSON.stringify(submissionData),
     });
     if (!response?.data) { // Check if data exists in the response
        throw new Error("Failed to add submission: No data received from server.");
     }
     return response.data; // Return the created submission data
};

// Function to approve a submission
const approveSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required for approval.");
     // Construct the correct endpoint path
     const endpoint = `/api/admin/submissions/${submissionId}/approve`; // Use admin route
     // Expecting { data: Submission }
     const response = await apiClient(endpoint, 'SubmissionService Approve', { method: 'POST' });
      if (!response?.data) { // Check if data exists
        throw new Error("Failed to approve submission: No data received from server.");
     }
     return response.data; // Return the updated submission data
};

// Function to reject a submission
const rejectSubmission = async (submissionId) => {
     if (!submissionId) throw new Error("Submission ID required for rejection.");
      // Construct the correct endpoint path
     const endpoint = `/api/admin/submissions/${submissionId}/reject`; // Use admin route
     // Expecting { data: Submission }
     const response = await apiClient(endpoint, 'SubmissionService Reject', { method: 'POST' });
      if (!response?.data) { // Check if data exists
         throw new Error("Failed to reject submission: No data received from server.");
      }
      return response.data; // Return the updated submission data
};

// Export the service object with all functions
export const submissionService = {
    getPendingSubmissions,
    addSubmission,
    approveSubmission,
    rejectSubmission,
};