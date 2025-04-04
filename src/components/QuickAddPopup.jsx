// src/components/QuickAddPopup.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
// Updated imports to use @ alias
import { useQuickAdd } from '@/context/QuickAddContext';
import useUserListStore from '@/stores/useUserListStore';
import useAuthStore from '@/stores/useAuthStore';
import useFormHandler from '@/hooks/useFormHandler';
// Keep direct relative imports for components within the same feature/UI directory structure
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2, ListPlus, CheckCircle, Info } from 'lucide-react';

const QuickAddPopup = () => {
  // --- Context and Store Hooks ---
  const { isOpen, item, openQuickAdd, closeQuickAdd } = useQuickAdd();
  const userLists = useUserListStore((state) => state.userLists);
  const addToList = useUserListStore((state) => state.addToList);
  const isLoadingUser = useUserListStore((state) => state.isLoadingUser);
  // Use unified error state
  const errorUserListStore = useUserListStore((state) => state.error);
  const isAddingToList = useUserListStore((state) => state.isAddingToList);
  const manualRetryFetchLists = useUserListStore((state) => state.fetchUserLists);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // --- Local State ---
  const [selectedListId, setSelectedListId] = useState(null);
  const [localError, setLocalError] = useState('');
  const [justAddedToListId, setJustAddedToListId] = useState(null);
  const prevIsOpenRef = useRef(isOpen);

  // --- Memos ---
  const isCreateMode = useMemo(() => !!(item?.createNew && item?.type === 'list'), [item]);
  const title = useMemo(() => {
    if (!isOpen) return '';
    if (isCreateMode) return 'Create New List';
    return `Add "${item?.name ?? 'Item'}" to a List`;
  }, [isOpen, isCreateMode, item?.name]);

  // --- Form Handler Hook for Create List ---
  const {
      formData: newListFormData,
      handleChange: handleNewListChange,
      handleSubmit: handleNewListSubmit,
      isSubmitting: isCreatingList,
      submitError: createListError, // Use this for form-specific errors
      setSubmitError: setCreateListError,
      resetForm: resetNewListForm
  } = useFormHandler({
      name: '',
      description: '',
      is_public: true,
  });
  // --- End Form Handler ---

  // --- Effect: Reset local state AND form hook state when modal opens ---
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setSelectedListId(null);
      setLocalError('');
      setJustAddedToListId(null);
      resetNewListForm();
      setCreateListError(null); // Clear previous create errors
      // Clear general UserListStore error if appropriate
      // useUserListStore.getState().clearError?.();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, resetNewListForm, setCreateListError]);

  // Fetch lists logic
  useEffect(() => {
      const isAddItemMode = isOpen && !isCreateMode;
      const userListError = useUserListStore.getState().error; // Get current error state
      // Fetch only if authenticated, in add item mode, not loading, lists empty, and no relevant error
      if (isAddItemMode && isAuthenticated && !isLoadingUser && userLists.length === 0 && !userListError) {
          manualRetryFetchLists().catch(err => console.error("Error fetching user lists:", err));
      }
  }, [isOpen, isCreateMode, isAuthenticated, isLoadingUser, userLists, manualRetryFetchLists]);


  // --- Handlers ---
  const handleSelectList = useCallback((listId) => {
    setSelectedListId(prevId => (prevId === listId ? null : listId));
    setLocalError(''); // Clear local error on selection
    setJustAddedToListId(null);
  }, []);

  const handleRetryFetch = useCallback(() => {
      manualRetryFetchLists().catch(err => console.error("Retry fetch error:", err));
  }, [manualRetryFetchLists]);

  const handleSwitchToCreateMode = useCallback(() => {
      openQuickAdd({ type: 'list', createNew: true });
  }, [openQuickAdd]);

  // --- Submission Logic ---
  const performAddItem = async () => {
     setLocalError(''); // Clear local error
     // Clear store error before attempting action
     useUserListStore.getState().clearError?.();

     if (!isAuthenticated) { setLocalError("Please log in first."); return; }
     if (!selectedListId) { setLocalError("Please select a list."); return; }
     const itemId = item?.id; const itemType = item?.type;
     if (!itemId || !itemType) { setLocalError("Invalid item details."); return; }

     try {
       await addToList({ item: { id: itemId, type: itemType }, listId: selectedListId });
       setJustAddedToListId(selectedListId);
       setTimeout(closeQuickAdd, 1500);
     } catch (err) {
         // Error should be set in the store, no need to set localError unless it's a UI specific issue
         console.error("Error adding item:", err);
         // localError might still be set by the store if needed via subscription
      }
  };

  const performCreateList = async (currentFormData) => {
      // Clear store error before attempting action
      useUserListStore.getState().clearError?.();

      if (!isAuthenticated) throw new Error("Please log in first.");
      if (!currentFormData.name?.trim()) {
          throw new Error("List name is required.");
      }
      try {
          const listData = {
              name: currentFormData.name.trim(),
              description: currentFormData.description.trim() || null,
              is_public: currentFormData.is_public,
          };
          await addToList({ createNew: true, listData: listData });
          closeQuickAdd();
      } catch (err) {
          console.error("Error creating list via store:", err);
          throw err; // Re-throw for useFormHandler to catch
      }
  };

  const handleSubmit = () => {
      setLocalError(''); // Clear local UI error
      if (!isCreateMode) {
          performAddItem();
      } else {
          handleNewListSubmit(performCreateList); // Let the hook handle calling performCreateList
      }
  };
  // --- End Submission Logic ---

  // --- Render Logic ---
  if (!isOpen) return null;

  // Use the unified error from the store
  const storeError = useUserListStore((state) => state.error);

  const showUserListLoading = !isCreateMode && isLoadingUser && userLists.length === 0;
  const showUserListError = !isCreateMode && !isLoadingUser && !!storeError && storeError !== 'Session expired or invalid. Please log in again.';
  const showLoginPrompt = storeError === 'Session expired or invalid. Please log in again.';
  const showUserLists = !isCreateMode && !storeError && userLists.length > 0;
  const showNoListsMessage = !isCreateMode && !isLoadingUser && !storeError && userLists.length === 0;

  // Determine which error message to display (local UI, create form hook, or general store error)
  const displayError = localError || createListError || (showUserListError ? storeError : null);
  // Determine combined loading state
  const isProcessing = isAddingToList || isCreatingList;

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={title}>
        <div className="p-1">
         {!isAuthenticated ? (
           <p className="text-gray-600 text-sm text-center py-4"> Please{' '} <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline"> log in </Link> {' '}{isCreateMode ? 'to create lists.' : 'to add items to your lists.'} </p>
         ) : (
           <>
             {/* Create List Form */}
             {isCreateMode && (
               <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                 <div className="space-y-3 text-sm">
                   {/* Name Input */}
                   <div>
                     <label htmlFor="qa-list-name" className="block text-gray-700 font-medium mb-1">List Name*</label>
                     <input
                       id="qa-list-name" name="name" type="text" required
                       className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                       placeholder="e.g., NYC Cheap Eats"
                       value={newListFormData.name} onChange={handleNewListChange} disabled={isProcessing}
                     />
                   </div>
                   {/* Description Input */}
                   <div>
                     <label htmlFor="qa-list-desc" className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                     <textarea
                       id="qa-list-desc" name="description" rows="2"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                       placeholder="A short description of your list"
                       value={newListFormData.description} onChange={handleNewListChange} disabled={isProcessing}
                      ></textarea>
                   </div>
                   {/* Public/Private Toggle */}
                   <div className="flex items-center justify-start pt-1">
                     <label htmlFor="qa-list-public" className={`flex items-center mr-3 ${isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                       <div className="relative">
                         <input
                           type="checkbox" id="qa-list-public" name="is_public" className="sr-only peer"
                           checked={newListFormData.is_public} onChange={handleNewListChange} disabled={isProcessing}
                         />
                         <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                         <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                       </div>
                       <span className="ml-2 text-sm text-gray-700 select-none">{newListFormData.is_public ? 'Public' : 'Private'}</span>
                     </label>
                     <span className="text-xs text-gray-500 flex items-center">
                        <Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear in trending sections.
                     </span>
                   </div>
                 </div>
                 <button type="submit" disabled={isProcessing} className="hidden">Submit</button>
               </form>
             )}

             {/* Add Item View */}
             {!isCreateMode && (
               <>
                 {showUserListLoading && <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /><span className="ml-2 text-sm text-gray-500">Loading lists...</span></div>}
                 {showLoginPrompt && <p className="text-gray-600 text-sm text-center py-4"> Session expired. Please <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline"> log in </Link> again. </p>}
                 {showUserListError && <div className="text-center py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2"> Error: {storeError} <Button variant="tertiary" size="sm" className="ml-2 !text-xs" onClick={handleRetryFetch} disabled={isLoadingUser}>Retry</Button> </div>}
                 {showNoListsMessage && <p className="text-center py-4 text-sm text-gray-500"> You haven't created any lists yet. <button onClick={handleSwitchToCreateMode} className='text-[#A78B71] hover:underline ml-1 focus:outline-none'>Create one?</button> </p>}
                 {showUserLists && (
                   <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                     <p className="text-xs text-gray-500 mb-2">Select a list:</p>
                     {userLists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => handleSelectList(list.id)}
                          disabled={isProcessing || justAddedToListId === list.id}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${ selectedListId === list.id ? 'bg-[#D1B399]/20 border border-[#D1B399]' : 'hover:bg-gray-100 border border-transparent' } ${isProcessing || justAddedToListId === list.id ? 'cursor-not-allowed opacity-70' : ''}`}
                         >
                           <span className="font-medium text-gray-800 truncate">{list.name}</span>
                           {justAddedToListId === list.id && <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />}
                         </button>
                      ))}
                   </div>
                 )}
               </>
             )}

             {/* Action Error Display */}
             {displayError && (
                 <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
                    {typeof displayError === 'string' ? displayError : 'An error occurred.'}
                 </p>
             )}
           </>
         )}

         {/* Modal Actions */}
         <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
           <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isProcessing}> Cancel </Button>
           {isAuthenticated && (
             <Button
               onClick={handleSubmit}
               size="sm"
               variant="primary"
               disabled={
                 isProcessing ||
                 isLoadingUser || // Still disable if user lists loading in background
                 (!isCreateMode && !selectedListId) ||
                 (isCreateMode && !newListFormData.name?.trim())
               }
              >
               {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
               {isCreateMode ? 'Create List' : 'Add to List'}
             </Button>
           )}
         </div>
       </div>
    </Modal>
  );
};

export default QuickAddPopup;