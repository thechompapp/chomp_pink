// src/components/QuickAddPopup.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
// Removed shallow import
import { useQuickAdd } from '../context/QuickAddContext';
import useUserListStore from '../stores/useUserListStore';
import useAuthStore from '../stores/useAuthStore';
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2, ListPlus, CheckCircle } from 'lucide-react';

const QuickAddPopup = () => {
  // --- Context and Store Hooks ---
  const { isOpen, item, closeQuickAdd } = useQuickAdd();

  // Revert back to individual selectors
  const userLists = useUserListStore((state) => state.userLists);
  const addToList = useUserListStore((state) => state.addToList);
  const isLoadingUser = useUserListStore((state) => state.isLoadingUser);
  const errorUser = useUserListStore((state) => state.errorUser);
  const isAddingToList = useUserListStore((state) => state.isAddingToList);
  const addToListError = useUserListStore((state) => state.addToListError);
  const manualRetryFetchLists = useUserListStore((state) => state.fetchUserLists);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // --- Local State ---
  const [selectedListId, setSelectedListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [localError, setLocalError] = useState('');
  const [justAddedToListId, setJustAddedToListId] = useState(null);

  // Ref to track if the modal was previously open
  const prevIsOpenRef = useRef(isOpen);

  // --- Memos ---
  const isCreateMode = useMemo(() => !!(item?.createNew && item?.type === 'list'), [item]);
  const title = useMemo(() => {
    if (!isOpen) return '';
    if (isCreateMode) return 'Create New List';
    return `Add "${item?.name ?? 'Item'}" to a List`;
  }, [isOpen, isCreateMode, item?.name]);

  // --- Effect: Reset local state ONLY when modal transitions from closed to open ---
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      console.log('[QuickAddPopup useEffect] Modal transitioned to open. Resetting local state.');
      setSelectedListId(null);
      setNewListName('');
      setNewListDescription('');
      setNewListIsPublic(true);
      setLocalError('');
      setJustAddedToListId(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]); // Only depends on isOpen

  // List fetching is handled by QuickAddContext trigger

  // --- Handlers ---
  const handleSelectList = useCallback((listId) => {
    console.log(`[QuickAddPopup] handleSelectList called with ID: ${listId}`);
    setSelectedListId(prevId => (prevId === listId ? null : listId));
    setLocalError(''); setJustAddedToListId(null);
  }, []);

  const handleRetryFetch = useCallback(() => {
      console.log("[QuickAddPopup] Retrying fetchUserLists via button...");
      manualRetryFetchLists().catch(err => console.error("Retry fetch error:", err));
  }, [manualRetryFetchLists]);

  const handleSubmit = useCallback(async () => {
     console.log('[QuickAddPopup] handleSubmit called.');
     setLocalError(''); setJustAddedToListId(null);
     if (!isAuthenticated) { setLocalError("Please log in first."); return; }
     if (!isCreateMode) { // Add Item Mode
        if (!selectedListId) { setLocalError("Please select a list."); return; }
        const itemId = item?.id; const itemType = item?.type;
        if (!itemId || !itemType) { setLocalError("Invalid item details."); return; }
        console.log(`[QuickAddPopup handleSubmit] Attempting to add item ${itemType}:${itemId} to list ${selectedListId}`);
        try {
          await addToList({ item: { id: itemId, type: itemType }, listId: selectedListId });
          console.log(`[QuickAddPopup handleSubmit] addToList finished for item ${itemType}:${itemId}`);
          setJustAddedToListId(selectedListId);
          setTimeout(closeQuickAdd, 1500);
        } catch (err) { console.error("Error adding item:", err); /* Store handles error state */ }
     } else { // Create List Mode
        if (!newListName.trim()) { setLocalError("List name required."); return; }
        console.log(`[QuickAddPopup handleSubmit] Attempting to create list "${newListName}"`);
        try {
          const newListData = { name: newListName.trim(), description: newListDescription.trim() || null, is_public: newListIsPublic };
          await addToList({ createNew: true, listData: newListData });
           console.log(`[QuickAddPopup handleSubmit] addToList (create) finished for "${newListName}"`);
          closeQuickAdd();
        } catch (err) { console.error("Error creating list:", err); /* Store handles error state */ }
     }
   }, [
       isAuthenticated, isCreateMode, selectedListId, item, newListName, newListDescription,
       newListIsPublic, addToList, closeQuickAdd
   ]);

  // --- Render Logic ---
  if (!isOpen) return null; // Don't render if closed

  // console.log('[QuickAddPopup Rendering]', { isOpen, isCreateMode, itemId: item?.id, isLoadingUser, hasLists: userLists.length > 0, errorUser, selectedListId });

  const showUserListLoading = !isCreateMode && isLoadingUser && userLists.length === 0;
  const showUserListError = !isCreateMode && !isLoadingUser && !!errorUser && errorUser !== 'Session expired or invalid. Please log in again.';
  const showLoginPromptForList = !isCreateMode && errorUser === 'Session expired or invalid. Please log in again.';
  const showUserLists = !isCreateMode && !errorUser && userLists.length > 0;
  const showNoListsMessage = !isCreateMode && !isLoadingUser && !errorUser && userLists.length === 0;
  const displayError = localError || (addToListError && addToListError !== 'Session expired or invalid. Please log in again.');

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={title}>
        {/* ... JSX structure remains the same ... */}
        <div className="p-1">
         {!isAuthenticated ? (
           <p className="text-gray-600 text-sm text-center py-4"> Please{' '} <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline"> log in </Link> {' '}{isCreateMode ? 'to create lists.' : 'to add items to your lists.'} </p>
         ) : (
           <>
             {/* Create List Form */}
             {isCreateMode && ( <div className="space-y-3"> {/* ... form JSX ... */} </div> )}
             {/* Add Item View */}
             {!isCreateMode && (
               <>
                 {showUserListLoading && <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /><span className="ml-2 text-sm text-gray-500">Loading lists...</span></div>}
                 {showLoginPromptForList && <p className="text-gray-600 text-sm text-center py-4"> Session expired. Please <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline"> log in </Link> again. </p>}
                 {showUserListError && <div className="text-center py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2"> Error: {errorUser} <Button variant="tertiary" size="sm" className="ml-2 !text-xs" onClick={handleRetryFetch} disabled={isLoadingUser}>Retry</Button> </div>}
                 {showNoListsMessage && <p className="text-center py-4 text-sm text-gray-500"> You haven't created any lists yet. </p>}
                 {showUserLists && (
                   <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                     <p className="text-xs text-gray-500 mb-2">Select a list:</p>
                     {userLists.map((list) => ( <button key={list.id} onClick={() => handleSelectList(list.id)} disabled={isAddingToList || justAddedToListId === list.id} className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${ selectedListId === list.id ? 'bg-[#D1B399]/20 border border-[#D1B399]' : 'hover:bg-gray-100 border border-transparent' } ${isAddingToList || justAddedToListId === list.id ? 'cursor-not-allowed opacity-70' : ''}`}> <span className="font-medium text-gray-800 truncate">{list.name}</span> {justAddedToListId === list.id && <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />} </button> ))}
                   </div>
                 )}
               </>
             )}
             {/* Action Error Display */}
             {displayError && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {displayError} </p>}
           </>
         )}
         {/* Modal Actions */}
         <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
           <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToList}> Cancel </Button>
           {isAuthenticated && ( <Button onClick={handleSubmit} size="sm" variant="primary" disabled={ isAddingToList || isLoadingUser || (!isCreateMode && !selectedListId) || (isCreateMode && !newListName.trim()) }> {isAddingToList ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null} {isCreateMode ? 'Create List' : 'Add to List'} </Button> )}
         </div>
       </div>
    </Modal>
  );
};

export default QuickAddPopup;