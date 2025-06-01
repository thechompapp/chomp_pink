/* src/components/QuickAddPopup.jsx */
/* REFACTORED: Uses React Query to fetch cuisines/tags instead of Zustand */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { useQuickAdd } from '@/contexts/QuickAddContext';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
// import { useUIStateStore } from '@/stores/useUIStateStore'; // No longer needed for cuisines
// import { useShallow } from 'zustand/react/shallow'; // No longer needed
import useFormHandler from '@/hooks/useFormHandler';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import LoginPromptDialog from '@/components/UI/LoginPromptDialog'; // Import LoginPromptDialog
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X, HelpCircle } from 'lucide-react';
import filterService from '@/services/filterService'; // Import filterService

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const QuickAddPopup = () => {
    const { isOpen, closeQuickAdd, item, userLists, addToList, fetchError } = useQuickAdd();
    const { user } = useAuth(); // Migrated from useAuthStore
    const isAuthenticated = user?.id != null; // Check for user ID specifically
    const currentUserId = user?.id;

    // --- Local State ---
    const [selectedListId, setSelectedListId] = useState(null);
    const [localError, setLocalError] = useState('');
    const [justAddedToListId, setJustAddedToListId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [showTagSuggestionsUI, setShowTagSuggestionsUI] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false); // Add login prompt state
    const prevIsOpenRef = useRef(isOpen);
    const isAddingToListRef = useRef(false);
    const tagInputRef = useRef(null);
    // --- End Local State ---

    // --- Fetch Cuisines/Tags with React Query ---
    // Fetch only when the create new list form is open
    const { data: cuisines = [], isLoading: isLoadingCuisines, error: cuisinesError } = useQuery({
        queryKey: ['quickAddCuisines'],
        queryFn: filterService.getCuisines, // Fetch using service
        enabled: isOpen && isCreatingNew, // Only fetch when needed
        staleTime: Infinity, // Cache indefinitely
        placeholderData: [],
        select: (data) => Array.isArray(data) ? data.map(c => c?.name || c).filter(Boolean) : [], // Extract names
    });
    // --- End React Query ---

    // --- Form Handling ---
    const { formData, handleChange, handleSubmit, isSubmitting, submitError, setSubmitError, resetForm, setFormData } = useFormHandler({ 
        name: '', 
        description: '', 
        is_public: true, 
        list_type: '', 
    });
    // --- End Form Handling ---

    // Reset state when modal closes or opens
    const resetState = useCallback(() => {
        setSelectedListId(null); 
        setLocalError(''); 
        setJustAddedToListId(null); 
        setIsCreatingNew(false);
        setShowLoginPrompt(false); // Reset login prompt
        resetForm({ name: '', description: '', is_public: true, list_type: '' });
        setHashtagInput(''); 
        setSelectedHashtags([]); 
        setShowTagSuggestionsUI(false); 
        isAddingToListRef.current = false;
    }, [resetForm]);

    useEffect(() => {
        if (!isOpen && prevIsOpenRef.current) { resetState(); }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, resetState]);

    // Initialize state when opening
    useEffect(() => {
        if (isOpen) {
            const shouldBeCreating = item?.createNew === true || (isAuthenticated && (!userLists || userLists.length === 0));
            setIsCreatingNew(shouldBeCreating);
            setLocalError('');
            const defaultType = (item && item.type !== 'list') ? item.type : '';
            if (shouldBeCreating) {
                 setFormData(prev => ({ ...prev, list_type: defaultType, name: '', description: '', is_public: true }));
            } else {
                 resetForm({ name: '', description: '', is_public: true, list_type: '' });
            }
        }
    }, [isOpen, item, isAuthenticated, userLists, setFormData, resetForm]);

    // Click outside handler for suggestions (remains same)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tagInputRef.current && !tagInputRef.current.contains(event.target)) {
                setShowTagSuggestionsUI(false);
            }
        };
        
        if (showTagSuggestionsUI) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTagSuggestionsUI]);

    // --- Main Action Handler ---
    const handleConfirmAction = useCallback(async (currentFormData) => {
        if (isAddingToListRef.current) return { success: false, message: 'Already processing...' };
        
        isAddingToListRef.current = true; 
        setLocalError(''); 
        setSubmitError(null);
        
        // FIXED: Graceful authentication handling instead of throwing error
        if (!isAuthenticated) { 
            setShowLoginPrompt(true);
            isAddingToListRef.current = false; 
            return { success: false, requiresAuth: true, message: 'Authentication required' };
        }
        
        try {
            let listIdToConfirm = null;
            if (isCreatingNew) {
                if (!currentFormData.name?.trim()) { 
                    throw new Error('List name is required.'); 
                }
                if (!currentFormData.list_type || !['restaurant', 'dish'].includes(currentFormData.list_type)) { 
                    throw new Error("Please select a valid list type (Restaurant or Dish)."); 
                }
                if (item && item.type !== 'list' && item.type !== currentFormData.list_type) { 
                    throw new Error(`Cannot add a ${item.type} while creating a list of type ${currentFormData.list_type}.`); 
                }
                const result = await addToList({
                    item: item && item.type !== 'list' && item.id ? { id: Number(item.id), type: item.type } : null, 
                    createNew: true,
                    listData: { 
                        name: currentFormData.name.trim(), 
                        description: currentFormData.description?.trim() || null, 
                        is_public: currentFormData.is_public, 
                        tags: selectedHashtags, 
                        list_type: currentFormData.list_type, 
                    },
                });
                if (!result?.success) { 
                    throw new Error(result?.message || 'Failed to create list.'); 
                }
                listIdToConfirm = result.listId;
            } else {
                if (!selectedListId) { 
                    throw new Error('Please select a list.'); 
                }
                if (!item || !item.id || !item.type || item.type === 'list') { 
                    throw new Error('Invalid item selected.'); 
                }
                const selectedList = userLists.find(l => l.id === selectedListId);
                if (selectedList && selectedList.list_type !== item.type) { 
                    throw new Error(`Cannot add a ${item.type} to a list restricted to ${selectedList.list_type}s.`); 
                }
                const result = await addToList({ 
                    item: { id: Number(item.id), type: item.type }, 
                    listId: selectedListId 
                });
                if (!result?.success) { 
                    if (result?.message?.includes('already exists')) { 
                        throw new Error('This item is already in the selected list.'); 
                    } else if (result?.message?.includes('Cannot add')) { 
                        throw new Error(result.message); 
                    } else { 
                        throw new Error(result?.message || 'Failed to add item.'); 
                    } 
                }
                listIdToConfirm = result.listId;
            }
            
            if (listIdToConfirm) { 
                setJustAddedToListId(listIdToConfirm); 
                setTimeout(() => { 
                    if (useQuickAdd.getState().isOpen) closeQuickAdd(); 
                    setTimeout(() => { 
                        isAddingToListRef.current = false; 
                    }, 50); 
                }, 1500); 
            } else { 
                closeQuickAdd(); 
                isAddingToListRef.current = false; 
            }
            
            return { success: true };
        } catch (err) { 
            setSubmitError(err.message || 'Operation failed.'); 
            isAddingToListRef.current = false; 
            return { success: false, message: err.message || 'Operation failed.' };
        }
    }, [item, selectedListId, isCreatingNew, selectedHashtags, isAuthenticated, addToList, closeQuickAdd, userLists, setSubmitError]);

    // Other handlers remain the same
    const handleSwitchToCreateMode = useCallback(() => {
        if (isAddingToListRef.current) return;
        setIsCreatingNew(true);
        setSelectedListId(null);
        setLocalError('');
        setSubmitError(null);
        const defaultType = (item && item.type !== 'list') ? item.type : '';
        setFormData(prev => ({ ...prev, list_type: defaultType }));
    }, [item, setFormData, setSubmitError]);

    const handleSwitchToSelectMode = useCallback(() => {
        if (isAddingToListRef.current) return;
        setIsCreatingNew(false);
        resetForm({ name: '', description: '', is_public: true, list_type: '' });
        setLocalError('');
        setShowTagSuggestionsUI(false);
        setSelectedHashtags([]);
        setHashtagInput('');
        setSubmitError(null);
    }, [resetForm, setSubmitError]);

    // Hashtag handlers
    const debouncedSetHashtagInput = useMemo(() => debounce(setHashtagInput, 300), []);
    
    const handleHashtagInputChange = useCallback((e) => {
        const value = e.target.value;
        debouncedSetHashtagInput(value);
        setShowTagSuggestionsUI(value.length > 0);
    }, [debouncedSetHashtagInput]);

    const handleAddTag = useCallback((tag) => {
        if (tag && !selectedHashtags.includes(tag)) {
            setSelectedHashtags(prev => [...prev, tag]);
            setHashtagInput('');
            setShowTagSuggestionsUI(false);
        }
    }, [selectedHashtags]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setSelectedHashtags(prev => prev.filter(tag => tag !== tagToRemove));
    }, []);

    const handleSelectTagSuggestion = useCallback((tag) => {
        handleAddTag(tag);
    }, [handleAddTag]);

    const handleTagInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmedInput = hashtagInput.trim();
            if (trimmedInput) {
                handleAddTag(trimmedInput);
            }
        }
    }, [hashtagInput, handleAddTag]);

    const filteredHashtags = useMemo(() => {
        if (!hashtagInput.trim() || !Array.isArray(cuisines)) return [];
        const input = hashtagInput.toLowerCase();
        return cuisines
            .filter(tag => 
                tag.toLowerCase().includes(input) && 
                !selectedHashtags.includes(tag)
            )
            .slice(0, 8);
    }, [cuisines, hashtagInput, selectedHashtags]);

    // Confirm button disabled logic
    const isConfirmDisabled = useMemo(() => {
        if (isCreatingNew) {
            return !formData.name?.trim() || !formData.list_type || isSubmitting;
        } else {
            return !selectedListId || isSubmitting;
        }
    }, [isCreatingNew, selectedListId, formData.name, formData.list_type, isSubmitting]);

    const displayError = submitError || localError || fetchError || cuisinesError?.message;
    const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;
    
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        if (isCreatingNew) {
            handleSubmit(handleConfirmAction);
        } else {
            handleConfirmAction(formData);
        }
    }, [isCreatingNew, handleSubmit, handleConfirmAction, formData]);

    if (!isOpen) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
                <form onSubmit={handleFormSubmit}>
                    <div className="p-4 max-h-[70vh] overflow-y-auto">
                        {/* Authentication Check - Show login prompt for unauthenticated users */}
                        {!isAuthenticated ? (
                            <div className="text-center py-8">
                                <div className="mb-4">
                                    <Info className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                                    <p className="text-gray-600">
                                        Please log in to add items to your lists and create new lists.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => setShowLoginPrompt(true)}
                                    variant="primary"
                                    className="mr-3"
                                >
                                    Log In
                                </Button>
                                <Button 
                                    onClick={closeQuickAdd}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Existing authenticated user content */}
                                {displayError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-700">{displayError}</p>
                                    </div>
                                )}

                                {justAddedToListId && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                        <p className="text-sm text-green-700">Successfully added to list!</p>
                                    </div>
                                )}

                                {/* Mode Selection */}
                                {userLists && userLists.length > 0 && !item?.createNew && (
                                    <div className="mb-4 flex space-x-2 border-b border-gray-200 pb-3">
                                        <Button
                                            type="button"
                                            variant={!isCreatingNew ? "primary" : "outline"}
                                            size="sm"
                                            onClick={handleSwitchToSelectMode}
                                            disabled={isSubmitting}
                                        >
                                            Select Existing
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={isCreatingNew ? "primary" : "outline"}
                                            size="sm"
                                            onClick={handleSwitchToCreateMode}
                                            disabled={isSubmitting}
                                        >
                                            Create New
                                        </Button>
                                    </div>
                                )}

                                {/* Create New List Form */}
                                {isCreatingNew && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                List Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter list name"
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                List Type *
                                            </label>
                                            <select
                                                name="list_type"
                                                value={formData.list_type}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isSubmitting}
                                                required
                                            >
                                                <option value="">Select type</option>
                                                <option value="restaurant">Restaurant List</option>
                                                <option value="dish">Dish List</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description (Optional)
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Describe your list"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Hashtag Input */}
                                        <div ref={tagInputRef} className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hashtags (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={hashtagInput}
                                                onChange={handleHashtagInputChange}
                                                onKeyDown={handleTagInputKeyDown}
                                                onFocus={() => hashtagInput.length > 0 && setShowTagSuggestionsUI(true)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add hashtags..."}
                                                disabled={isSubmitting || isLoadingCuisines}
                                            />
                                            
                                            {/* Tag Suggestions */}
                                            {showTagSuggestionsUI && filteredHashtags.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                    {filteredHashtags.map((tag, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleSelectTagSuggestion(tag)}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                        >
                                                            #{tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Selected Tags */}
                                            {selectedHashtags.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {selectedHashtags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                                        >
                                                            #{tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTag(tag)}
                                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_public"
                                                id="is_public"
                                                checked={formData.is_public}
                                                onChange={handleChange}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                disabled={isSubmitting}
                                            />
                                            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                                                Make this list public
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Select Existing List */}
                                {!isCreatingNew && userLists && userLists.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select a list:
                                        </label>
                                        {userLists.map((list) => (
                                            <div
                                                key={list.id}
                                                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                                    selectedListId === list.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => setSelectedListId(list.id)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{list.name}</h4>
                                                        <p className="text-sm text-gray-500 capitalize">{list.list_type} list</p>
                                                        {list.description && (
                                                            <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="selectedList"
                                                        checked={selectedListId === list.id}
                                                        onChange={() => setSelectedListId(list.id)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No Lists Available */}
                                {!isCreatingNew && (!userLists || userLists.length === 0) && (
                                    <div className="text-center py-8">
                                        <div className="mb-4">
                                            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lists Yet</h3>
                                            <p className="text-gray-600 mb-4">
                                                You don't have any lists yet. Create your first list to get started!
                                            </p>
                                            <Button 
                                                onClick={handleSwitchToCreateMode}
                                                variant="primary"
                                            >
                                                Create First List
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeQuickAdd}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    {(userLists?.length > 0 || isCreatingNew) && (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isConfirmDisabled}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {isCreatingNew ? 'Creating...' : 'Adding...'}
                                                </>
                                            ) : (
                                                isCreatingNew ? 'Create List' : 'Add to List'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </Modal>
            
            {/* Login Prompt Dialog */}
            <LoginPromptDialog
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
                title="Login to Manage Lists"
                message="Create and manage your personal food lists by logging into your account."
                currentPath={window.location.pathname}
            />
        </>
    );
};

export default React.memo(QuickAddPopup);