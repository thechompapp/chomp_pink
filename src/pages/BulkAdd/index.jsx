/* src/pages/BulkAdd/index.jsx */
/* Patched: Fix dishService import to use named import */
/* Patched: Define and pass submitItems function to processItems */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import InputMode from './inputMode.jsx'; // Correct casing to match actual file name
import ReviewMode from './ReviewMode.jsx'; // Ensure correct extension
import useBulkAddProcessor from '@/hooks/useBulkAddProcessor.js'; // Use global alias
// Import necessary service functions
import restaurantService from '@/services/restaurantService.js'; // Use global alias
// ** CORRECTED IMPORT SYNTAX FOR dishService **
import { dishService } from '@/services/dishService.js'; // Use global alias and named import
import { adminService } from '@/services/adminService'; // *** ADDED: Import adminService ***
import { ApiError } from '@/services/apiClient.js'; // Use global alias
import Button from '@/components/UI/Button.jsx'; // Use global alias

const BulkAdd = () => {
  console.log('[BulkAdd/index.jsx] Loaded version with setError defined and timeout');
  const [mode, setMode] = useState('input'); // 'input' or 'review'
  const [items, setItems] = useState([]); // Array of items being processed/reviewed
  const [rawText, setRawText] = useState('');
  const [submitProgress, setSubmitProgress] = useState(0); // Submission progress
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission status
  const [submissionError, setSubmissionError] = useState(null); // General submission error
  const [submissionSummary, setSubmissionSummary] = useState(null); // Store summary from backend

  // Hook for processing items (fetches details, etc.)
  const { processItems, isProcessing: isItemProcessing, error: processingError, processedCount, totalItems } = useBulkAddProcessor();

  // Callback passed to useBulkAddProcessor to update individual item status/message during processing
  const updateItemStatus = useCallback((index, status, message, details = {}) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (newItems[index]) { // Ensure item exists at index
          newItems[index] = { ...newItems[index], status, message, ...details }; // Include optional details
      }
      return newItems;
    });
  }, []); // No dependencies needed if it only uses index/status/message

  // Handler for raw text input change
  const handleRawTextChange = useCallback((text) => {
    // console.log('[BulkAdd] Raw text changed:'); // Removed text log for brevity
    setRawText(text);
  }, []);

  // *** ADDED: Define the submitItems function ***
  const submitItems = useCallback(async (itemsToSubmit) => {
    if (!Array.isArray(itemsToSubmit) || itemsToSubmit.length === 0) {
      throw new Error("No valid items provided for submission.");
    }
    console.log(`[submitItems in BulkAdd] Submitting ${itemsToSubmit.length} items...`);
    // Example: Group by type if backend expects separate calls, or send all at once
    // This example assumes a single backend call that handles mixed types
    try {
      const response = await adminService.bulkAddItems(itemsToSubmit);
      console.log('[submitItems in BulkAdd] Submission response:', response);
      if (!response.success) {
        throw new ApiError(response.error || 'Submission failed on backend.', response.status || 500, response);
      }
      return response; // Return the full response including summary and details
    } catch (error) {
      console.error('[submitItems in BulkAdd] Error during submission:', error);
      throw error; // Re-throw the error to be caught by handleSubmit
    }
  }, []); // No dependencies needed


  // Handler for clicking "Process Items"
  const handleProcess = useCallback(
    async () => {
      console.log('[BulkAdd] Processing raw text:'); // Removed text log
      setItems([]); // Clear previous items
      setSubmissionError(null); // Clear previous submission errors
      setSubmissionSummary(null); // Clear previous summary

      // Parse input text into items
      const rawItems = rawText
        .split('\n')
        .map((line, index) => ({ raw: line.trim(), _lineNumber: index + 1 }))
        .filter(item => item.raw)
        .map(item => {
            // Split line, default values if parts are missing
            const parts = item.raw.split(';').map(part => part.trim());
            const [name = '', type = '', location = '', tagsRaw = ''] = parts;
            const isDish = type?.toLowerCase() === 'dish';

            return {
                _lineNumber: item._lineNumber,
                name: name,
                type: isDish ? 'dish' : (type?.toLowerCase() === 'restaurant' ? 'restaurant' : 'unknown'), // Handle potential invalid type
                restaurant_name: isDish ? location : undefined, // Location is restaurant name for dishes
                city_name: !isDish ? location : undefined, // Location is city name for restaurants
                tags: tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()).filter(t => t) : [],
                status: 'pending', // Initial status
                message: 'Waiting to process...'
            };
        })
        .filter(item => item.type !== 'unknown' && item.name); // Filter out invalid types or missing names early

       if (rawItems.length === 0) {
           console.warn('[BulkAdd] No valid items found to process.');
           // Optionally set an error state here to inform the user
           setSubmissionError("No valid items found in the input text.");
           return;
       }

      setItems(rawItems);
      setMode('review');
      setSubmitProgress(0); // Reset progress

      // Call the hook to process items (fetch details, check duplicates, etc.)
      // *** Pass the submitItems function correctly ***
      await processItems(rawItems, updateItemStatus, setItems, submitItems); // Pass submitItems here
    },
    [rawText, processItems, updateItemStatus, setItems, submitItems] // Include setItems and submitItems if used/passed
  );


  // Handler for clicking "Submit X Ready Items" in ReviewMode
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
    setSubmitProgress(0); // Reset progress

    try {
      // Call the submission function defined earlier
      const result = await submitItems(itemsToSubmit);

      // Update status based on detailed results from backend
      setItems(prevItems => {
        const finalItems = [...prevItems];
        if (result?.data?.details && Array.isArray(result.data.details)) {
          result.data.details.forEach(detail => {
            // Find the corresponding item using a unique identifier if possible,
            // otherwise fall back to matching based on input data (less reliable)
            // Assuming detail.input might contain original _lineNumber or name/type combo
             const originalLineNumber = detail.input?._lineNumber ?? detail.input?.line;
             const matchingIndex = originalLineNumber
                ? finalItems.findIndex(item => item._lineNumber === originalLineNumber)
                : -1; // Or find based on name/type/etc. if no line number

            if (matchingIndex !== -1) {
              finalItems[matchingIndex].status = detail.status; // 'added', 'skipped', 'error'
              finalItems[matchingIndex].message = detail.reason || (detail.status === 'added' ? `Added (ID: ${detail.id})` : detail.status);
              if (detail.duplicateInfo) {
                  finalItems[matchingIndex].message += ` (Duplicate: ${detail.duplicateInfo.message || 'Exists'})`;
                  if (detail.duplicateInfo.existingId) {
                       finalItems[matchingIndex].message += ` ID: ${detail.duplicateInfo.existingId}`;
                  }
              }
              finalItems[matchingIndex].finalId = detail.id; // Store the created/existing ID
            } else {
                 console.warn("Could not match backend submission detail to frontend item:", detail);
            }
          });
        } else {
             console.warn("Submission response details missing or not an array:", result?.data?.details);
             // Optionally mark all submitted items with a generic success/failure message if details are missing
        }
        return finalItems;
      });

      setSubmissionSummary(result?.data?.summary || { added: 0, skipped: 0, error: 0 }); // Store summary

      console.log("[BulkAdd] Submission successful:", result?.data?.summary);

    } catch (error) {
      console.error('[BulkAdd handleSubmit] Submission failed:', error);
      // Set a general error message
      setSubmissionError(error.message || 'An error occurred during submission.');
       // Optionally mark all 'ready' items as errored on general failure
      setItems(prev => prev.map(item => item.status === 'ready' ? { ...item, status: 'error', message: error.message || 'Submission Error' } : item));
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(100); // Indicate completion (success or fail)
    }
  }, [items, submitItems]); // Dependency on items and submitItems

  const handleBackToInput = useCallback(() => {
    setMode('input');
    setItems([]); // Clear items when going back
    setRawText(''); // Optionally clear text too
    setSubmissionError(null);
    setSubmissionSummary(null);
    setSubmitProgress(0);
  }, []);


  // --- Render Logic ---
  const processingProgress = totalItems > 0 ? Math.round((processedCount / totalItems) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Bulk Add Restaurants/Dishes</h1>

      {mode === 'input' && (
        <InputMode
          onRawTextChange={handleRawTextChange}
          onSubmit={handleProcess} // Use handleProcess to trigger review mode
          rawText={rawText}
          isProcessing={isItemProcessing} // Pass processing state
          processingProgress={processingProgress} // Pass progress percentage
        />
      )}

      {mode === 'review' && (
        <>
           {/* Display Processing Error if it occurred */}
           {processingError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
                  Error during processing: {processingError}
              </div>
           )}
           {/* Display Submission Error if it occurred */}
           {submissionError && (
               <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
                  Error during submission: {submissionError}
               </div>
           )}
            {/* Display Submission Summary */}
            {submissionSummary && (
                 <div className={`mb-4 p-3 border rounded-md ${submissionSummary.error > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
                    Submission Complete: Added: {submissionSummary.added}, Skipped (Duplicates): {submissionSummary.skipped}, Errors: {submissionSummary.error}
                 </div>
            )}
           <ReviewMode
              items={items}
              onSubmit={handleSubmitReviewedItems} // Use the specific submit handler for ReviewMode
              onBack={handleBackToInput}
              isSubmitting={isSubmitting} // Pass submission loading state
              submitProgress={submitProgress} // Pass submission progress
           />
            <div className="mt-6 flex justify-between">
                <Button onClick={handleBackToInput} variant="secondary" disabled={isSubmitting}>
                    Back to Input
                </Button>
                <Button
                   onClick={handleSubmitReviewedItems} // Button triggers the submission handler
                   disabled={isSubmitting || items.filter(item => item.status === 'ready').length === 0}
                   isLoading={isSubmitting} // Show loading indicator on button
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