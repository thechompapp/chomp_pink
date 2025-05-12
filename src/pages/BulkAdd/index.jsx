/* src/pages/BulkAdd/index.jsx */
/* Patched: Fix dishService import to use named import */
/* Patched: Define and pass submitItems function to processItems */
import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import InputMode from './InputMode.jsx';
import ReviewMode from './ReviewMode.jsx';
import useBulkAddProcessor from '@/hooks/useBulkAddProcessor.js';
import { restaurantService } from '@/services/restaurantService.js';
import { dishService } from '@/services/dishService.js';
import { adminService } from '@/services/adminService';
import './PlaceSelectionDialog.css'; // Import CSS for place selection dialog
import { ApiError } from '@/utils/apiUtils.js';
import Button from '@/components/UI/Button.jsx';
import { useAdminAddRow } from '@/hooks/useAdminAddRow'; // Updated import

const BulkAdd = () => {
  console.log('[BulkAdd/index.jsx] Loaded version with setError defined and timeout');
  const [mode, setMode] = useState('input');
  const [items, setItems] = useState([]);
  const [rawText, setRawText] = useState('');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionSummary, setSubmissionSummary] = useState(null);

  const { 
    processInputData, 
    isProcessing: isItemProcessing, 
    error: processingError, 
    items: processedItems,
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

  const handleSubmitReviewedItems = useCallback(async () => {
    const itemsToSubmit = items.filter(item => item.status === 'ready');
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
      const result = await submitBulkAdd(itemsToSubmit);
      setItems(prevItems => {
        const finalItems = [...prevItems];
        if (result?.data?.details && Array.isArray(result.data.details)) {
          result.data.details.forEach(detail => {
            const originalLineNumber = detail.input?._lineNumber ?? detail.input?.line;
            const matchingIndex = originalLineNumber
              ? finalItems.findIndex(item => item._lineNumber === originalLineNumber)
              : -1;

            if (matchingIndex !== -1) {
              finalItems[matchingIndex].status = detail.status;
              finalItems[matchingIndex].message = detail.reason || (detail.status === 'added' ? `Added (ID: ${detail.id})` : detail.status);
              if (detail.duplicateInfo) {
                finalItems[matchingIndex].message += ` (Duplicate: ${detail.duplicateInfo.message || 'Exists'})`;
                if (detail.duplicateInfo.existingId) {
                  finalItems[matchingIndex].message += ` ID: ${detail.duplicateInfo.existingId}`;
                }
              }
              finalItems[matchingIndex].finalId = detail.id;
            } else {
              console.warn("Could not match backend submission detail to frontend item:", detail);
            }
          });
        } else {
          console.warn("Submission response details missing or not an array:", result?.data?.details);
        }
        return finalItems;
      });

      setSubmissionSummary(result?.data?.summary || { added: 0, skipped: 0, error: 0 });
      console.log("[BulkAdd] Submission successful:", result?.data?.summary);
    } catch (error) {
      console.error('[BulkAdd handleSubmit] Submission failed:', error);
      setSubmissionError(error.message || 'An error occurred during submission.');
      setItems(prev => prev.map(item => item.status === 'ready' ? { ...item, status: 'error', message: error.message || 'Submission Error' } : item));
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
        <div className="place-selection-dialog">
          <div className="place-selection-content">
            <h3>Multiple locations found for "{processedItems[currentProcessingIndex].name}"</h3>
            <p>Please select the correct location:</p>
            <div className="place-options">
              {processedItems[currentProcessingIndex].placeOptions.map((option, index) => (
                <div key={option.placeId || index} className="place-option">
                  <button 
                    onClick={() => selectPlace(option.placeId)}
                    className="place-select-button"
                  >
                    <strong>
                      {option.mainText || 
                       (option.description && option.description.includes(',') ? 
                        option.description.split(',')[0] : 
                        option.description || 'Location Option ' + (index + 1))}
                    </strong>
                    <span>
                      {option.secondaryText || 
                       (option.description && option.description.includes(',') ? 
                        option.description.substring(option.description.indexOf(',') + 1) : 
                        '')}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => selectPlace(null)} 
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
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
          <div className="mt-6 flex justify-between">
            <Button onClick={handleBackToInput} variant="secondary" disabled={isSubmitting}>
              Back to Input
            </Button>
            <Button
              onClick={handleSubmitReviewedItems}
              disabled={isSubmitting || items.filter(item => item.status === 'ready').length === 0}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : `Submit ${items.filter(item => item.status === 'ready').length} Ready Items`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkAdd;