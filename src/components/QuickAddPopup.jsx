/* src/components/QuickAddPopup.jsx */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuickAdd } from '@/context/QuickAddContext';
import useAuthStore from '@/stores/useAuthStore';
// Corrected: Use named import and shallow compare
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow';
import Modal from '@/components/UI/Modal';
import Button from '@/components/Button';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const QuickAddPopup = () => {
  const { isOpen, closeQuickAdd, item, userLists, addToList, fetchError } = useQuickAdd();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Corrected: Use shallow compare for the selector object
  const { cuisines, isLoadingCuisines } = useUIStateStore(
    useShallow((state) => ({
      cuisines: state.cuisines || [],
      isLoadingCuisines: state.isLoadingCuisines,
    }))
  );

  const [selectedListId, setSelectedListId] = useState(null);
  const [localError, setLocalError] = useState('');
  const [justAddedToListId, setJustAddedToListId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPublic, setNewListIsPublic] = useState(true);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [showTagSuggestionsUI, setShowTagSuggestionsUI] = useState(false); // Separate state for UI visibility
  const prevIsOpenRef = useRef(isOpen);
  const isAddingToListRef = useRef(false);
  const tagInputRef = useRef(null); // Ref for tag input container


  const resetState = useCallback(() => {
    setSelectedListId(null);
    setLocalError('');
    setJustAddedToListId(null);
    setIsCreatingNew(false);
    setNewListName('');
    setNewListDescription('');
    setNewListIsPublic(true);
    setHashtagInput('');
    setSelectedHashtags([]);
    setShowTagSuggestionsUI(false);
  }, []);

  // Effect to reset state when modal closes
  useEffect(() => {
    if (!isOpen && prevIsOpenRef.current) {
      resetState();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, resetState]);

  // Effect to set initial mode when modal opens with specific item data
   useEffect(() => {
     if (isOpen) {
       const shouldBeCreating = item?.createNew && item?.type === 'list';
       setIsCreatingNew(shouldBeCreating);
       setLocalError(''); // Clear error on open
     }
   }, [isOpen, item]); // Rerun when item changes while open

   // Click outside listener for tag suggestions
   useEffect(() => {
        const handleClickOutside = (event) => {
          if (showTagSuggestionsUI && tagInputRef.current && !tagInputRef.current.contains(event.target)) {
             setShowTagSuggestionsUI(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTagSuggestionsUI]); // Only depends on the UI state


  const handleConfirmAction = useCallback(async () => {
    // Prevent double submission
    if (isAddingToListRef.current) return;
    isAddingToListRef.current = true; // Set flag immediately
    setLocalError(''); // Clear previous error

    if (!isAuthenticated) {
      setLocalError('Please log in first.');
      isAddingToListRef.current = false; // Reset flag
      return;
    }

    try {
      let listIdToConfirm = null; // Track the list ID for confirmation message/UI

      if (isCreatingNew) {
        if (!newListName.trim()) {
          throw new Error('List name is required.'); // Throw error instead of just setting local state
        }
        const result = await addToList({ // Await the promise
          item: item && item.type !== 'list' && item.id ? { id: item.id, type: item.type } : null,
          createNew: true,
          listData: {
            name: newListName.trim(),
            description: newListDescription.trim() || null,
            is_public: newListIsPublic,
            tags: selectedHashtags,
            // Use item type if available, otherwise default to 'mixed'
            list_type: (item && item.type !== 'list' ? item.type : 'mixed'),
          },
        });
         if (!result?.success) { // Check success flag from result
           throw new Error(result?.message || 'Failed to create list.');
         }
         listIdToConfirm = result.listId; // Get list ID from result
         // Optional: Show success message for creation?
      } else {
        if (!selectedListId) {
          throw new Error('Please select a list.'); // Throw error
        }
        if (!item || !item.id || !item.type || item.type === 'list') {
           throw new Error('Invalid item selected.'); // Throw error
        }
        const result = await addToList({ item: { id: item.id, type: item.type }, listId: selectedListId });
        if (!result?.success) { // Check success flag
            // Error message might be handled by addToList throwing, or check result.message
             throw new Error(result?.message || 'Failed to add item to list.');
        }
         listIdToConfirm = result.listId; // Get list ID from result
      }

      // Handle successful add/create
      if (listIdToConfirm) {
          setJustAddedToListId(listIdToConfirm); // Show confirmation checkmark
          setTimeout(() => {
              if (useQuickAdd.getState().isOpen) { // Check if modal is still open
                  closeQuickAdd();
              }
          }, 1500); // Close after 1.5 seconds
      } else {
           // If success was true but no listId, close immediately
           if (isOpen) { closeQuickAdd(); }
      }

    } catch (err) {
      console.error('[QuickAddPopup] Error during confirm action:', err);
      // Use error message from the caught error
      const errorMessage = err.message?.includes('Item already exists in list')
        ? 'This item is already in the selected list.'
        : err.message?.includes('Cannot add')
        ? err.message
        : (err.message || 'Operation failed.');
      setLocalError(errorMessage);
    } finally {
       // Reset flag ONLY IF no close timer is set (i.e., error occurred or immediate close)
       // If a timer is set, the ref will be reset when the modal closes and resetState runs.
        if (justAddedToListId === null) {
             isAddingToListRef.current = false;
        }
    }
  }, [
    item,
    selectedListId,
    isCreatingNew,
    newListName,
    newListDescription,
    newListIsPublic,
    selectedHashtags,
    isAuthenticated,
    addToList,
    closeQuickAdd,
    isOpen,
    justAddedToListId // Need this to ensure ref isn't reset too early
  ]);


  const handleSelectList = useCallback(
    (listId) => {
      // Only update if not currently adding
      if (isAddingToListRef.current) return;
      setSelectedListId((prevId) => (prevId === listId ? null : listId));
      setLocalError('');
      setJustAddedToListId(null);
    },
    [] // No dependencies needed if it only uses set methods
  );

  const handleSwitchToCreateMode = useCallback(() => {
     if (isAddingToListRef.current) return;
    setIsCreatingNew(true);
    setSelectedListId(null);
    setLocalError('');
  }, []); // No dependencies

  const handleSwitchToSelectMode = useCallback(() => {
     if (isAddingToListRef.current) return;
    setIsCreatingNew(false);
    setLocalError('');
    setNewListName('');
    setNewListDescription('');
    setNewListIsPublic(true);
    setHashtagInput('');
    setSelectedHashtags([]);
    setShowTagSuggestionsUI(false);
  }, []); // No dependencies

  // --- Hashtag Handlers ---
  const debouncedSetHashtagInput = useMemo(() => debounce((value) => setHashtagInput(value), 300), []);

  const handleHashtagInputChange = useCallback(
    (e) => {
      debouncedSetHashtagInput(e.target.value);
      setShowTagSuggestionsUI(true); // Show suggestions when typing
       setLocalError(''); // Clear error on input change
    },
    [debouncedSetHashtagInput]
  );

  const handleAddTag = useCallback(() => {
      const newTag = hashtagInput.trim().toLowerCase();
      if (!newTag) { // Don't add empty tags
          setHashtagInput('');
          return;
      }
      if (selectedHashtags.includes(newTag)) {
          setLocalError(`Tag "${newTag}" already added.`);
          setHashtagInput(''); // Clear input
          return;
      }
      // Check if it's a valid cuisine name before adding
      const isValidCuisine = cuisines.some(c => c.name.toLowerCase() === newTag);
      if (isValidCuisine) {
          setSelectedHashtags(prev => [...prev, newTag]);
          setHashtagInput(''); // Clear input
          setShowTagSuggestionsUI(false); // Hide suggestions
          setLocalError(''); // Clear potential previous errors
      } else {
          setLocalError(`"${hashtagInput.trim()}" is not a recognized tag.`);
          // Optionally clear input or leave it for correction
          // setHashtagInput('');
      }
  }, [hashtagInput, selectedHashtags, cuisines]);

  const handleTagInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleSelectTagSuggestion = useCallback(
    (tag) => {
      if (tag && !selectedHashtags.includes(tag)) {
        setSelectedHashtags((prev) => [...prev, tag]);
      }
      setHashtagInput(''); // Clear input after selection
      setShowTagSuggestionsUI(false); // Hide suggestions
    },
    [selectedHashtags] // Only depends on selectedHashtags
  );

  const handleRemoveTag = useCallback(
    (tagToRemove) => {
      setSelectedHashtags((prev) => prev.filter((h) => h !== tagToRemove));
    },
    [] // No dependencies
  );

  // Filter suggestions based on input
   const filteredHashtags = useMemo(() => {
    const inputLower = hashtagInput.toLowerCase().trim();
    if (!inputLower || !Array.isArray(cuisines)) return []; // Handle empty input or cuisines not loaded
    return cuisines
      .map((c) => c.name)
      .filter((name) => name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(name))
      .slice(0, 5);
   }, [cuisines, hashtagInput, selectedHashtags]); // Correct dependencies


  const isConfirmDisabled = useMemo(() => {
    // Check ref value directly
    if (isAddingToListRef.current) return true;
    if (isCreatingNew) {
        return !newListName.trim();
    } else {
        return !selectedListId;
    }
  }, [isCreatingNew, selectedListId, newListName]); // Dependencies


  const displayError = localError || fetchError;
  const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
      <div className="p-4">
        {!isAuthenticated ? (
           <p className="text-gray-600 text-sm text-center py-4">
            Please{' '}
            <Link
              to="/login"
              onClick={closeQuickAdd}
              className="text-[#A78B71] hover:text-[#D1B399] underline font-medium"
            >
              log in
            </Link>{' '}
            {isCreatingNew ? 'to create lists.' : 'to add items to your lists.'}
          </p>
        ) : isCreatingNew ? (
          <div className="space-y-4 text-sm">
             {!(item?.createNew && item?.type === 'list') && userLists?.length > 0 && (
                <Button
                    onClick={handleSwitchToSelectMode}
                    variant="tertiary"
                    size="sm"
                    className="mb-2 text-xs text-gray-600 hover:text-gray-800"
                    disabled={isAddingToListRef.current}
                >
                    ← Select Existing List
                </Button>
             )}
            <div>
              <label htmlFor="new-list-name" className="block text-gray-700 font-medium mb-1">List Name*</label>
              <input
                id="new-list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                placeholder="e.g., NYC Cheap Eats"
                disabled={isAddingToListRef.current}
                required
              />
            </div>
            <div>
              <label htmlFor="new-list-desc" className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
              <textarea
                id="new-list-desc"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                placeholder="A short description of your list"
                rows="2"
                disabled={isAddingToListRef.current}
              />
            </div>
            <div ref={tagInputRef} className="relative"> {/* Attach ref here */}
              <label htmlFor="new-list-tags" className="block text-gray-700 font-medium mb-1">Hashtags (Optional)</label>
              <input
                 id="new-list-tags"
                 type="text"
                 value={hashtagInput}
                 onChange={handleHashtagInputChange}
                 onKeyDown={handleTagInputKeyDown}
                 onFocus={() => setShowTagSuggestionsUI(true)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                 placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add relevant tags"}
                 disabled={isAddingToListRef.current || isLoadingCuisines}
                 autoComplete="off"
              />
              {showTagSuggestionsUI && !isLoadingCuisines && filteredHashtags.length > 0 && hashtagInput && (
                 <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg">
                     {filteredHashtags.map((name) => (
                          <li
                              key={name}
                              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onMouseDown={(e) => { e.preventDefault(); handleSelectTagSuggestion(name); }}
                          >
                              #{name}
                          </li>
                      ))}
                 </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                  {selectedHashtags.map((h) => (
                     <span key={h} className="inline-flex items-center px-2 py-0.5 bg-[#A78B71] text-white rounded-full text-xs">
                         #{h}
                         <button
                             type="button"
                             onClick={() => handleRemoveTag(h)}
                             disabled={isAddingToListRef.current}
                             className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none disabled:opacity-50"
                             aria-label={`Remove tag ${h}`}
                         >
                             <X size={12} />
                         </button>
                     </span>
                  ))}
              </div>
            </div>
             <div className="flex items-center justify-start pt-1">
                <label className={`flex items-center mr-3 ${isAddingToListRef.current ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <div className="relative">
                         <input
                             type="checkbox"
                             checked={newListIsPublic}
                             onChange={(e) => setNewListIsPublic(e.target.checked)}
                             className="sr-only peer"
                             disabled={isAddingToListRef.current}
                         />
                         <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                         <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-700 select-none">
                         {newListIsPublic ? 'Public' : 'Private'}
                    </span>
                </label>
                <span className="text-xs text-gray-500 flex items-center">
                    <Info size={13} className="mr-1 flex-shrink-0"/>
                    Public lists may appear in trending sections.
                </span>
            </div>
          </div>
        ) : (
          <>
            {fetchError ? (
              <p className="text-center py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {fetchError}
              </p>
            ) : !userLists || userLists.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">
                You haven’t created any lists yet.{' '}
                <button
                  onClick={handleSwitchToCreateMode}
                  className="text-[#A78B71] hover:underline ml-1 focus:outline-none font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={isAddingToListRef.current}
                >
                  Create one?
                </button>
              </p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                <p className="text-xs text-gray-500 mb-2 pl-1">Select a list:</p>
                {userLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleSelectList(list.id)}
                    disabled={isAddingToListRef.current || justAddedToListId === list.id}
                    aria-pressed={selectedListId === list.id}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors border ${
                        selectedListId === list.id ? 'bg-[#D1B399]/20 border-[#D1B399]/50' : 'border-transparent hover:bg-gray-100'
                    } ${justAddedToListId === list.id ? 'bg-green-50 border-green-200 cursor-default' : ''} disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <span className="font-medium text-gray-800 truncate">
                      {list.name} ({list.type || 'mixed'})
                    </span>
                    {justAddedToListId === list.id && (
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />
                    )}
                    {selectedListId === list.id && justAddedToListId !== list.id && (
                      <span className="text-xs text-[#A78B71] font-semibold">Selected</span>
                    )}
                  </button>
                ))}
                <button
                    onClick={handleSwitchToCreateMode}
                    disabled={isAddingToListRef.current}
                    className="w-full text-left px-3 py-2 mt-2 text-sm text-[#A78B71] hover:text-[#D1B399] hover:bg-gray-100 rounded-md font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    + Create a new list
                 </button>
              </div>
            )}
          </>
        )}

        {displayError && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"
          >
            {displayError}
          </p>
        )}

        <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
          <Button
            onClick={closeQuickAdd}
            variant="tertiary"
            size="sm"
            disabled={isAddingToListRef.current}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
          {isAuthenticated && (userLists?.length > 0 || isCreatingNew) && (
            <Button
              onClick={handleConfirmAction}
              size="sm"
              variant="primary"
              disabled={isConfirmDisabled}
              className="flex items-center min-w-[100px] justify-center"
            >
              {isAddingToListRef.current && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
              {isCreatingNew ? 'Create List' : 'Add to List'}
            </Button>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(QuickAddPopup);