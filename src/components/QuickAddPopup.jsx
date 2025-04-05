import React, { useState, useEffect, useCallback } from 'react';
import { useQuickAdd } from '@/context/QuickAddContext'; // Use the named export
import useUserListStore from '@/stores/useUserListStore.js';
import useAuthStore from '@/stores/useAuthStore';
import Modal from './UI/Modal';
import Button from './Button';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';
import apiClient from '@/utils/apiClient'; // Ensure this is imported for hashtag fetching

const QuickAddPopup = () => {
    const { isOpen, closeQuickAdd, item } = useQuickAdd(); // Correct hook usage
    const { userLists, fetchUserLists, addToList, isLoadingUser, isAddingToList, error: storeError } = useUserListStore();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const [selectedListId, setSelectedListId] = useState(null);
    const [localError, setLocalError] = useState('');
    const [justAddedToListId, setJustAddedToListId] = useState(null);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [newListIsPublic, setNewListIsPublic] = useState(true);
    const [hashtags, setHashtags] = useState([]);
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    useEffect(() => {
        if (isOpen && userLists.length === 0 && !isLoadingUser) {
            fetchUserLists();
        }
    }, [isOpen, userLists.length, isLoadingUser, fetchUserLists]);

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
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && isCreatingNew && hashtags.length === 0) {
            const fetchHashtags = async () => {
                try {
                    const data = await apiClient('/api/cuisines', 'Hashtag Fetch');
                    setHashtags(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error('[QuickAddPopup] Error fetching hashtags:', err);
                    setLocalError('Failed to load hashtags');
                }
            };
            fetchHashtags();
        }
    }, [isOpen, isCreatingNew]);

    const handleAddToList = useCallback(async () => {
        if (!item || (!selectedListId && !isCreatingNew)) return;
        setLocalError('');
        useUserListStore.getState().clearError?.();

        if (!isAuthenticated) {
            setLocalError("Please log in first.");
            return;
        }

        try {
            if (isCreatingNew) {
                if (!newListName.trim()) {
                    setLocalError("List name is required.");
                    return;
                }
                await addToList({
                    item,
                    createNew: true,
                    listData: {
                        name: newListName.trim(),
                        description: newListDescription.trim() || null,
                        is_public: newListIsPublic,
                        tags: selectedHashtags,
                    },
                });
            } else {
                if (!selectedListId) {
                    setLocalError("Please select a list.");
                    return;
                }
                await addToList({ item, listId: selectedListId });
                setJustAddedToListId(selectedListId);
                setTimeout(closeQuickAdd, 1500);
            }
            closeQuickAdd();
        } catch (err) {
            setLocalError(err.message || 'Failed to add item or create list');
        }
    }, [item, selectedListId, isCreatingNew, newListName, newListDescription, newListIsPublic, selectedHashtags, isAuthenticated, addToList, closeQuickAdd]);

    const handleSelectList = useCallback((listId) => {
        setSelectedListId(prevId => (prevId === listId ? null : listId));
        setLocalError('');
        setJustAddedToListId(null);
    }, []);

    const handleSwitchToCreateMode = useCallback(() => {
        setIsCreatingNew(true);
        setSelectedListId(null);
    }, []);

    const handleHashtagSelect = useCallback((hashtag) => {
        if (!selectedHashtags.includes(hashtag)) {
            setSelectedHashtags(prev => [...prev, hashtag]);
            setHashtagInput('');
        }
    }, [selectedHashtags]);

    const handleHashtagRemove = useCallback((hashtag) => {
        setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
    }, []);

    const filteredHashtags = React.useMemo(() => {
        if (!hashtagInput) return hashtags.slice(0, 5);
        return hashtags.filter(h => h.name.toLowerCase().includes(hashtagInput.toLowerCase())).slice(0, 5);
    }, [hashtags, hashtagInput]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={closeQuickAdd} title={isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`}>
            <div className="p-1">
                {!isAuthenticated ? (
                    <p className="text-gray-600 text-sm text-center py-4">
                        Please{' '}
                        <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline">
                            log in
                        </Link>{' '}
                        {isCreatingNew ? 'to create lists.' : 'to add items to your lists.'}
                    </p>
                ) : (
                    <>
                        {isCreatingNew ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">List Name*</label>
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                                        placeholder="e.g., NYC Cheap Eats"
                                        disabled={isAddingToList}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                                    <textarea
                                        value={newListDescription}
                                        onChange={(e) => setNewListDescription(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                                        placeholder="A short description of your list"
                                        rows="2"
                                        disabled={isAddingToList}
                                    />
                                </div>
                                <div className="flex items-center justify-start pt-1">
                                    <label className={`flex items-center mr-3 ${isAddingToList ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={newListIsPublic}
                                                onChange={(e) => setNewListIsPublic(e.target.checked)}
                                                className="sr-only peer"
                                                disabled={isAddingToList}
                                            />
                                            <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                                        </div>
                                        <span className="ml-2 text-sm text-gray-700 select-none">{newListIsPublic ? 'Public' : 'Private'}</span>
                                    </label>
                                    <span className="text-xs text-gray-500 flex items-center">
                                        <Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear in trending sections.
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Hashtags (Optional)</label>
                                    <input
                                        type="text"
                                        value={hashtagInput}
                                        onChange={(e) => setHashtagInput(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                                        placeholder="Type to add hashtags"
                                        disabled={isAddingToList}
                                    />
                                    {filteredHashtags.length > 0 && hashtagInput && (
                                        <ul className="mt-1 border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                                            {filteredHashtags.map((h) => (
                                                <li
                                                    key={h.id}
                                                    onClick={() => handleHashtagSelect(h.name)}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                >
                                                    #{h.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedHashtags.map((h) => (
                                            <span
                                                key={h}
                                                className="bg-[#A78B71] text-white px-2 py-1 rounded-full text-sm flex items-center"
                                            >
                                                #{h}
                                                <X
                                                    size={14}
                                                    className="ml-1 cursor-pointer"
                                                    onClick={() => handleHashtagRemove(h)}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {isLoadingUser ? (
                                    <div className="flex justify-center items-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                        <span className="ml-2 text-sm text-gray-500">Loading lists...</span>
                                    </div>
                                ) : storeError ? (
                                    <p className="text-center py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{storeError}</p>
                                ) : userLists.length === 0 ? (
                                    <p className="text-center py-4 text-sm text-gray-500">
                                        You haven't created any lists yet.{' '}
                                        <button onClick={handleSwitchToCreateMode} className='text-[#A78B71] hover:underline ml-1 focus:outline-none'>
                                            Create one?
                                        </button>
                                    </p>
                                ) : (
                                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                                        <p className="text-xs text-gray-500 mb-2">Select a list:</p>
                                        {userLists.map((list) => (
                                            <button
                                                key={list.id}
                                                onClick={() => handleSelectList(list.id)}
                                                disabled={isAddingToList || justAddedToListId === list.id}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${selectedListId === list.id ? 'bg-[#D1B399]/20 border border-[#D1B399]' : 'hover:bg-gray-100 border border-transparent'} ${isAddingToList || justAddedToListId === list.id ? 'cursor-not-allowed opacity-70' : ''}`}
                                            >
                                                <span className="font-medium text-gray-800 truncate">{list.name}</span>
                                                {justAddedToListId === list.id && <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" />}
                                            </button>
                                        ))}
                                        <button
                                            onClick={handleSwitchToCreateMode}
                                            className="w-full text-left px-3 py-2 text-sm text-[#A78B71] hover:text-[#D1B399] hover:bg-gray-100 rounded-md"
                                        >
                                            Create a new list
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        {(localError || storeError) && (
                            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
                                {localError || storeError}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
                            <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToList}>Cancel</Button>
                            {isAuthenticated && (
                                <Button
                                    onClick={handleAddToList}
                                    size="sm"
                                    variant="primary"
                                    disabled={isAddingToList || (isCreatingNew ? !newListName.trim() : !selectedListId)}
                                >
                                    {isAddingToList ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
                                    {isCreatingNew ? 'Create List' : 'Add to List'}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default QuickAddPopup;