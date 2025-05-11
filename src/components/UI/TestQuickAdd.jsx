import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import Button from '@/components/UI/Button';
import { logDebug, logError } from '@/utils/logger';

/**
 * Test component for debugging quickadd functionality
 */
const TestQuickAdd = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async ({ listId, itemData }) => {
      try {
        logDebug('[TestQuickAdd] Adding item to list:', { listId, itemData });
        const response = await listService.addItemToList(listId, itemData);
        setResult(response);
        return response;
      } catch (err) {
        setError(err.message || 'Unknown error');
        throw err;
      }
    },
    onSuccess: (data) => {
      logDebug('[TestQuickAdd] Successfully added item:', data);
    },
    onError: (err) => {
      logError('[TestQuickAdd] Error adding item:', err);
    }
  });
  
  // Handle test
  const handleTestAdd = () => {
    setResult(null);
    setError(null);
    
    // Test with fixed values
    addItemMutation.mutate({
      listId: 2, // Chicago Comfort Foods list
      itemData: {
        item_id: 1,
        item_type: 'restaurant'
      }
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-lg font-bold mb-4">Test Quick Add Functionality</h2>
      
      <Button
        onClick={handleTestAdd}
        disabled={addItemMutation.isPending}
        className="w-full mb-4"
      >
        {addItemMutation.isPending ? 'Adding...' : 'Test Add Item to List'}
      </Button>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md">
          <p className="font-bold">Result:</p>
          <pre className="whitespace-pre-wrap text-xs mt-2">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Auth Status: Check browser console for details
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This test adds an item to List #2 (Chicago Comfort Foods)
        </p>
      </div>
    </div>
  );
};

export default TestQuickAdd;
