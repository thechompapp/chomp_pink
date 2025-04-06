/* src/components/QuickAddPopup.jsx */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuickAdd } from '@/context/QuickAddContext';
import useUserListStore from '@/stores/useUserListStore.js';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';
import { listService } from '@/services/listService';
import { filterService } from '@/services/filterService'; // Import filterService

// Define query functions outside the component
const fetchUserLists = async () => {
  try {
    const lists = await listService.getLists({ createdByUser: true });
    // console.log("[QuickAddPopup fetchUserLists] Fetched lists for dropdown:", lists); // Keep if needed for further debug
    return lists;
  } catch (error) {
    console.error('[QuickAddPopup] Error fetching user lists:', error);
    return [];
  }
};

const fetchCuisinesData = async () => {
  try {
    const cuisines = await filterService.getCuisines();
    return cuisines.map(c => c.name);
  } catch (error) {
    console.error('[QuickAddPopup] Error fetching cuisines:', error);
    return [];
  }
};

const QuickAddPopup = () => {
    // --- Context & Store Hooks ---
    const { isOpen, closeQuickAdd, item } = useQuickAdd();
    const addToList = useUserListStore(state => state.addToList);
    const isAddingToList = useUserListStore(state => state.isAddingToList);
    const listStoreError = useUserListStore(state => state.error);
    const clearListStoreError = useUserListStore(state => state.clearError);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Use React Query to fetch user lists
    const {
      data: userLists = [],
      isLoading: isLoadingUserLists,
      refetch: refetchUserLists
    } = useQuery({
      queryKey: ['quickAddUserLists'],
      queryFn: fetchUserLists,
      enabled: isOpen && isAuthenticated,
      staleTime: 1 * 60 * 1000,
    });

    // Get cuisines using React Query
    const {
      data: cuisineNames = [],
      isLoading: isLoadingCuisines,
      refetch: refetchCuisines
    } = useQuery({
      queryKey: ['cuisinesForQuickAdd'],
      queryFn: fetchCuisinesData,
      enabled: false,
      staleTime: 60 * 60 * 1000
    });

    // --- Local State ---
    const [selectedListId, setSelectedListId] = useState(null);
    const [localError, setLocalError] = useState('');
    const [justAddedToListId, setJustAddedToListId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [newListIsPublic, setNewListIsPublic] = useState(true);
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const fetchCuisinesAttempted = useRef(false);

    // --- Effects ---
    useEffect(() => {
        if (isOpen && isCreatingNew && cuisineNames.length === 0 && !isLoadingCuisines && !fetchCuisinesAttempted.current) {
            fetchCuisinesAttempted.current = true;
            refetchCuisines().catch(err => {
                console.error("[QuickAddPopup] Error refetching cuisines:", err);
                setLocalError('Failed to load hashtag suggestions.');
            });
        }
        if (!isOpen) {
            fetchCuisinesAttempted.current = false;
        }
    }, [isOpen, isCreatingNew, cuisineNames.length, isLoadingCuisines, refetchCuisines]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedListId(null);
            setLocalError('');
            setJustAddedToListId(null);
            setNewListName('');
            setNewListDescription('');
            setNewListIsPublic(true);
            setHashtagInput('');
            setSelectedHashtags([]);
            setIsCreatingNew(false);
            clearListStoreError?.();
        }
    }, [isOpen, clearListStoreError]);

     useEffect(() => {
         if (isOpen && item) {
             setLocalError('');
             clearListStoreError?.();
             const shouldCreateNew = Boolean(item?.createNew && item?.type === 'list');
             setIsCreatingNew(shouldCreateNew);
             if (!shouldCreateNew && isAuthenticated) {
                 refetchUserLists();
             }
         }
     }, [isOpen, item, clearListStoreError, isAuthenticated, refetchUserLists]);


    // --- Callbacks ---
    const handleConfirmAction = useCallback(async () => {
        setLocalError('');
        clearListStoreError?.();
        if (!isAuthenticated) { setLocalError('You must be logged in.'); return; }
        let result;
        try {
            if (isCreatingNew) {
                if (!newListName.trim()) { setLocalError('List name required.'); return; }
                result = await addToList({
                    item: (item && !item.createNew) ? item : null,
                    createNew: true,
                    listData: { name: newListName.trim(), description: newListDescription.trim(), is_public: newListIsPublic, tags: selectedHashtags }
                });
                 setJustAddedToListId(result?.listId);
                 setTimeout(closeQuickAdd, 1200);
            } else {
                if (!selectedListId) { setLocalError('Please select a list.'); return; }
                if (!item || !item.id || !item.type) { setLocalError('Cannot add item: Invalid item data.'); return; }
                result = await addToList({ listId: selectedListId, item });
                setJustAddedToListId(selectedListId);
                setTimeout(closeQuickAdd, 1000);
            }
        } catch (error) {
            console.error('[QuickAddPopup] Error in confirm action:', error);
            setLocalError(error.message || 'An error occurred.');
        }
    }, [item, selectedListId, isCreatingNew, newListName, newListDescription, newListIsPublic, selectedHashtags, isAuthenticated, addToList, closeQuickAdd, clearListStoreError]);

    const handleSelectList = useCallback((listId) => {
        setSelectedListId(prevId => (prevId === listId ? null : listId));
        setLocalError('');
        setJustAddedToListId(null);
    }, []);

    const handleSwitchToCreateMode = useCallback(() => { setIsCreatingNew(true); setSelectedListId(null); setLocalError(''); }, []);
    const handleSwitchToSelectMode = useCallback(() => { setIsCreatingNew(false); setLocalError(''); setNewListName(''); setNewListDescription(''); setNewListIsPublic(true); setHashtagInput(''); setSelectedHashtags([]); }, []);

    const handleHashtagSelect = useCallback((hashtagName) => {
        if (hashtagName && !selectedHashtags.includes(hashtagName)) {
            setSelectedHashtags(prev => [...prev, hashtagName]);
        }
        setHashtagInput('');
    }, [selectedHashtags]);

     const handleHashtagKeyDown = useCallback((e) => {
         if (e.key === 'Enter' || e.key === ',') {
             e.preventDefault();
             const newTag = hashtagInput.trim();
             if (newTag && !selectedHashtags.includes(newTag)) {
                 setSelectedHashtags(prev => [...prev, newTag]);
             }
             setHashtagInput('');
         }
     }, [hashtagInput, selectedHashtags]);

    const handleHashtagRemove = useCallback((hashtagToRemove) => {
        setSelectedHashtags(prev => prev.filter(h => h !== hashtagToRemove));
    }, []);

    // --- Derived State ---
    const filteredHashtags = useMemo(() => {
        if (!hashtagInput.trim() || cuisineNames.length === 0) return [];
        const inputLower = hashtagInput.toLowerCase();
        return cuisineNames
            .filter(name => name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(name))
            .slice(0, 5);
    }, [cuisineNames, hashtagInput, selectedHashtags]);

    const isConfirmDisabled = isAddingToList || (!isCreatingNew && !selectedListId) || (isCreatingNew && !newListName.trim());
    const displayError = localError || listStoreError;
    const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;

    // --- Render ---
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
            <div className="p-1">
                {!isAuthenticated ? (
                    <p className="text-gray-600 text-sm text-center py-4"> Please{' '} <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline font-medium"> log in </Link>{' '} {isCreatingNew ? 'to create lists.' : 'to add items to your lists.'} </p>
                ) : isCreatingNew ? (
                    // --- Create New List Form ---
                    <div className="space-y-3 text-sm">
                        {!(item?.createNew && item?.type === 'list') && ( <Button onClick={handleSwitchToSelectMode} variant="tertiary" size="sm" className="mb-2 text-xs"> ← Select Existing List </Button> )}
                        <div>
                            <label htmlFor="new-list-name" className="block text-gray-700 font-medium mb-1">List Name*</label>
                            <input id="new-list-name" type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder="e.g., NYC Cheap Eats" disabled={isAddingToList} />
                        </div>
                        <div>
                            <label htmlFor="new-list-desc" className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                            <textarea id="new-list-desc" value={newListDescription} onChange={(e) => setNewListDescription(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder="A short description of your list" rows="2" disabled={isAddingToList} />
                        </div>
                        <div className="relative">
                             <label htmlFor="new-list-tags" className="block text-gray-700 font-medium mb-1">Hashtags (Optional)</label>
                             <input id="new-list-tags" type="text" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={handleHashtagKeyDown} className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder={isLoadingCuisines ? "Loading suggestions..." : "Type or paste tags (Enter or comma)"} disabled={isAddingToList || isLoadingCuisines} autoComplete="off" />
                             {filteredHashtags.length > 0 && hashtagInput && (
                                <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg">
                                    {filteredHashtags.map((name) => ( <li key={name} onMouseDown={(e)=>{e.preventDefault(); handleHashtagSelect(name);}} className="p-2 hover:bg-gray-100 cursor-pointer text-sm"> #{name} </li> ))}
                                </ul>
                             )}
                             <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                                {selectedHashtags.map((h) => ( <span key={h} className="inline-flex items-center px-2 py-0.5 bg-[#A78B71] text-white rounded-full text-xs"> #{h} <button type="button" onClick={() => handleHashtagRemove(h)} className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none"> <X size={12} /> </button> </span> ))}
                             </div>
                         </div>
                         <div className="flex items-center justify-start pt-1">
                             <label className={`flex items-center mr-3 ${isAddingToList ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                 <div className="relative"> <input type="checkbox" checked={newListIsPublic} onChange={(e) => setNewListIsPublic(e.target.checked)} className="sr-only peer" disabled={isAddingToList} /> <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div> <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div> </div>
                                 <span className="ml-2 text-sm text-gray-700 select-none"> {newListIsPublic ? 'Public' : 'Private'} </span>
                             </label>
                             <span className="text-xs text-gray-500 flex items-center"> <Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear in trending sections. </span>
                         </div>
                    </div>
                    // --- End Create New List Form ---
                ) : (
                    // --- Select List View ---
                    <>
                        {isLoadingUserLists ? (
                            <div className="flex justify-center items-center py-6"> <Loader2 className="h-6 w-6 animate-spin text-gray-500" /> <span className="ml-2 text-sm text-gray-500">Loading lists...</span> </div>
                        ) : !listStoreError && userLists.length === 0 ? (
                            <p className="text-center py-4 text-sm text-gray-500"> You haven't created any lists yet.{' '} <button onClick={handleSwitchToCreateMode} className='text-[#A78B71] hover:underline ml-1 focus:outline-none font-medium'> Create one? </button> </p>
                        ) : (
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                <p className="text-xs text-gray-500 mb-2 pl-1"> Select a list: </p>
                                {userLists.map((list) => (
                                    <button key={list.id} onClick={() => handleSelectList(list.id)} disabled={isAddingToList || justAddedToListId === list.id} className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${selectedListId === list.id ? 'bg-[#D1B399]/20 border border-[#D1B399]/50' : 'hover:bg-gray-100 border border-transparent'} ${isAddingToList || justAddedToListId === list.id ? 'cursor-not-allowed opacity-70' : ''}`} aria-pressed={selectedListId === list.id} >
                                        <span className="font-medium text-gray-800 truncate"> {list.name} </span>
                                        {justAddedToListId === list.id && ( <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" /> )}
                                        {selectedListId === list.id && justAddedToListId !== list.id && ( <span className="text-xs text-[#A78B71] font-semibold">Selected</span> )}
                                    </button>
                                ))}
                                <button onClick={handleSwitchToCreateMode} disabled={isAddingToList} className="w-full text-left px-3 py-2 mt-2 text-sm text-[#A78B71] hover:text-[#D1B399] hover:bg-gray-100 rounded-md font-medium"> + Create a new list </button>
                            </div>
                        )}
                    </>
                    // --- End Select List View ---
                )}

                {/* Error Display Area */}
                {displayError && ( <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {displayError} </p> )}

                {/* Action Buttons */}
                <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
                    <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToList}> Cancel </Button>
                    {isAuthenticated && ( <Button onClick={handleConfirmAction} size="sm" variant="primary" disabled={isConfirmDisabled}> {isAddingToList ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null} {isCreatingNew ? 'Create List' : 'Add to List'} </Button> )}
                </div>
            </div>
        </Modal>
    );
};

export default QuickAddPopup;