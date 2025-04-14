/* src/components/QuickAddPopup.jsx */
/* Based on user-provided quickaddpopup.rtf with corrections */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuickAdd } from '@/context/QuickAddContext';
import useAuthStore from '@/stores/useAuthStore';
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow';
import useFormHandler from '@/hooks/useFormHandler';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Info, X, HelpCircle } from 'lucide-react';

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
    const { cuisines, isLoadingCuisines, fetchCuisines } = useUIStateStore(
        useShallow((state) => ({
            cuisines: state.cuisines || [],
            isLoadingCuisines: state.isLoadingCuisines,
            fetchCuisines: state.fetchCuisines,
        }))
    );

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

    const {
        formData,
        handleChange,
        handleSubmit,
        isSubmitting,
        submitError,
        setSubmitError,
        resetForm,
        setFormData,
    } = useFormHandler({
        name: '',
        description: '',
        is_public: true,
        list_type: '', // ** Start with no type selected **
    });

    const resetState = useCallback(() => {
        setSelectedListId(null);
        setLocalError('');
        setJustAddedToListId(null);
        setIsCreatingNew(false);
        resetForm({ name: '', description: '', is_public: true, list_type: '' }); // Reset type too
        setHashtagInput('');
        setSelectedHashtags([]);
        setShowTagSuggestionsUI(false);
        isAddingToListRef.current = false;
    }, [resetForm]);

    useEffect(() => {
        if (!isOpen && prevIsOpenRef.current) {
            resetState();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, resetState]);

    useEffect(() => {
        if (isOpen) {
            const shouldBeCreating = item?.createNew === true;
            setIsCreatingNew(shouldBeCreating);
            setLocalError('');
            if (shouldBeCreating) {
                 // ** Default type based on item if adding while creating **
                 const defaultType = (item && item.type !== 'list') ? item.type : ''; // Default to empty if no item
                setFormData(prev => ({ ...prev, list_type: defaultType, name: '', description: '', is_public: true }));
                if (cuisines.length === 0 && !isLoadingCuisines) {
                    fetchCuisines();
                }
            } else {
                 resetForm({ name: '', description: '', is_public: true, list_type: '' }); // Reset type
            }
        }
    }, [isOpen, item, fetchCuisines, cuisines.length, isLoadingCuisines, setFormData, resetForm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showTagSuggestionsUI && tagInputRef.current && !tagInputRef.current.contains(event.target)) {
                setShowTagSuggestionsUI(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTagSuggestionsUI]);


    const handleConfirmAction = useCallback(async (currentFormData) => {
        if (isAddingToListRef.current) return;
        isAddingToListRef.current = true;
        setLocalError('');
        setSubmitError(null);

        if (!isAuthenticated) {
            setLocalError('Please log in first.');
            isAddingToListRef.current = false;
            throw new Error('User not authenticated.');
        }

        try {
            let listIdToConfirm = null;

            if (isCreatingNew) {
                if (!currentFormData.name?.trim()) { throw new Error('List name is required.'); }
                // ** VALIDATION: Ensure list type is selected **
                if (!currentFormData.list_type || !['restaurant', 'dish'].includes(currentFormData.list_type)) {
                    throw new Error("Please select a valid list type (Restaurant or Dish).");
                }
                // ** VALIDATION: Ensure item type matches new list type if item exists **
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
                        list_type: currentFormData.list_type, // Pass selected type
                    },
                });
                if (!result?.success) { throw new Error(result?.message || 'Failed to create list.'); }
                listIdToConfirm = result.listId;

            } else { // Adding to existing list
                if (!selectedListId) { throw new Error('Please select a list.'); }
                if (!item || !item.id || !item.type || item.type === 'list') { throw new Error('Invalid item selected.'); }
                const selectedList = userLists.find(l => l.id === selectedListId);
                // ** VALIDATION: Ensure item type matches existing list type **
                if (selectedList && selectedList.type !== item.type) {
                    throw new Error(`Cannot add a ${item.type} to a list restricted to ${selectedList.type}s.`);
                }

                const result = await addToList({ item: { id: Number(item.id), type: item.type }, listId: selectedListId });
                if (!result?.success) {
                     if (result?.message?.includes('already exists')) { throw new Error('This item is already in the selected list.'); }
                     else if (result?.message?.includes('Cannot add')) { throw new Error(result.message); } // Catch compatibility error
                     else { throw new Error(result?.message || 'Failed to add item to list.'); }
                 }
                 listIdToConfirm = result.listId;
            }

            // Handle success feedback and closing
            if (listIdToConfirm) {
                setJustAddedToListId(listIdToConfirm);
                setTimeout(() => {
                     if (useQuickAdd.getState().isOpen) { closeQuickAdd(); }
                     setTimeout(() => { isAddingToListRef.current = false; }, 50);
                }, 1500);
            } else {
                closeQuickAdd();
                isAddingToListRef.current = false;
            }
             return { success: true };

        } catch (err) {
            console.error('[QuickAddPopup] Error during confirm action:', err);
             setSubmitError(err.message || 'Operation failed.');
             isAddingToListRef.current = false;
             // No need to re-throw
        }
    }, [ item, selectedListId, isCreatingNew, selectedHashtags, isAuthenticated, addToList, closeQuickAdd, userLists, setSubmitError ]);


    const handleSelectList = useCallback((listId) => { if (isAddingToListRef.current) return; setSelectedListId((prevId) => (prevId === listId ? null : listId)); setLocalError(''); setJustAddedToListId(null); setSubmitError(null); }, [setSubmitError]);
    const handleSwitchToCreateMode = useCallback(() => { if (isAddingToListRef.current) return; setIsCreatingNew(true); setSelectedListId(null); setLocalError(''); setSubmitError(null); if (cuisines.length === 0 && !isLoadingCuisines) { fetchCuisines(); } const defaultType = (item && item.type !== 'list') ? item.type : ''; setFormData(prev => ({ ...prev, list_type: defaultType })); }, [isLoadingCuisines, cuisines.length, fetchCuisines, item, setFormData, setSubmitError]);
    const handleSwitchToSelectMode = useCallback(() => { if (isAddingToListRef.current) return; setIsCreatingNew(false); resetForm({ name: '', description: '', is_public: true, list_type: '' }); setLocalError(''); setShowTagSuggestionsUI(false); setSelectedHashtags([]); setHashtagInput(''); setSubmitError(null); }, [resetForm, setSubmitError]);

    // Hashtag Logic (no changes needed)
    const debouncedSetHashtagInput = useMemo(() => debounce((value) => setHashtagInput(value), 300), []);
    const handleHashtagInputChange = useCallback((e) => { debouncedSetHashtagInput(e.target.value); setShowTagSuggestionsUI(true); setLocalError(''); setSubmitError(null); }, [debouncedSetHashtagInput, setSubmitError]);
    const handleAddTag = useCallback(() => { const newTag = hashtagInput.trim().toLowerCase(); if (!newTag) { setHashtagInput(''); return; } if (selectedHashtags.includes(newTag)) { setLocalError(`Tag "${newTag}" already added.`); setHashtagInput(''); return; } const isValidCuisine = cuisines.some((c) => c.name.toLowerCase() === newTag); if (isValidCuisine) { setSelectedHashtags((prev) => [...prev, newTag]); setHashtagInput(''); setShowTagSuggestionsUI(false); setLocalError(''); setSubmitError(null); } else { setLocalError(`"${hashtagInput.trim()}" is not a recognized tag.`); } }, [hashtagInput, selectedHashtags, cuisines, setLocalError, setSubmitError]);
    const handleTagInputKeyDown = useCallback((e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(); } }, [handleAddTag]);
    const handleRemoveTag = useCallback((tagToRemove) => { setSelectedHashtags((prev) => prev.filter((h) => h !== tagToRemove)); }, []);
    const handleSelectTagSuggestion = useCallback((tag) => { if (tag && !selectedHashtags.includes(tag)) { setSelectedHashtags((prev) => [...prev, tag]); } setHashtagInput(''); setShowTagSuggestionsUI(false); }, [selectedHashtags]);
    const filteredHashtags = useMemo(() => { const inputLower = hashtagInput.toLowerCase().trim(); if (!inputLower || !Array.isArray(cuisines)) return []; return cuisines.map((c) => c.name).filter((name) => name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(name)).slice(0, 5); }, [cuisines, hashtagInput, selectedHashtags]);

    // Confirm button disabled logic
    const isConfirmDisabled = useMemo(() => {
        if (isAddingToListRef.current || isSubmitting) return true;
        if (isCreatingNew) {
            // ** Disable if name or list_type is missing **
            return !formData.name?.trim() || !formData.list_type;
        } else {
             // Disable if no list selected OR if the selected list is incompatible
             if (!selectedListId) return true;
             const selectedList = userLists.find(l => l.id === selectedListId);
             return !selectedList || (item && item.type !== 'list' && selectedList.type !== item.type);
        }
    }, [isCreatingNew, selectedListId, formData.name, formData.list_type, isSubmitting, item, userLists]);

    const displayError = submitError || localError || fetchError;
    const modalTitle = isCreatingNew ? 'Create New List' : `Add "${item?.name || 'Item'}" to List`;

    if (!isOpen) return null;

    // Form submission handler wrapper
    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit(handleConfirmAction);
    };


    return (
        <Modal isOpen={isOpen} onClose={closeQuickAdd} title={modalTitle}>
            <form onSubmit={isCreatingNew ? handleFormSubmit : (e) => e.preventDefault()}>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {!isAuthenticated ? (
                       <p className="text-gray-600 text-sm text-center py-4"> Please{' '} <Link to="/login" onClick={closeQuickAdd} className="text-[#A78B71] hover:text-[#D1B399] underline font-medium"> log in </Link>{' '} {isCreatingNew ? 'to create lists.' : 'to add items to your lists.'} </p>
                    ) : isCreatingNew ? (
                        /* Create New List Form */
                        <div className="space-y-4 text-sm">
                             {!(item?.createNew) && userLists?.length > 0 && ( <Button onClick={handleSwitchToSelectMode} variant="tertiary" size="sm" className="mb-2 text-xs text-gray-600 hover:text-gray-800" disabled={isSubmitting}> ← Select Existing List </Button> )}
                             {/* List Name */}
                            <div>
                                <label htmlFor="list-name" className="block text-gray-700 font-medium mb-1">List Name*</label>
                                <input id="list-name" name="name" type="text" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:bg-gray-100" placeholder="e.g., NYC Cheap Eats" disabled={isSubmitting}/>
                            </div>
                             {/* Description */}
                            <div>
                                <label htmlFor="list-desc" className="block text-gray-700 font-medium mb-1">Description (Optional)</label>
                                <textarea id="list-desc" name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" placeholder="A short description..." rows="2" disabled={isSubmitting}/>
                            </div>
                            {/* List Type Selection */}
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">List Type*</label>
                                 <div className="flex flex-col sm:flex-row gap-3 mt-1">
                                      {/* ** REMOVED 'mixed' ** */}
                                     {(['restaurant', 'dish']).map(type => (
                                         <label key={type} className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors text-xs flex-1 justify-center ${isSubmitting ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${formData.list_type === type ? 'bg-[#D1B399]/10 border-[#D1B399]/50 ring-1 ring-[#D1B399]' : 'border-gray-300 hover:border-gray-400 bg-white'}`}>
                                             <input type="radio" name="list_type" value={type} checked={formData.list_type === type} onChange={handleChange} disabled={isSubmitting} className="h-3.5 w-3.5 text-[#A78B71] border-gray-300 focus:ring-[#A78B71] mr-1.5" required />
                                             <span className="capitalize">{type}</span>
                                              <HelpCircle size={12} className="ml-1 text-gray-400" title={type === 'restaurant' ? "Can only contain restaurants" : "Can only contain dishes"}/>
                                         </label>
                                     ))}
                                 </div>
                                  {/* ** Show error if no type selected ** */}
                                 {!formData.list_type && <p className="text-xs text-red-500 mt-1">Please select a list type.</p>}
                             </div>
                            {/* Hashtags */}
                            <div ref={tagInputRef} className="relative">
                                <label htmlFor="new-list-tags" className="block text-sm font-medium text-gray-700 mb-1">Hashtags (Optional)</label>
                                <input id="new-list-tags" type="text" value={hashtagInput} onChange={handleHashtagInputChange} onKeyDown={handleTagInputKeyDown} onFocus={() => setShowTagSuggestionsUI(true)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add..."} disabled={isSubmitting || isLoadingCuisines} autoComplete="off"/>
                                {showTagSuggestionsUI && filteredHashtags.length > 0 && hashtagInput && ( <ul ref={tagSuggestionsRef} className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg"> {filteredHashtags.map((name) => ( <li key={`tag-sugg-${name}`} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); handleSelectTagSuggestion(name); }}> #{name} </li> ))} </ul> )}
                                <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                                    {selectedHashtags.map((h) => ( <span key={h} className="inline-flex items-center px-2 py-0.5 bg-[#A78B71]/80 text-white rounded-full text-xs"> #{h} <button type="button" onClick={() => handleRemoveTag(h)} disabled={isSubmitting} className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none disabled:opacity-50" aria-label={`Remove tag ${h}`}><X size={12} /></button></span> ))}
                                </div>
                            </div>
                            {/* Public/Private Toggle */}
                             <div className="flex items-center justify-start pt-1">
                                <label className={`flex items-center mr-3 ${isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                    <div className="relative">
                                        <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleChange} className="sr-only peer" disabled={isSubmitting}/>
                                        <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                                    </div>
                                    <span className="ml-2 text-sm text-gray-700 select-none">{formData.is_public ? 'Public' : 'Private'}</span>
                                </label>
                                <span className="text-xs text-gray-500 flex items-center"><Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear...</span>
                            </div>
                        </div>
                    ) : (
                        /* Select Existing List View */
                        <>
                             {fetchError ? ( <p className="text-center py-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"> {fetchError} </p>
                             ) : !userLists || userLists.length === 0 ? ( <p className="text-center py-4 text-sm text-gray-500"> You haven’t created any lists yet.{' '} <button onClick={handleSwitchToCreateMode} className="text-[#A78B71] hover:text-[#D1B399] underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed" disabled={isAddingToListRef.current || isSubmitting}> Create one? </button> </p>
                             ) : ( <div className="space-y-1 max-h-60 overflow-y-auto pr-2"> <p className="text-xs text-gray-500 mb-2 pl-1">Select a list:</p> {userLists.map((list) => { const isCompatible = !item || item.type === 'list' || item.type === list.type; const isDisabled = isAddingToListRef.current || isSubmitting || justAddedToListId === list.id || !isCompatible; const tooltip = !isCompatible ? `Cannot add a ${item?.type} to this ${list.type} list` : undefined; return ( <button key={list.id} onClick={() => isCompatible && handleSelectList(list.id)} disabled={isDisabled} title={tooltip} aria-pressed={selectedListId === list.id} className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors border ${selectedListId === list.id ? 'bg-[#D1B399]/20 border-[#D1B399]/50' : 'border-transparent hover:bg-gray-100'} ${justAddedToListId === list.id ? 'bg-green-50 border-green-200 cursor-default' : ''} ${isDisabled && !(justAddedToListId === list.id) ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`} > <span className="font-medium text-gray-800 truncate"> {list.name} <span className="text-gray-500 text-xs capitalize">({list.type})</span> </span> {justAddedToListId === list.id && ( <CheckCircle size={16} className="text-green-500 flex-shrink-0 ml-2" /> )} {selectedListId === list.id && justAddedToListId !== list.id && ( <span className="text-xs text-[#A78B71] font-semibold">Selected</span> )} </button> ); })} <button onClick={handleSwitchToCreateMode} disabled={isAddingToListRef.current || isSubmitting} className="w-full text-left px-3 py-2 mt-2 text-sm text-[#A78B71] hover:text-[#D1B399] hover:bg-gray-100 rounded-md font-medium disabled:text-gray-400 disabled:cursor-not-allowed"> + Create a new list </button> </div> )}
                         </>
                    )}

                    {displayError && (<p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{displayError}</p>)}

                    <div className="mt-5 flex justify-end space-x-2 border-t border-gray-100 pt-4">
                        <Button onClick={closeQuickAdd} variant="tertiary" size="sm" disabled={isAddingToListRef.current || isSubmitting} className="text-gray-600 hover:text-gray-800"> Cancel </Button>
                        {isAuthenticated && (userLists?.length > 0 || isCreatingNew) && (
                            <Button
                                onClick={isCreatingNew ? undefined : (e) => { e.preventDefault(); handleSubmit(handleConfirmAction); }}
                                type={isCreatingNew ? "submit" : "button"}
                                size="sm"
                                variant="primary"
                                disabled={isConfirmDisabled || isAddingToListRef.current || isSubmitting}
                                className="flex items-center min-w-[100px] justify-center"
                            >
                                {(isAddingToListRef.current || isSubmitting) && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
                                {isCreatingNew ? 'Create List' : 'Add to List'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default React.memo(QuickAddPopup);