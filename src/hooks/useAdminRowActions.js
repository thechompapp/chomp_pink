/* src/hooks/useAdminRowActions.js */
/* REFACTORED: Integrate useApiErrorHandler */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSubmissionStore from '@/stores/useSubmissionStore.js';
import { adminService } from '@/services/adminService.js';
import useApiErrorHandler from './useApiErrorHandler.js'; // Import the hook

export const useAdminRowActions = (
    resourceType, // The type of resource being managed (e.g., 'restaurants', 'submissions')
    onDataMutated, // Callback to trigger data refetch (e.g., invalidate query)
    // Removed setEditError - errors are now handled by useApiErrorHandler
    onCancelEdit // Callback to cancel edit mode on successful save
) => {
    const queryClient = useQueryClient();
    const { approveSubmission, rejectSubmission } = useSubmissionStore.getState(); // Get submission actions if type is submissions

    // Instantiate the error handler hook
    const { errorMessage, handleError, clearError } = useApiErrorHandler();

    const [actionState, setActionState] = useState({
        isSavingId: null, // Track which row ID is currently being saved
        deletingId: null,
        approvingId: null,
        rejectingId: null,
    });
    const [confirmDeleteInfo, setConfirmDeleteInfo] = useState({ isOpen: false, id: null, itemType: '' });

    // --- Action Handlers ---

    const handleSaveEdit = useCallback(async (rowId, payload) => {
        // Expects rowId and the final payload object to send
        if (actionState.isSavingId || !resourceType || !rowId || !payload || Object.keys(payload).length === 0) {
             console.warn('[useAdminRowActions] Save aborted. Conditions not met.', { saving: actionState.isSavingId, resourceType, rowId, payload });
            return;
        }
        clearError(); // Clear previous errors
        setActionState(prev => ({ ...prev, isSavingId: rowId }));

        try {
            // adminService.updateResource now propagates errors from apiClient
            const result = await adminService.updateResource(resourceType, rowId, payload);
            // Assuming result is the updated resource object on success
            if (result) { // Check if result is truthy (implies success)
                onCancelEdit?.(rowId); // Close edit mode for this row
                onDataMutated?.(); // Trigger refetch/invalidation
            } else {
                 // This case might not be reached if service throws on failure
                 handleError(null, `Failed to save ${resourceType}. Unexpected response.`);
            }
        } catch (error) {
            console.error(`[useAdminRowActions SaveEdit] Error saving ${resourceType} ${rowId}:`, error);
            // Use the error handler hook
            handleError(error, `Failed to save ${resourceType}.`);
            // Do not call onCancelEdit on error, keep edit mode open
        } finally {
            setActionState(prev => ({ ...prev, isSavingId: null }));
        }
    }, [resourceType, onDataMutated, onCancelEdit, actionState.isSavingId, handleError, clearError]);


    const handleApprove = useCallback(async (submissionId) => {
        if (actionState.approvingId || actionState.rejectingId || resourceType !== 'submissions') return;
        clearError();
        setActionState(prev => ({ ...prev, approvingId: submissionId }));
        try {
            // Assuming useSubmissionStore actions handle their own errors or throw
            await approveSubmission(submissionId);
            onDataMutated?.(); // Refetch data (e.g., allAdminData query)
        } catch (error) {
            console.error(`[useAdminRowActions Approve] Error approving submission ${submissionId}:`, error);
            handleError(error, 'Approval failed.');
        } finally {
            setActionState(prev => ({ ...prev, approvingId: null }));
        }
    }, [actionState.approvingId, actionState.rejectingId, resourceType, approveSubmission, onDataMutated, handleError, clearError]);

    const handleReject = useCallback(async (submissionId) => {
        if (actionState.approvingId || actionState.rejectingId || resourceType !== 'submissions') return;
        clearError();
        setActionState(prev => ({ ...prev, rejectingId: submissionId }));
        try {
            await rejectSubmission(submissionId);
            onDataMutated?.();
        } catch (error) {
            console.error(`[useAdminRowActions Reject] Error rejecting submission ${submissionId}:`, error);
            handleError(error, 'Rejection failed.');
        } finally {
            setActionState(prev => ({ ...prev, rejectingId: null }));
        }
    }, [actionState.approvingId, actionState.rejectingId, resourceType, rejectSubmission, onDataMutated, handleError, clearError]);


    const handleDeleteClick = useCallback((id, itemTypeToDelete = resourceType) => {
        // itemTypeToDelete allows flexibility if deleting related data (though maybe should be separate action)
        clearError();
        setConfirmDeleteInfo({ isOpen: true, id, itemType: itemTypeToDelete });
    }, [resourceType, clearError]);


    const handleDeleteConfirm = useCallback(async () => {
        const { id: idToDelete, itemType } = confirmDeleteInfo;
        if (!idToDelete || !itemType || actionState.deletingId) return;

        clearError();
        setActionState(prev => ({ ...prev, deletingId: idToDelete }));

        try {
            // adminService.deleteResource now propagates errors
            await adminService.deleteResource(itemType, idToDelete);
            setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' }); // Close dialog
            onDataMutated?.(); // Refetch data
        } catch (error) {
            console.error(`[useAdminRowActions DeleteConfirm] Error deleting ${itemType} ${idToDelete}:`, error);
            // Use error handler hook, keep dialog open on error by not resetting confirmDeleteInfo here
            handleError(error, `Failed to delete ${itemType.slice(0, -1)}.`);
             // Optionally keep dialog open on error by not calling setConfirmDeleteInfo here
             // setConfirmDeleteInfo(prev => ({ ...prev, error: errorMessage || `Failed to delete ${itemType.slice(0, -1)}.` }));
        } finally {
            setActionState(prev => ({ ...prev, deletingId: null }));
        }
    }, [confirmDeleteInfo, actionState.deletingId, onDataMutated, handleError, clearError]);

    return {
        actionState,
        confirmDeleteInfo,
        setConfirmDeleteInfo, // Expose setter to allow closing dialog from outside if needed
        errorMessage, // Expose error message from the hook
        clearError, // Expose clearError handler
        handleSaveEdit,
        handleApprove,
        handleReject,
        handleDeleteClick,
        handleDeleteConfirm,
    };
};