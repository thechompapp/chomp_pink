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
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X, HelpCircle } from 'lucide-react';
import filterService from '@/services/filterService'; // Import filterService

const debounce = (func, wait) => { /* ... debounce implementation ... */ };

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
    const { formData, handleChange, handleSubmit, isSubmitting, submitError, setSubmitError, resetForm, setFormData } = useFormHandler({ name: '', description: '', is_public: true, list_type: '', });
    // --- End Form Handling ---

    // Reset state when modal closes or opens
    const resetState = useCallback(() => {
        setSelectedListId(null); setLocalError(''); setJustAddedToListId(null); setIsCreatingNew(false);
        resetForm({ name: '', description: '', is_public: true, list_type: '' });
        setHashtagInput(''); setSelectedHashtags([]); setShowTagSuggestionsUI(false); isAddingToListRef.current = false;
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
    useEffect(() => { /* ... click outside logic ... */ }, [showTagSuggestionsUI]);

    // --- Main Action Handler ---
    const handleConfirmAction = useCallback(async (currentFormData) => {
        // ... (validation and addToList call logic remains the same) ...
        // ... Ensure it uses currentFormData.list_type and selectedHashtags ...
        if (isAddingToListRef.current) return; isAddingToListRef.current = true; setLocalError(''); setSubmitError(null);
        if (!isAuthenticated) { setLocalError('Please log in first.'); isAddingToListRef.current = false; throw new Error('User not authenticated.'); }
        try {
            let listIdToConfirm = null;
            if (isCreatingNew) {
                if (!currentFormData.name?.trim()) { throw new Error('List name is required.'); }
                if (!currentFormData.list_type || !['restaurant', 'dish'].includes(currentFormData.list_type)) { throw new Error("Please select a valid list type (Restaurant or Dish)."); }
                if (item && item.type !== 'list' && item.type !== currentFormData.list_type) { throw new Error(`Cannot add a ${item.type} while creating a list of type ${currentFormData.list_type}.`); }
                const result = await addToList({
                    item: item && item.type !== 'list' && item.id ? { id: Number(item.id), type: item.type } : null, createNew: true,
                    listData: { name: currentFormData.name.trim(), description: currentFormData.description?.trim() || null, is_public: currentFormData.is_public, tags: selectedHashtags, list_type: currentFormData.list_type, },
                });
                if (!result?.success) { throw new Error(result?.message || 'Failed to create list.'); }
                listIdToConfirm = result.listId;
            } else {
                if (!selectedListId) { throw new Error('Please select a list.'); }
                if (!item || !item.id || !item.type || item.type === 'list') { throw new Error('Invalid item selected.'); }
                const selectedList = userLists.find(l => l.id === selectedListId);
                if (selectedList && selectedList.list_type !== item.type) { throw new Error(`Cannot add a ${item.type} to a list restricted to ${selectedList.list_type}s.`); }
                const result = await addToList({ item: { id: Number(item.id), type: item.type }, listId: selectedListId });
                if (!result?.success) { if (result?.message?.includes('already exists')) { throw new Error('This item is already in the selected list.'); } else if (result?.message?.includes('Cannot add')) { throw new Error(result.message); } else { throw new Error(result?.message || 'Failed to add item.'); } }
                 listIdToConfirm = result.listId;
            }
            if (listIdToConfirm) { setJustAddedToListId(listIdToConfirm); setTimeout(() => { if (useQuickAdd.getState().isOpen) closeQuickAdd(); setTimeout(() => { isAddingToListRef.current = false; }, 50); }, 1500); }
            else { closeQuickAdd(); isAddingToListRef.current = false; }
             return { success: true };
        } catch (err) { setSubmitError(err.message || 'Operation failed.'); isAddingToListRef.current = false; }

    }, [ item, selectedListId, isCreatingNew, selectedHashtags, isAuthenticated, addToList, closeQuickAdd, userLists, setSubmitError ]);

    // Other handlers (switch modes, tag input) remain the same, using local state
    const handleSwitchToCreateMode = useCallback(() => { if (isAddingToListRef.current) return; setIsCreatingNew(true); setSelectedListId(null); setLocalError(''); setSubmitError(null); const defaultType = (item && item.type !== 'list') ? item.type : ''; setFormData(prev => ({ ...prev, list_type: defaultType })); }, [item, setFormData, setSubmitError]);
    const handleSwitchToSelectMode = useCallback(() => { if (isAddingToListRef.current) return; setIsCreatingNew(false); resetForm({ name: '', description: '', is_public: true, list_type: '' }); setLocalError(''); setShowTagSuggestionsUI(false); setSelectedHashtags([]); setHashtagInput(''); setSubmitError(null); }, [resetForm, setSubmitError]);
    // Hashtag Logic using 'cuisines' from useQuery (remains the same)
    const debouncedSetHashtagInput = useMemo(/*...*/); const handleHashtagInputChange = useCallback(/*...*/); const handleAddTag = useCallback(/*...*/); const handleTagInputKeyDown = useCallback(/*...*/); const handleRemoveTag = useCallback(/*...*/); const handleSelectTagSuggestion = useCallback(/*...*/);
    const filteredHashtags = useMemo(() => { /* ... uses 'cuisines' from useQuery ... */ }, [cuisines, hashtagInput, selectedHashtags]);


    // Confirm button disabled logic (remains same)
    const isConfirmDisabled = useMemo(() => { /* ... */ }, [isCreatingNew, selectedListId, formData.name, formData.list_type, isSubmitting, item, userLists]);

    const displayError = submitError || localError || fetchError || cuisinesError?.message; // Include query error
    const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;
    const handleFormSubmit = (e) => { e.preventDefault(); handleSubmit(handleConfirmAction); };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
            <form onSubmit={isCreatingNew ? handleFormSubmit : (e) => e.preventDefault()}>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                     {/* ... UI remains largely the same ... */}
                     {/* ... Uses local state (selectedListId) for selection highlighting ... */}
                     {/* ... Uses formData for create form inputs ... */}
                     {/* ... Uses 'cuisines', 'isLoadingCuisines' from useQuery for tag input ... */}
                     {/* ... Error display uses combined 'displayError' ... */}
                     {/* ... Buttons use local isSubmitting / isAddingToListRef ... */}

                     {/* Example: Hashtag Input section using useQuery state */}
                     {isCreatingNew && (
                         <div ref={tagInputRef} className="relative">
                            <label /* ... */ >Hashtags (Optional)</label>
                             <input /* ... */ placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add..."} disabled={isSubmitting || isLoadingCuisines} /* ... */ />
                             {/* ... suggestions list based on filteredHashtags ... */}
                              {/* ... selected hashtags display ... */}
                         </div>
                     )}

                     {/* ... rest of the form and buttons ... */}
                     <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
                        {/* ... Cancel Button ... */}
                        {isAuthenticated && (userLists?.length > 0 || isCreatingNew) && ( <Button type={isCreatingNew ? "submit" : "button"} onClick={isCreatingNew ? undefined : handleFormSubmit} /* ... disabled logic ... */ > {/* ... Button text ... */} </Button> )}
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default React.memo(QuickAddPopup);