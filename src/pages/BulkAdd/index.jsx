/* src/pages/BulkAdd/index.jsx */
/* Patched: Fix dishService import to use named import */
/* Patched: Define and pass submitItems function to processItems */
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import InputMode from './InputMode.jsx';
import ReviewMode from './ReviewMode.jsx';
import PlaceSelectionDialog from './PlaceSelectionDialog.jsx';
import useBulkAddProcessor from '@/hooks/useBulkAddProcessor.js';
import { restaurantService } from '@/services/restaurantService.js';
import { dishService } from '@/services/dishService.js';
import { adminService } from '@/services/adminService';
import './PlaceSelectionDialog.css'; // Import CSS for place selection dialog
import { ApiError } from '@/utils/apiUtils.js';
import Button from '@/components/UI/Button.jsx';
import { useAdminAddRow } from '@/hooks/useAdminAddRow'; // Updated import
import ConfirmationModal from '@/components/UI/ConfirmationModal.jsx';

const BulkAdd = () => {
  console.log('[BulkAdd/index.jsx] Loaded version with setError defined and timeout');
  const [mode, setMode] = useState('input');
  const [items, setItems] = useState([]);
  const [rawText, setRawText] = useState('');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionSummary, setSubmissionSummary] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationModalData, setConfirmationModalData] = useState({
    title: '',
    message: '',
    summary: null,
    variant: 'success'
  });

  const { 
    processInputData, 
    isProcessing: isItemProcessing, 
    processingError, 
    processedItems,
    placeSelections,
    awaitingSelection,
    currentProcessingIndex,
    selectPlace,
    submitBulkAdd
  } = useBulkAddProcessor('restaurants');

  const updateItemStatus = useCallback((index, status, message, details = {}) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], status, message, ...details };
      }
      return newItems;
    });
  }, []);

  const handleRawTextChange = useCallback((text) => {
    setRawText(text);
  }, []);

  const submitItems = useCallback(async (itemsToSubmit) => {
    if (!Array.isArray(itemsToSubmit) || itemsToSubmit.length === 0) {
      throw new Error("No valid items provided for submission.");
    }
    console.log(`[submitItems in BulkAdd] Submitting ${itemsToSubmit.length} items...`);
    try {
      const response = await adminService.bulkAddItems(itemsToSubmit);
      console.log('[submitItems in BulkAdd] Submission response:', response);
      if (!response.success) {
        throw new ApiError(response.error || 'Submission failed on backend.', response.status || 500, response);
      }
      return response;
    } catch (error) {
      console.error('[submitItems in BulkAdd] Error during submission:', error);
      throw error;
    }
  }, []);

  const handleProcess = useCallback(async () => {
    console.log('[BulkAdd] Processing raw text:');
    setItems([]);
    setSubmissionError(null);
    setSubmissionSummary(null);

    const rawItems = rawText
      .split('\n')
      .map((line, index) => ({ raw: line.trim(), _lineNumber: index + 1 }))
      .filter(item => item.raw)
      .map(item => {
        const parts = item.raw.split(';').map(part => part.trim());
        const [name = '', type = '', location = '', tagsRaw = ''] = parts;
        const isDish = type?.toLowerCase() === 'dish';
        return {
          _lineNumber: item._lineNumber,
          name: name,
          type: isDish ? 'dish' : (type?.toLowerCase() === 'restaurant' ? 'restaurant' : 'unknown'),
          restaurant_name: isDish ? location : undefined,
          city_name: !isDish ? location : undefined,
          tags: tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()).filter(t => t) : [],
          status: 'pending',
          message: 'Waiting to process...'
        };
      })
      .filter(item => item.type !== 'unknown' && item.name);

    if (rawItems.length === 0) {
      console.warn('[BulkAdd] No valid items found to process.');
      setSubmissionError("No valid items found in the input text.");
      return;
    }

    setItems(rawItems);
    setMode('review');
    setSubmitProgress(0);

    // Use the new processInputData function
    await processInputData(rawItems);
  }, [rawText, processInputData]);
  
  // Update items state when processedItems changes
  useEffect(() => {
    if (processedItems && processedItems.length > 0) {
      console.log('[BulkAdd] Updating items with processed data:', processedItems);
      
      // Log neighborhood and address information for debugging
      const locationInfo = processedItems.map(item => ({
        name: item.name,
        address: item.address || 'No address',
        neighborhood: item.neighborhood_name || 'No neighborhood',
        neighborhood_id: item.neighborhood_id || 'No ID',
        status: item.status
      }));
      
      console.log('[BulkAdd] Location information in processed items:', locationInfo);
      
      // Check if any items are missing critical information
      const missingInfo = processedItems.filter(item => 
        !item.address || !item.neighborhood_name || !item.neighborhood_id
      );
      
      if (missingInfo.length > 0) {
        console.warn('[BulkAdd] Some items are missing location information:', missingInfo);
      }
      
      setItems(processedItems);
    }
  }, [processedItems]);

  const handleSubmitReviewedItems = useCallback(async (itemsWithForceFlags = null) => {
    // Use provided items with force flags if available, otherwise use the current items
    const currentItems = itemsWithForceFlags || items;
    
    // Filter items that are ready or duplicates with forceSubmit flag
    const itemsToSubmit = currentItems.filter(item => 
      item.status === 'ready' || (item.isDuplicate && item.forceSubmit)
    );
    
    if (itemsToSubmit.length === 0) {
      console.warn('[BulkAdd handleSubmit] No items marked as ready for submission.');
      setSubmissionError('No items are ready for submission.');
      return;
    }

    console.log(`[BulkAdd] Attempting to submit ${itemsToSubmit.length} items:`, itemsToSubmit);
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionSummary(null);
    setSubmitProgress(0);

    try {
      // Use the existing submitBulkAdd function to avoid infinite loops
      const result = await submitBulkAdd(itemsToSubmit);
      console.log("[BulkAdd] Submission result:", result);
      
      // Update items with the result
      const updatedItems = [...items];
      const successfulItems = [];
      const duplicateItems = [];
      const failedItems = [];
      
      // Process the result
      if (result?.data?.details && Array.isArray(result.data.details)) {
        result.data.details.forEach(detail => {
          // Find the matching item
          const matchingIndex = updatedItems.findIndex(item => 
            item._lineNumber === detail._lineNumber || 
            (detail.input && item._lineNumber === detail.input._lineNumber)
          );
          
          if (matchingIndex !== -1) {
            // Update the item status
            if (detail.status === 'added') {
              updatedItems[matchingIndex].status = 'added';
              updatedItems[matchingIndex].message = `Added successfully (ID: ${detail.finalId || detail.id})`;
              updatedItems[matchingIndex].finalId = detail.finalId || detail.id;
              successfulItems.push(updatedItems[matchingIndex]);
            } else if (detail.status === 'duplicate' || detail.isDuplicate) {
              updatedItems[matchingIndex].status = 'duplicate';
              updatedItems[matchingIndex].message = `Duplicate: ${detail.message || 'Already exists'}`;
              updatedItems[matchingIndex].isDuplicate = true;
              duplicateItems.push(updatedItems[matchingIndex]);
            } else if (detail.status === 'error') {
              updatedItems[matchingIndex].status = 'error';
              updatedItems[matchingIndex].message = `Error: ${detail.reason || detail.message || 'Unknown error'}`;
              failedItems.push(updatedItems[matchingIndex]);
            }
          }
        });
      } else if (result?.data?.createdItems && Array.isArray(result.data.createdItems)) {
        // If no details array, use createdItems
        result.data.createdItems.forEach(createdItem => {
          const matchingIndex = updatedItems.findIndex(item => item.name === createdItem.name);
          if (matchingIndex !== -1) {
            updatedItems[matchingIndex].status = 'added';
            updatedItems[matchingIndex].message = `Added successfully (ID: ${createdItem.id})`;
            updatedItems[matchingIndex].finalId = createdItem.id;
            successfulItems.push(updatedItems[matchingIndex]);
          }
        });
      }
      
      // Set the updated items
      setItems(updatedItems);
      
      // Create submission summary
      const summary = { 
        total: itemsToSubmit.length,
        added: successfulItems.length, 
        duplicates: duplicateItems.length,
        errors: failedItems.length,
        skipped: 0
      };
      
      setSubmissionSummary(summary);
      console.log("[BulkAdd] Submission complete. Summary:", summary);
      
      // Show confirmation modal with the results
      setConfirmationModalData({
        title: 'Bulk Add Results',
        message: `Processed ${itemsToSubmit.length} items.`,
        summary: {
          'Total Items': itemsToSubmit.length,
          'Added to Database': successfulItems.length,
          'Duplicates': duplicateItems.length,
          'Errors': failedItems.length
        },
        variant: successfulItems.length > 0 ? 'success' : (duplicateItems.length > 0 ? 'warning' : 'error')
      });
      
      // Show the modal
      setTimeout(() => {
        setShowConfirmationModal(true);
      }, 100);
    } catch (error) {
      console.error('[BulkAdd handleSubmit] Submission failed:', error);
      setSubmissionError(error.message || 'An error occurred during submission.');
      setItems(prev => prev.map(item => item.status === 'ready' ? { ...item, status: 'error', message: error.message || 'Submission Error' } : item));
      
      // Show error modal
      setConfirmationModalData({
        title: 'Submission Failed',
        message: error.message || 'An error occurred during submission.',
        summary: null,
        variant: 'error'
      });
      
      // Show the modal with a slight delay to avoid React update issues
      setTimeout(() => {
        setShowConfirmationModal(true);
      }, 100);
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(100);
    }
  }, [items, submitBulkAdd]);

  const handleBackToInput = useCallback(() => {
    setMode('input');
    setItems([]);
    setRawText('');
    setSubmissionError(null);
    setSubmissionSummary(null);
    setSubmitProgress(0);
  }, []);

  // Calculate processing progress based on processed items
  const processingProgress = processedItems && processedItems.length > 0 ? 
    Math.round((processedItems.filter(item => item.status !== 'pending').length / processedItems.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Bulk Add Restaurants/Dishes</h1>
      {mode === 'input' && (
        <InputMode
          onRawTextChange={handleRawTextChange}
          onSubmit={handleProcess}
          rawText={rawText}
          isProcessing={isItemProcessing}
          processingProgress={processingProgress}
        />
      )}
      
      {/* Place Selection Dialog - shown when multiple places are found */}
      {awaitingSelection && currentProcessingIndex >= 0 && processedItems && 
       Array.isArray(processedItems) && processedItems.length > currentProcessingIndex && 
       processedItems[currentProcessingIndex]?.placeOptions?.length > 0 && (
        <PlaceSelectionDialog
          isOpen={true}
          options={processedItems[currentProcessingIndex].placeOptions}
          onSelect={selectPlace}
          onCancel={() => selectPlace(null)}
          restaurantName={processedItems[currentProcessingIndex].name}
        />
      )}
      {mode === 'review' && (
        <>
          {processingError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
              Error during processing: {processingError}
            </div>
          )}
          {submissionError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
              Error during submission: {submissionError}
            </div>
          )}
          {submissionSummary && (
            <div className={`mb-4 p-3 border rounded-md ${submissionSummary.error > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
              Submission Complete: Added: {submissionSummary.added}, Skipped (Duplicates): {submissionSummary.skipped}, Errors: {submissionSummary.error}
            </div>
          )}
          <ReviewMode
            items={items}
            onSubmit={handleSubmitReviewedItems}
            onBack={handleBackToInput}
            isSubmitting={isSubmitting}
            submitProgress={submitProgress}
          />
        </>
      )}
    </div>
  );
};

export default BulkAdd;