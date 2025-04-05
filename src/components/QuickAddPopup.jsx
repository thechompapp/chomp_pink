// src/components/QuickAddPopup.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuickAdd } from '@/context/QuickAddContext';
import useUserListStore from '@/stores/useUserListStore.js';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore'; // Import was correct here
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';
import apiClient from '@/utils/apiClient';

const QuickAddPopup = () => {
    // Context and Global State Hooks (remain the same)
    const { isOpen, closeQuickAdd, item } = useQuickAdd();
    const { userLists = [], fetchUserLists, addToList, isLoading: isLoadingUserLists, isAddingToList, error: listStoreError, clearError: clearListStoreError } = useUserListStore(state => ({ /* ... selectors ... */ }));
    const { isAuthenticated, user } = useAuthStore(state => ({ /* ... selectors ... */ }));
    const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
    const cuisines = useUIStateStore(state => state.cuisines || []);
    const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);

    // Local State (remains the same)
    const [selectedListId, setSelectedListId] = useState(null);
    const [localError, setLocalError] = useState('');
    const [justAddedToListId, setJustAddedToListId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [newListIsPublic, setNewListIsPublic] = useState(true);
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const fetchCuisinesAttempted = React.useRef(false);

    // --- Effects ---

    // Fetch user lists (no change needed)
    useEffect(() => {
        if (isOpen && isAuthenticated && userLists.length === 0 && !isLoadingUserLists) { /* ... */ }
    }, [isOpen, isAuthenticated, userLists.length, isLoadingUserLists, fetchUserLists]);

    // Fetch cuisines (no change needed)
    useEffect(() => {
        if (isOpen && isCreatingNew && cuisines.length === 0 && !isLoadingCuisines && !fetchCuisinesAttempted.current) { /* ... */ }
    }, [isOpen, isCreatingNew, cuisines.length, isLoadingCuisines, fetchCuisines]);

    // *** MODIFIED Effect: Reset State ***
    // Reduced dependencies - primarily trigger reset when modal opens/closes.
    // Read `item` *inside* the effect if needed for conditional logic, but don't depend on its reference.
    useEffect(() => {
        console.log(`[QuickAddPopup Reset Effect] Running. isOpen: ${isOpen}`);
        if (!isOpen) {
            // Reset everything when modal closes
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
            fetchCuisinesAttempted.current = false;
            console.log('[QuickAddPopup Reset Effect] State reset on close.');
        } else {
            // Reset errors and check mode when modal opens
            setLocalError('');
            clearListStoreError?.();
            // Use the latest `item` from context *within* the effect
            const currentItem = item; // Read item here
            if (currentItem?.createNew && currentItem?.type === 'list') {
                 console.log('[QuickAddPopup Reset Effect] Setting create mode based on item.');
                setIsCreatingNew(true);
            } else {
                 console.log('[QuickAddPopup Reset Effect] Setting select mode.');
                setIsCreatingNew(false); // Default to select mode
            }
            // Avoid resetting selectedListId or form fields here when opening,
            // let the user's previous interaction persist until close or mode switch.
        }
        // Depend primarily on isOpen. clearListStoreError is stable from Zustand.
        // `item` is read inside, removing it as a dependency might break immediate mode switching
        // Re-add `item` if mode switching on open feels broken, but be wary of loops.
    }, [isOpen, clearListStoreError, item]); // Keep item dependency for now, monitor logs


    // --- Callbacks (Memoized - No change needed from previous version) ---
    const handleConfirmAction = useCallback(async () => { /* ... */ }, [ item, selectedListId, isCreatingNew, newListName, newListDescription, newListIsPublic, selectedHashtags, isAuthenticated, addToList, closeQuickAdd, clearListStoreError ]);
    const handleSelectList = useCallback((listId) => { /* ... */ }, []);
    const handleSwitchToCreateMode = useCallback(() => { /* ... */ }, []);
    const handleSwitchToSelectMode = useCallback(() => { /* ... */ }, []);
    const handleHashtagSelect = useCallback((hashtagName) => { /* ... */ }, [selectedHashtags]);
    const handleHashtagRemove = useCallback((hashtagToRemove) => { /* ... */ }, []);

    // --- Derived State (Memoized - No change needed) ---
    const filteredHashtags = useMemo(() => { /* ... */ }, [cuisines, hashtagInput, selectedHashtags]);
    const isConfirmDisabled = isAddingToList || (!isCreatingNew && !selectedListId) || (isCreatingNew && !newListName.trim());
    const displayError = localError || listStoreError;
    const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;

    // --- Render Logic --- (No change needed from previous version)
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
            <div className="p-1">
                {!isAuthenticated ? (
                    <div className="text-center py-4">
                        <Info className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                        <p className="mb-4">Please log in to add items to your lists</p>
                        <Link 
                            to="/login" 
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Log In
                        </Link>
                    </div>
                ) : isCreatingNew ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="listName" className="block text-sm font-medium text-gray-700">
                                List Name
                            </label>
                            <input
                                type="text"
                                id="listName"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="listDescription" className="block text-sm font-medium text-gray-700">
                                Description (Optional)
                            </label>
                            <textarea
                                id="listDescription"
                                value={newListDescription}
                                onChange={(e) => setNewListDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={newListIsPublic}
                                onChange={(e) => setNewListIsPublic(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                                Make this list public
                            </label>
                        </div>
                        <button 
                            onClick={handleSwitchToSelectMode}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Select existing list instead
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto">
                            {userLists.map((list) => (
                                <div
                                    key={list.id}
                                    onClick={() => handleSelectList(list.id)}
                                    className={`p-3 rounded-lg cursor-pointer mb-2 ${
                                        selectedListId === list.id
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <h3 className="font-medium">{list.name}</h3>
                                    {list.description && (
                                        <p className="text-sm text-gray-500">{list.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={handleSwitchToCreateMode}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Create new list instead
                        </button>
                    </div>
                )}
            </div>
            {displayError && (
                <div className="mt-2 text-red-600 text-sm flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {displayError}
                </div>
            )}
            <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
                <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToList}>Cancel</Button>
                {isAuthenticated && ( <Button onClick={handleConfirmAction} size="sm" variant="primary" disabled={isConfirmDisabled} > {isAddingToList ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null} {isCreatingNew ? 'Create List' : 'Add to List'} </Button> )}
            </div>
        </Modal>
    );
};

export default QuickAddPopup;