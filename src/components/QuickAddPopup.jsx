/* src/components/QuickAddPopup.jsx */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuickAdd } from '@/context/QuickAddContext';
import useAuthStore from '@/stores/useAuthStore';
import useUIStateStore from '@/stores/useUIStateStore';
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
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const cuisines = useUIStateStore(state => state.cuisines || []);
    const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);

    const [selectedListId, setSelectedListId] = useState(null);
    const [localError, setLocalError] = useState('');
    const [justAddedToListId, setJustAddedToListId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [newListIsPublic, setNewListIsPublic] = useState(true);
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const prevIsOpenRef = useRef(isOpen);
    const isAddingToListRef = useRef(false);

    // Reset state with useCallback to ensure stable reference
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
    }, []);

    // Debounced hashtag input handler
    const debouncedSetHashtagInput = useMemo(() => debounce((value) => setHashtagInput(value), 300), []);

    const handleHashtagInputChange = useCallback((e) => {
        debouncedSetHashtagInput(e.target.value);
    }, [debouncedSetHashtagInput]);

    // Effect to handle modal open/close and mode switching
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const shouldBeCreating = item?.createNew && item?.type === 'list';
            setIsCreatingNew(shouldBeCreating);
            setLocalError('');
        } else if (!isOpen && prevIsOpenRef.current) {
            resetState();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, item, resetState]);

    // Confirm action handler
    const handleConfirmAction = useCallback(async () => {
        if (isAddingToListRef.current) return; // Prevent multiple submissions
        setLocalError('');
        if (!isAuthenticated) {
            setLocalError('Please log in first.');
            return;
        }
        isAddingToListRef.current = true;

        try {
            if (isCreatingNew) {
                if (!newListName.trim()) {
                    setLocalError('List name is required.');
                    return;
                }
                await addToList({
                    item: item && item.type !== 'list' && item.id ? { id: item.id, type: item.type } : null,
                    createNew: true,
                    listData: {
                        name: newListName.trim(),
                        description: newListDescription.trim() || null,
                        is_public: newListIsPublic,
                        tags: selectedHashtags,
                        type: item?.type || 'mixed',
                    },
                });
            } else {
                if (!selectedListId) {
                    setLocalError('Please select a list.');
                    return;
                }
                if (!item || !item.id || !item.type || item.type === 'list') {
                    setLocalError('Invalid item selected.');
                    return;
                }
                const result = await addToList({ item: { id: item.id, type: item.type }, listId: selectedListId });
                if (result?.listId) {
                    setJustAddedToListId(result.listId);
                    setTimeout(() => {
                        closeQuickAdd();
                    }, 1500);
                    return;
                }
            }
            closeQuickAdd();
        } catch (err) {
            console.error('[QuickAddPopup] Error during addToList:', err);
            const errorMessage = err.message.includes('Item already exists in list')
                ? 'This item is already in the selected list.'
                : err.message.includes('Cannot add')
                ? err.message
                : 'Failed to add to list.';
            setLocalError(errorMessage);
        } finally {
            isAddingToListRef.current = false;
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
    ]);

    const handleSelectList = useCallback((listId) => {
        setSelectedListId(prevId => prevId === listId ? null : listId);
        setLocalError('');
        setJustAddedToListId(null);
    }, []);

    const handleSwitchToCreateMode = useCallback(() => {
        setIsCreatingNew(true);
        setSelectedListId(null);
        setLocalError('');
    }, []);

    const handleSwitchToSelectMode = useCallback(() => {
        setIsCreatingNew(false);
        setLocalError('');
        setNewListName('');
        setNewListDescription('');
        setNewListIsPublic(true);
        setHashtagInput('');
        setSelectedHashtags([]);
    }, []);

    const handleHashtagSelect = useCallback((hashtagName) => {
        if (hashtagName && !selectedHashtags.includes(hashtagName)) {
            setSelectedHashtags(prev => [...prev, hashtagName]);
        }
        setHashtagInput('');
    }, [selectedHashtags]);

    const handleHashtagRemove = useCallback((hashtagToRemove) => {
        setSelectedHashtags(prev => prev.filter(h => h !== hashtagToRemove));
    }, []);

    const filteredHashtags = useMemo(() => {
        const inputLower = hashtagInput.toLowerCase().trim();
        if (!inputLower) return [];
        return cuisines
            .map(c => c.name)
            .filter(name => name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(name))
            .slice(0, 5);
    }, [cuisines, hashtagInput, selectedHashtags]);

    const isConfirmDisabled = useMemo(() => {
        return isAddingToListRef.current || (!isCreatingNew && !selectedListId) || (isCreatingNew && !newListName.trim());
    }, [isCreatingNew, selectedListId, newListName]);

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
                        {!(item?.createNew && item?.type === 'list') && (
                            <Button
                                onClick={handleSwitchToSelectMode}
                                variant="tertiary"
                                size="sm"
                                className="mb-2 text-xs"
                            >
                                ← Select Existing List
                            </Button>
                        )}
                        <div>
                            <label htmlFor="new-list-name" className="block text-gray-700 font-medium mb-1">
                                List Name*
                            </label>
                            <input
                                id="new-list-name"
                                type="text"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                                placeholder="e.g., NYC Cheap Eats"
                                disabled={isAddingToListRef.current}
                            />
                        </div>
                        <div>
                            <label htmlFor="new-list-desc" className="block text-gray-700 font-medium mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="new-list-desc"
                                value={newListDescription}
                                onChange={e => setNewListDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                                placeholder="A short description of your list"
                                rows="2"
                                disabled={isAddingToListRef.current}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="new-list-tags" className="block text-gray-700 font-medium mb-1">
                                Hashtags (Optional)
                            </label>
                            <input
                                id="new-list-tags"
                                type="text"
                                value={hashtagInput}
                                onChange={handleHashtagInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                                placeholder="Type to add hashtags"
                                disabled={isAddingToListRef.current || isLoadingCuisines}
                                autoComplete="off"
                            />
                            {isLoadingCuisines && hashtagInput && (
                                <div className="absolute z-10 mt-1 w-full bg-white p-2 text-gray-500 text-sm flex items-center justify-center">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Loading hashtags...
                                </div>
                            )}
                            {!isLoadingCuisines && filteredHashtags.length > 0 && hashtagInput && (
                                <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg">
                                    {filteredHashtags.map(name => (
                                        <li
                                            key={name}
                                            onClick={() => handleHashtagSelect(name)}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            #{name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                                {selectedHashtags.map(h => (
                                    <span
                                        key={h}
                                        className="inline-flex items-center px-2 py-0.5 bg-[#A78B71] text-white rounded-full text-xs"
                                    >
                                        #{h}
                                        <button
                                            type="button"
                                            onClick={() => handleHashtagRemove(h)}
                                            className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none"
                                            disabled={isAddingToListRef.current}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-start pt-1">
                            <label
                                className={`flex items-center mr-3 ${isAddingToListRef.current ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            >
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={newListIsPublic}
                                        onChange={e => setNewListIsPublic(e.target.checked)}
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
                                <Info size={13} className="mr-1 flex-shrink-0" />
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
                        ) : userLists.length === 0 ? (
                            <p className="text-center py-4 text-sm text-gray-500">
                                You haven’t created any lists yet.{' '}
                                <button
                                    onClick={handleSwitchToCreateMode}
                                    className="text-[#A78B71] hover:underline ml-1 focus:outline-none font-medium"
                                    disabled={isAddingToListRef.current}
                                >
                                    Create one?
                                </button>
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                <p className="text-xs text-gray-500 mb-2 pl-1">Select a list:</p>
                                {userLists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => handleSelectList(list.id)}
                                        disabled={isAddingToListRef.current || justAddedToListId === list.id}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${
                                            selectedListId === list.id
                                                ? 'bg-[#D1B399]/20 border border-[#D1B399]/50'
                                                : 'hover:bg-gray-100 border border-transparent'
                                        } ${isAddingToListRef.current || justAddedToListId === list.id ? 'cursor-not-allowed opacity-70' : ''}`}
                                        aria-pressed={selectedListId === list.id}
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
                                    className="w-full text-left px-3 py-2 mt-2 text-sm text-[#A78B71] hover:text-[#D1B399] hover:bg-gray-100 rounded-md font-medium"
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
                    >
                        Cancel
                    </Button>
                    {isAuthenticated && (
                        <Button
                            onClick={handleConfirmAction}
                            size="sm"
                            variant="primary"
                            disabled={isConfirmDisabled}
                        >
                            {isAddingToListRef.current ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
                            {isCreatingNew ? 'Create List' : 'Add to List'}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(QuickAddPopup);