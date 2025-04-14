/* src/services/submissionService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';
// REMOVED: import type { Submission, CreateSubmissionData } from '@/types/Submission';

// REMOVED: interface SubmissionsResponse { data?: Submission[] }
// REMOVED: interface SubmissionResponse { data?: Submission }
// REMOVED: interface SuccessResponse { success: boolean; message?: string; data?: any }

const BASE_PATH = '/api/submissions';
const ADMIN_BASE_PATH = '/api/admin/submissions'; // Assuming admin actions are here

const getPendingSubmissions = async () => { // REMOVED: : Promise<Submission[]>
    console.log('[SubmissionService] Fetching pending submissions...');
    try {
        // Assume apiClient returns { success: boolean, data: any[] | null, error: string | null }
        const response = await apiClient/*REMOVED: <SubmissionsResponse>*/(`${BASE_PATH}?status=pending`, 'SubmissionService Pending');

        if (!response.success || !Array.isArray(response.data)) { // Check outer success and data array
            console.error('[SubmissionService] Error fetching pending submissions:', response.error || "Invalid data received");
            throw new Error(response.error || 'Failed to load pending submissions');
        }

        const data = response.data || [];
        console.log(`[SubmissionService] Received ${data.length} pending submissions.`);
        // Basic JS filter for valid items
        return data.filter((sub) => !!sub && sub.id != null); // REMOVED: : sub is Submission type guard
    } catch (err) {
        console.error('[SubmissionService] Error fetching pending submissions:', err);
        const message = err instanceof Error ? err.message : 'Failed to load pending submissions';
        throw new Error(message); // Re-throw for React Query
    }
};

const addSubmission = async (submissionData) => { // REMOVED: : Promise<Submission>
    if (!submissionData || !submissionData.type || !submissionData.name) {
        throw new Error("Submission data requires at least type and name.");
    }
    try {
        // Assume apiClient returns { success: boolean, data: Submission | null, error: string | null }
        const response = await apiClient/*REMOVED: <SubmissionResponse>*/(BASE_PATH, 'SubmissionService Add', {
            method: 'POST',
            body: JSON.stringify(submissionData),
        });
        // Check success flag and if data (the submission object) is present
        if (!response?.success || !response.data || response.data.id == null) {
            throw new Error(response?.error || "Failed to add submission: Invalid data received from server.");
        }
        return response.data; // Return the submission object
    } catch (err) {
        console.error('[SubmissionService] Error adding submission:', err);
        const message = err instanceof Error ? err.message : 'Failed to add submission';
        throw new Error(message);
    }
};

const approveSubmission = async (submissionId) => { // REMOVED: Type hints and Promise return type
    if (!submissionId) throw new Error("Submission ID required for approval.");
    const endpoint = `${ADMIN_BASE_PATH}/${submissionId}/approve`;
    try {
        // Assume apiClient returns { success: boolean, data: Submission | null, error: string | null }
        const response = await apiClient/*REMOVED: <SubmissionResponse>*/(endpoint, 'SubmissionService Approve', { method: 'POST' });
        // Check success flag and data validity
        if (!response?.success || !response.data || response.data.id == null || response.data.status !== 'approved') {
             throw new Error(response?.error || "Failed to approve submission: Invalid data received from server.");
        }
        return response.data; // Return updated submission
    } catch (err) {
        console.error(`[SubmissionService] Error approving submission ${submissionId}:`, err);
        const message = err instanceof Error ? err.message : 'Failed to approve submission';
        throw new Error(message);
    }
};

const rejectSubmission = async (submissionId) => { // REMOVED: Type hints and Promise return type
    if (!submissionId) throw new Error("Submission ID required for rejection.");
    const endpoint = `${ADMIN_BASE_PATH}/${submissionId}/reject`;
     try {
         // Assume apiClient returns { success: boolean, data: Submission | null, error: string | null }
        const response = await apiClient/*REMOVED: <SubmissionResponse>*/(endpoint, 'SubmissionService Reject', { method: 'POST' });
        // Check success flag and data validity
        if (!response?.success || !response.data || response.data.id == null || response.data.status !== 'rejected') {
             throw new Error(response?.error || "Failed to reject submission: Invalid data received from server.");
        }
        return response.data; // Return updated submission
     } catch (err) {
         console.error(`[SubmissionService] Error rejecting submission ${submissionId}:`, err);
         const message = err instanceof Error ? err.message : 'Failed to reject submission';
         throw new Error(message);
     }
};

export const submissionService = {
    getPendingSubmissions,
    addSubmission,
    approveSubmission,
    rejectSubmission,
};