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
      // First, check for duplicates using the API
      console.log('[BulkAdd] Checking for duplicates before submission...');
      
      // Format items for duplicate check
      const checkPayload = {
        items: itemsToSubmit.map(item => ({
          name: item.name,
          type: item.type || 'restaurant',
          city_id: item.city_id || 1,
          _lineNumber: item._lineNumber
        }))
      };
      
      // Call the duplicate check API
      console.log('[BulkAdd] Calling duplicate check with payload:', checkPayload);
      const checkResponse = await adminService.checkExistingItems(checkPayload);
      console.log('[BulkAdd] Duplicate check response:', checkResponse);
      
      // Process duplicate check results
      const duplicateResults = [];
      const uniqueItems = [];
      
      if (checkResponse && checkResponse.success && checkResponse.data && checkResponse.data.results) {
        // Process each item to determine if it's a duplicate
        itemsToSubmit.forEach(item => {
          const matchingResult = checkResponse.data.results.find(result => 
            result.item && result.item._lineNumber === item._lineNumber
          );
          
          if (matchingResult && matchingResult.existing) {
            // This is a duplicate
            duplicateResults.push({
              ...item,
              isDuplicate: true,
              duplicateInfo: matchingResult.existing,
              status: 'duplicate',
              message: `Duplicate of existing restaurant (ID: ${matchingResult.existing.id})`
            });
          } else {
            // This is a unique item
            uniqueItems.push(item);
          }
        });
      } else {
        // If duplicate check fails, proceed with all items
        uniqueItems.push(...itemsToSubmit);
      }
      
      console.log(`[BulkAdd] After duplicate check: ${uniqueItems.length} unique items, ${duplicateResults.length} duplicates`);
      
      // If no unique items, return early with duplicate information
      if (uniqueItems.length === 0) {
        console.log('[BulkAdd] All items are duplicates, no submission needed');
        
        // Update the items with duplicate information
        const updatedItems = [...items];
        duplicateResults.forEach(dupItem => {
          const index = updatedItems.findIndex(item => item._lineNumber === dupItem._lineNumber);
          if (index !== -1) {
            updatedItems[index] = { ...dupItem };
          }
        });
        
        setItems(updatedItems);
        
        // Create submission summary
        const summary = { 
          total: itemsToSubmit.length,
          added: 0,
          duplicates: duplicateResults.length,
          errors: 0,
          skipped: 0
        };
        
        setSubmissionSummary(summary);
        
        // Show confirmation modal
        setConfirmationModalData({
          title: 'Bulk Add Results',
          message: 'All items are duplicates. No new items were added.',
          summary: {
            'Total Items': itemsToSubmit.length,
            'Added to Database': 0,
            'Duplicates': duplicateResults.length,
            'Errors': 0
          },
          variant: 'warning'
        });
        
        setShowConfirmationModal(true);
        setIsSubmitting(false);
        setSubmitProgress(100);
        return;
      }
      
      // Format unique items for submission
      const formattedItems = uniqueItems.map(item => ({
        name: item.name,
        type: item.type || 'restaurant',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zipcode: item.zipcode || '',
        city_id: item.city_id || 1,
        neighborhood_id: item.neighborhood_id || null,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        tags: item.tags || [],
        place_id: item.placeId || '',
        _lineNumber: item._lineNumber
      }));
      
      // Create the payload for the API
      const submitPayload = { items: formattedItems };
      
      // Submit unique items to the API
      console.log('[BulkAdd] Submitting unique items:', submitPayload);
      const submitResponse = await adminService.bulkAddItems(submitPayload);
      console.log('[BulkAdd] Submission response:', submitResponse);
      
      if (!submitResponse || !submitResponse.success) {
        throw new Error(submitResponse?.message || 'Failed to add items');
      }
      
      // Process the response
      const updatedItems = [...items];
      const successfulItems = [];
      const failedItems = [];
      
      // Process created items
      if (submitResponse.data && submitResponse.data.createdItems && Array.isArray(submitResponse.data.createdItems)) {
        submitResponse.data.createdItems.forEach(createdItem => {
          // Find the matching item
          const matchingItem = uniqueItems.find(item => item.name.toLowerCase() === createdItem.name.toLowerCase());
          if (matchingItem) {
            // Find the index in the original items array
            const index = updatedItems.findIndex(item => item._lineNumber === matchingItem._lineNumber);
            if (index !== -1) {
              updatedItems[index].status = 'added';
              updatedItems[index].message = `Added successfully (ID: ${createdItem.id})`;
              updatedItems[index].finalId = createdItem.id;
              successfulItems.push(updatedItems[index]);
            }
          }
        });
      }
      
      // Process error items
      if (submitResponse.data && submitResponse.data.errors && Array.isArray(submitResponse.data.errors)) {
        submitResponse.data.errors.forEach(error => {
          if (error.itemProvided) {
            // Find the matching item
            const matchingItem = uniqueItems.find(item => {
              if (error.itemProvided._lineNumber) {
                return item._lineNumber === error.itemProvided._lineNumber;
              } else if (error.itemProvided.name) {
                return item.name.toLowerCase() === error.itemProvided.name.toLowerCase();
              }
              return false;
            });
            
            if (matchingItem) {
              // Find the index in the original items array
              const index = updatedItems.findIndex(item => item._lineNumber === matchingItem._lineNumber);
              if (index !== -1) {
                // Check if it's a duplicate error
                if (error.error && error.error.includes('duplicate')) {
                  updatedItems[index].status = 'duplicate';
                  updatedItems[index].message = `Duplicate: ${error.error}`;
                  updatedItems[index].isDuplicate = true;
                  duplicateResults.push(updatedItems[index]);
                } else {
                  updatedItems[index].status = 'error';
                  updatedItems[index].message = `Error: ${error.error || 'Unknown error'}`;
                  failedItems.push(updatedItems[index]);
                }
              }
            }
          }
        });
      }
      
      // Update items that were not processed
      uniqueItems.forEach(item => {
        const wasProcessed = 
          successfulItems.some(s => s._lineNumber === item._lineNumber) ||
          duplicateResults.some(d => d._lineNumber === item._lineNumber) ||
          failedItems.some(f => f._lineNumber === item._lineNumber);
        
        if (!wasProcessed) {
          const index = updatedItems.findIndex(u => u._lineNumber === item._lineNumber);
          if (index !== -1) {
            updatedItems[index].status = 'error';
            updatedItems[index].message = 'Item was not processed';
            failedItems.push(updatedItems[index]);
          }
        }
      });
      
      // Update the items state
      setItems(updatedItems);
      
      // Create submission summary including duplicates from both checks
      const summary = { 
        total: itemsToSubmit.length,
        added: successfulItems.length,
        duplicates: duplicateResults.length,
        errors: failedItems.length,
        skipped: 0
      };
      
      setSubmissionSummary(summary);
      console.log('[BulkAdd] Submission complete. Summary:', summary);
      
      // Show confirmation modal
      setConfirmationModalData({
        title: 'Bulk Add Results',
        message: `Processed ${itemsToSubmit.length} items.`,
        summary: {
          'Total Items': itemsToSubmit.length,
          'Added to Database': successfulItems.length,
          'Duplicates': duplicateResults.length,
          'Errors': failedItems.length
        },
        variant: successfulItems.length > 0 ? 'success' : (duplicateResults.length > 0 ? 'warning' : 'error')
      });
      
      // Force the modal to show
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('[BulkAdd] Submission failed:', error);
      setSubmissionError(error.message || 'An error occurred during submission.');
      
      // Update items with error status
      setItems(prev => prev.map(item => {
        if (itemsToSubmit.some(i => i._lineNumber === item._lineNumber)) {
          return { ...item, status: 'error', message: error.message || 'Submission Error' };
        }
        return item;
      }));
      
      // Show error modal
      setConfirmationModalData({
        title: 'Submission Failed',
        message: error.message || 'An error occurred during submission.',
        summary: {
          'Error': error.message || 'An error occurred during submission.'
        },
        variant: 'error'
      });
      
      // Force the modal to show
      setShowConfirmationModal(true);
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(100);
    }
  }, [items, adminService]);

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