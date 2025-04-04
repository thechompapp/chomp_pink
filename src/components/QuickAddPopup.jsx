// src/components/QuickAddPopup.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useQuickAdd } from '../context/QuickAddContext';
import useUserListStore from '../stores/useUserListStore';
import useAuthStore from '../stores/useAuthStore';
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const QuickAddPopup = () => {
  const { isOpen, item, closeQuickAdd } = useQuickAdd();

  // Individual state selectors
  const userLists = useUserListStore((state) => state.userLists);
  const fetchUserLists = useUserListStore((state) => state.fetchUserLists);
  const addToList = useUserListStore((state) => state.addToList);
  const isLoadingUser = useUserListStore((state) => state.isLoadingUser);
  const errorUser = useUserListStore((state) => state.errorUser);
  const isAddingToList = useUserListStore((state) => state.isAddingToList);
  const addToListError = useUserListStore((state) => state.addToListError);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Local state
  const [selectedListId, setSelectedListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [localError, setLocalError] = useState('');

  console.log('[QuickAddPopup RENDER START] isOpen:', isOpen, 'item:', item);

  const isCreateMode = !!(item?.createNew && item?.type === 'list');

  // Calculate title using useMemo
  const title = useMemo(() => {
    if (!isOpen) return '';
    return isCreateMode ? "Create New List" : `Add "${item?.name || 'this item'}" to...`;
  }, [isOpen, isCreateMode, item]);
  console.log('[QuickAddPopup] Calculated title:', title);


  useEffect(() => {
    // Reset local state when modal opens
    if (isOpen) {
      console.log('[QuickAddPopup useEffect] Resetting local state because isOpen is true.');
      setLocalError('');
      setSelectedListId(null);
      setNewListName('');
      setNewListDescription('');
      setNewListIsPublic(true);
    }

    console.log('[QuickAddPopup useEffect] Checking conditions: ', { isOpen, isCreateMode, isAuthenticated, isLoadingUser, errorUser, userListsLength: userLists?.length });

    // *** FIX: Fetch lists only if needed AND lists aren't already loaded in the store ***
    // Fetch if: modal is open, not create mode, authenticated, not currently loading/erroring, AND userLists array is currently empty.
    if (isOpen && !isCreateMode && isAuthenticated && !isLoadingUser && !errorUser && userLists.length === 0) {
      console.log('[QuickAddPopup useEffect] Conditions met to fetch lists (lists are empty).');
      console.log('[QuickAddPopup useEffect] ===> ABOUT TO CALL fetchUserLists()');
      fetchUserLists().then(() => {
          console.log('[QuickAddPopup useEffect] ===> fetchUserLists() PROMISE RESOLVED');
      }).catch(err => {
          console.error("[QuickAddPopup useEffect] ===> fetchUserLists() PROMISE REJECTED:", err);
       });
       console.log('[QuickAddPopup useEffect] ===> CALLED fetchUserLists() (async)');
    } else if (isOpen && !isCreateMode) { // Log why fetch wasn't triggered if popup is open in add mode
        if(isLoadingUser) console.log('[QuickAddPopup useEffect] Conditions NOT met to fetch: isLoadingUser is true.');
        else if(errorUser) console.log('[QuickAddPopup useEffect] Conditions NOT met to fetch: errorUser exists.');
        else if(userLists.length > 0) console.log('[QuickAddPopup useEffect] Conditions NOT met to fetch: userLists already populated.');
        else console.log('[QuickAddPopup useEffect] Conditions NOT met to fetch lists (check auth/mode).');
    }
    // Updated dependencies - remove userLists.length as dependency, keep userLists itself if needed elsewhere by effect, but not needed here.
  }, [isOpen, isCreateMode, isAuthenticated, isLoadingUser, errorUser, fetchUserLists]); // Depends on loading/error state to potentially trigger later if needed


  const handleSubmit = async () => {
     // (Keep handleSubmit logic as is)
     setLocalError('');
     if (isCreateMode) {
         if (!newListName.trim()) { setLocalError("List name is required."); return; }
         if (isAddingToList) return;
         const listData = { name: newListName.trim(), description: newListDescription.trim() || null, is_public: newListIsPublic };
         try { await addToList({ createNew: true, listData: listData }); closeQuickAdd(); } catch (err) { setLocalError(err.message || 'Error creating list.'); }
     } else {
         if (!selectedListId || !item || isAddingToList) return;
         try { await addToList({ item, listId: selectedListId }); closeQuickAdd(); } catch (err) { setLocalError(err.message || 'Error adding item.'); }
     }
   };


  // Early returns
  if (!isOpen) return null;
  if (!isCreateMode && !item) {
     console.log('[QuickAddPopup Render] Waiting for item details in add mode...');
     return <Modal isOpen={isOpen} onClose={closeQuickAdd} title={title}><div className="p-4"><Loader2 className="animate-spin"/></div></Modal>;
  }

  // Determine if we should show loading (only in add mode)
  const showLoading = !isCreateMode && isLoadingUser;
  // Determine if lists should be shown (add mode, not loading, no error, lists exist)
  const showLists = !isCreateMode && !isLoadingUser && !errorUser && userLists.length > 0;
  // Determine if "no lists found" message should show (add mode, not loading, no error, lists empty)
  const showNoListsMessage = !isCreateMode && !isLoadingUser && !errorUser && userLists.length === 0;

  console.log('[QuickAddPopup Render] Rendering modal MAIN RETURN. Mode:', isCreateMode ? 'Create' : 'Add', 'showLoading:', showLoading, 'showLists:', showLists, 'showNoListsMessage:', showNoListsMessage, 'userLists:', userLists);


  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={title}>
        <div className="p-4">
          {!isAuthenticated ? (
             <p className="text-gray-600"> Please{' '} <Link to="/login" className="text-[#A78B71] hover:text-[#D1B399] underline" onClick={closeQuickAdd}> log in </Link>{' '} {isCreateMode ? 'to create lists.' : 'to add items to your lists.'} </p>
          ) : (
            <>
              {/* === CREATE LIST FORM === */}
              {isCreateMode && (
                 // ... create list form fields ...
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
                    <input type="text" id="new-list-name" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm" placeholder="e.g., My Favorite Burgers" maxLength={100} required disabled={isAddingToList}/>
                  </div>
                  <div>
                     <label htmlFor="new-list-desc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                     <textarea id="new-list-desc" value={newListDescription} onChange={(e) => setNewListDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm" rows={3} placeholder="Add a short description..." maxLength={500} disabled={isAddingToList}/>
                  </div>
                </div>
              )}

              {/* === ADD ITEM TO LIST UI === */}
              {!isCreateMode && (
                <>
                  {/* Loading State */}
                  {showLoading && (
                       <div className="flex items-center justify-center py-4"> <Loader2 className="animate-spin h-5 w-5 text-gray-500 mr-2" /> <p className="text-gray-600">Loading your lists...</p> </div>
                   )}
                  {/* Fetch Error State */}
                  {errorUser && !isLoadingUser && ( // Show error only if not loading
                      <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">Error loading lists: {errorUser}</p>
                  )}
                  {/* No Lists State */}
                  {showNoListsMessage && (
                     <p className="text-gray-600 text-center py-4">No lists found. You can create one using the floating '+' button.</p>
                  )}

                  {/* Display Lists */}
                  {showLists && (
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                       {userLists.map((list) => (
                         <button
                           key={list.id}
                           onClick={() => setSelectedListId(list.id)}
                           className={`w-full text-left p-3 rounded-lg border transition-colors ${
                             selectedListId === list.id
                               ? "bg-[#D1B399]/20 border-[#D1B399]"
                               : "bg-white border-gray-200 hover:bg-gray-50"
                           }`}
                           disabled={isAddingToList}
                         >
                           <div className="font-medium text-gray-900">{list.name}</div>
                           <div className="text-xs text-gray-500">{list.item_count || 0} items</div>
                         </button>
                       ))}
                     </div>
                  )}
                </>
              )}

               {/* Action Error State */}
               {(localError || addToListError) && (
                   <p className="text-red-500 text-sm mt-3 bg-red-50 p-2 rounded border border-red-200">
                       Error: {localError || addToListError}
                   </p>
               )}
            </>
          )}
          {/* Modal Actions */}
          <div className="mt-5 flex justify-end space-x-2 border-t pt-4">
            <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToList}> Cancel </Button>
            {isAuthenticated && (
               <Button
                   onClick={handleSubmit}
                   disabled={isAddingToList || (!isCreateMode && !selectedListId) || (isCreateMode && !newListName.trim())}
                   size="sm"
                >
                   {isAddingToList ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
                   {isCreateMode ? 'Create List' : 'Add to List'}
               </Button>
             )}
          </div>
        </div>
    </Modal>
  );
};

export default QuickAddPopup;