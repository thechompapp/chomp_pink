// src/pages/Lists/NewList.jsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserListStore from '@/stores/useUserListStore'; // Use alias
import useFormHandler from '@/hooks/useFormHandler'; // Use alias
import useUIStateStore from '@/stores/useUIStateStore'; // Use alias
import Button from '@/components/Button'; // Use alias
import { Loader2, CheckCircle, Info, X, HelpCircle } from 'lucide-react'; // Added HelpCircle

const NewList = () => {
    const navigate = useNavigate();
    // Use the unified action from the store
    const addToListAction = useUserListStore(state => state.addToList);
    // Check overall adding state from the store
    const isProcessing = useUserListStore(state => state.isAddingToList);
    const storeError = useUserListStore(state => state.error);
    const clearStoreError = useUserListStore(state => state.clearError);

    // Cuisines for hashtag suggestions
    const cuisines = useUIStateStore(state => state.cuisines || []);
    const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
    const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);

    // Local state for tags UI
    const [hashtagInput, setHashtagInput] = useState('');
    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
    const hashtagInputRef = useRef(null);

    // Form handler for list name, description, public toggle, AND list type
    const {
        formData,
        handleChange,
        handleSubmit,
        isSubmitting, // Use store's `isProcessing` as primary loading state
        submitError,
        setSubmitError,
        resetForm,
        setFormData, // Allow direct setting if needed
    } = useFormHandler({
        name: '',
        description: '',
        is_public: true,
        list_type: 'mixed', // Added list_type with default 'mixed'
    });

    // Fetch cuisines if not already loaded
    useEffect(() => {
        if (cuisines.length === 0 && !isLoadingCuisines) {
            fetchCuisines();
        }
    }, [cuisines.length, fetchCuisines, isLoadingCuisines]); // Add isLoadingCuisines dependency

    // Clear errors on mount/unmount
    useEffect(() => {
        clearStoreError?.();
        setSubmitError(null); // Also clear form handler error
        return () => {
             clearStoreError?.();
             setSubmitError(null);
        };
    }, [clearStoreError, setSubmitError]); // Add setSubmitError dependency

    // --- Hashtag Logic ---
    const filteredHashtags = useMemo(() => {
        if (!hashtagInput.trim() || cuisines.length === 0) return [];
        const inputLower = hashtagInput.toLowerCase();
        // Suggest cuisines not already selected
        return cuisines
            .filter(c => c.name.toLowerCase().includes(inputLower) && !selectedHashtags.includes(c.name))
            .map(c => c.name)
            .slice(0, 5); // Limit suggestions
    }, [cuisines, hashtagInput, selectedHashtags]);

    const handleAddHashtag = useCallback(() => {
        const newTag = hashtagInput.trim().toLowerCase();
        if (newTag && !selectedHashtags.includes(newTag)) {
             // Check if it's a valid cuisine name before adding
             const isValidCuisine = cuisines.some(c => c.name.toLowerCase() === newTag);
             if (isValidCuisine) {
                 setSelectedHashtags(prev => [...prev, newTag]);
                 setHashtagInput('');
                 setShowHashtagSuggestions(false);
                 setSubmitError(null); // Clear potential previous errors
             } else {
                  setSubmitError(`"${hashtagInput.trim()}" is not a recognized tag.`);
             }
        } else if (newTag && selectedHashtags.includes(newTag)) {
            setSubmitError(`Tag "${newTag}" already added.`);
            setHashtagInput(''); // Clear input
        } else {
             setHashtagInput(''); // Clear input if empty/invalid
        }
      }, [hashtagInput, selectedHashtags, setSubmitError, cuisines]);

    const handleHashtagInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddHashtag();
        }
    }, [handleAddHashtag]);

    const handleRemoveHashtag = useCallback((hashtagToRemove) => {
        setSelectedHashtags(prev => prev.filter(h => h !== hashtagToRemove));
    }, []);

    const handleSelectHashtagSuggestion = useCallback((tag) => {
        if (!selectedHashtags.includes(tag)) {
            setSelectedHashtags(prev => [...prev, tag]);
        }
        setHashtagInput('');
        setShowHashtagSuggestions(false);
    }, [selectedHashtags]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showHashtagSuggestions && hashtagInputRef.current && !hashtagInputRef.current.contains(event.target)) {
                setShowHashtagSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showHashtagSuggestions]);

    // --- Form Submission ---
    const performSubmit = async (currentFormData) => {
        if (!currentFormData.name?.trim()) {
            throw new Error('List name cannot be empty.');
        }
        try {
            // Call the store action to create the list
            const result = await addToListAction({
                // No item needed when just creating a list
                item: null,
                createNew: true,
                listData: {
                    name: currentFormData.name.trim(),
                    description: currentFormData.description.trim() || null,
                    is_public: currentFormData.is_public,
                    list_type: currentFormData.list_type, // Pass list_type
                    tags: selectedHashtags,
                }
            });

            // Check result format from store action
            if (result?.success && result?.listId) {
                console.log("New list created, navigating to:", `/lists/${result.listId}`);
                // Navigate to the newly created list's detail page on success
                navigate(`/lists/${result.listId}`);
            } else {
                 // If store action resolved but didn't return expected result
                 throw new Error(result?.message || "List creation failed or did not return expected ID.");
            }
        } catch (error) {
            // Error is set in the store, re-throw it for useFormHandler
             console.error("Error during list creation submission:", error);
             // Make sure the error message is user-friendly
             const message = error.message || 'An unexpected error occurred during list creation.';
             setSubmitError(message); // Ensure form handler also gets the error
             throw new Error(message); // Re-throw for handleSubmit
        }
    };

    // Wrapper for form's onSubmit
    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit(performSubmit); // Pass the submission logic to the hook
    };

    // Combine potential errors from form validation/submission and store actions
    const displayError = submitError || storeError;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Button onClick={() => navigate('/lists')} variant="tertiary" size="sm" className="mb-6">
                &larr; Back to My Lists
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create New List</h1>

            <form onSubmit={handleFormSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow border border-gray-100">
                {/* List Name */}
                <div>
                    <label htmlFor="new-list-name" className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
                    <input
                        id="new-list-name"
                        name="name" // Matches key in useFormHandler initialValues
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-50"
                        placeholder="e.g., NYC Cheap Eats"
                        disabled={isProcessing}
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="new-list-desc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                        id="new-list-desc"
                        name="description" // Matches key in useFormHandler initialValues
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-50"
                        placeholder="A short description of your list's theme"
                        rows="3"
                        disabled={isProcessing}
                    />
                </div>

                {/* List Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">List Type*</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {(['mixed', 'restaurant', 'dish']).map(type => (
                             <label key={type} className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${formData.list_type === type ? 'bg-[#D1B399]/10 border-[#D1B399]/50 ring-1 ring-[#D1B399]' : 'border-gray-300 hover:border-gray-400'} ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <input
                                    type="radio"
                                    name="list_type"
                                    value={type}
                                    checked={formData.list_type === type}
                                    onChange={handleChange}
                                    disabled={isProcessing}
                                    className="h-4 w-4 text-[#A78B71] border-gray-300 focus:ring-[#A78B71] mr-2"
                                />
                                <span className="capitalize text-sm">{type}</span>
                                {type === 'mixed' && <HelpCircle size={14} className="ml-1 text-gray-400" title="Can contain both restaurants and dishes"/>}
                                {type === 'restaurant' && <HelpCircle size={14} className="ml-1 text-gray-400" title="Can only contain restaurants"/>}
                                {type === 'dish' && <HelpCircle size={14} className="ml-1 text-gray-400" title="Can only contain dishes"/>}
                             </label>
                        ))}
                    </div>
                </div>


                {/* Hashtags */}
                <div ref={hashtagInputRef} className="relative">
                    <label htmlFor="new-list-tags" className="block text-sm font-medium text-gray-700 mb-1">Hashtags (Optional)</label>
                    <input
                        id="new-list-tags"
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => {setHashtagInput(e.target.value); setShowHashtagSuggestions(true); setSubmitError(null);}}
                        onKeyDown={handleHashtagInputKeyDown}
                        onFocus={() => setShowHashtagSuggestions(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-50"
                        placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add relevant tags"}
                        disabled={isProcessing || isLoadingCuisines}
                        autoComplete="off"
                    />
                    {/* Suggestions Dropdown */}
                    {showHashtagSuggestions && filteredHashtags.length > 0 && hashtagInput && (
                        <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg">
                            {filteredHashtags.map((name) => (
                                <li
                                    key={name}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    // Use onMouseDown to register click before blur hides list
                                    onMouseDown={(e) => { e.preventDefault(); handleSelectHashtagSuggestion(name); }}
                                >
                                    #{name}
                                </li>
                            ))}
                        </ul>
                    )}
                    {/* Selected Tags Display */}
                    <div className="mt-2 flex flex-wrap gap-1 min-h-[20px]">
                        {selectedHashtags.map((h) => (
                            <span key={h} className="inline-flex items-center px-2 py-0.5 bg-[#A78B71] text-white rounded-full text-xs">
                                #{h}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveHashtag(h)}
                                    disabled={isProcessing}
                                    className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none disabled:opacity-50"
                                    aria-label={`Remove tag ${h}`}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Public/Private Toggle */}
                <div className="flex items-center justify-start pt-1">
                    <label className={`flex items-center mr-3 ${isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="is_public" // Matches key in useFormHandler initialValues
                                checked={formData.is_public}
                                onChange={handleChange}
                                className="sr-only peer"
                                disabled={isProcessing}
                            />
                            <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700 select-none">
                            {formData.is_public ? 'Public' : 'Private'}
                        </span>
                    </label>
                    <span className="text-xs text-gray-500 flex items-center">
                        <Info size={13} className="mr-1 flex-shrink-0"/>
                        Public lists may appear in trending sections.
                    </span>
                </div>

                {/* Error Display */}
                {displayError && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
                        {displayError}
                    </p>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full flex justify-center py-2 px-4 disabled:opacity-75" // Ensure disabled style is noticeable
                        disabled={isProcessing} // Use store's loading state
                    >
                        {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create List'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default NewList;