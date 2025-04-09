/* src/services/submissionService.ts */
import apiClient from '@/services/apiClient';
import type { Submission, CreateSubmissionData } from '@/types/Submission'; // Use types

// Define expected response structure if apiClient wraps data
interface SubmissionsResponse { data?: Submission[] }
interface SubmissionResponse { data?: Submission }
interface SuccessResponse { success: boolean; message?: string; data?: any } // Generic success/action response

const BASE_PATH = '/api/submissions';
const ADMIN_BASE_PATH = '/api/admin/submissions'; // Assuming admin actions are here

const getPendingSubmissions = async (): Promise<Submission[]> => {
    console.log('[SubmissionService] Fetching pending submissions...');
    try {
        const response = await apiClient<SubmissionsResponse>(`${BASE_PATH}?status=pending`, 'SubmissionService Pending');
        const data = response?.data || [];
        console.log(`[SubmissionService] Received ${Array.isArray(data) ? data.length : 0} pending submissions.`);
        // Filter out any potential null/invalid entries
        return Array.isArray(data) ? data.filter((sub): sub is Submission => !!sub && sub.id != null) : [];
    } catch (err) {
        console.error('[SubmissionService] Error fetching pending submissions:', err);
        const message = err instanceof Error ? err.message : 'Failed to load pending submissions';
        throw new Error(message); // Re-throw for React Query
    }
};

const addSubmission = async (submissionData: CreateSubmissionData): Promise<Submission> => {
    // Basic client-side validation (can be enhanced)
    if (!submissionData || !submissionData.type || !submissionData.name) {
        throw new Error("Submission data requires at least type and name.");
    }
    try {
        const response = await apiClient<SubmissionResponse>(BASE_PATH, 'SubmissionService Add', {
            method: 'POST',
            body: JSON.stringify(submissionData),
        });
        // Validate response structure
        if (!response?.data || response.data.id == null) {
            throw new Error(response?.error || "Failed to add submission: Invalid data received from server.");
        }
        return response.data;
    } catch (err) {
        console.error('[SubmissionService] Error adding submission:', err);
        const message = err instanceof Error ? err.message : 'Failed to add submission';
        throw new Error(message); // Re-throw
    }
};

const approveSubmission = async (submissionId: number | string): Promise<Submission> => {
    if (!submissionId) throw new Error("Submission ID required for approval.");
    const endpoint = `${ADMIN_BASE_PATH}/${submissionId}/approve`;
    try {
        // Assuming backend returns the updated submission object in `data`
        const response = await apiClient<SubmissionResponse>(endpoint, 'SubmissionService Approve', { method: 'POST' });
        if (!response?.data || response.data.id == null || response.data.status !== 'approved') {
             throw new Error(response?.error || "Failed to approve submission: Invalid data received from server.");
        }
        return response.data;
    } catch (err) {
        console.error(`[SubmissionService] Error approving submission ${submissionId}:`, err);
        const message = err instanceof Error ? err.message : 'Failed to approve submission';
        throw new Error(message); // Re-throw
    }
};

const rejectSubmission = async (submissionId: number | string): Promise<Submission> => {
    if (!submissionId) throw new Error("Submission ID required for rejection.");
    const endpoint = `${ADMIN_BASE_PATH}/${submissionId}/reject`;
     try {
        // Assuming backend returns the updated submission object in `data`
        const response = await apiClient<SubmissionResponse>(endpoint, 'SubmissionService Reject', { method: 'POST' });
        if (!response?.data || response.data.id == null || response.data.status !== 'rejected') {
             throw new Error(response?.error || "Failed to reject submission: Invalid data received from server.");
        }
        return response.data;
     } catch (err) {
         console.error(`[SubmissionService] Error rejecting submission ${submissionId}:`, err);
         const message = err instanceof Error ? err.message : 'Failed to reject submission';
         throw new Error(message); // Re-throw
     }
};

export const submissionService = {
    getPendingSubmissions,
    addSubmission,
    approveSubmission,
    rejectSubmission,
};