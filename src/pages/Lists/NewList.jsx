// src/pages/Lists/NewList.jsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserListStore from '@/stores/useUserListStore';
import useFormHandler from '@/hooks/useFormHandler';
import useUIStateStore from '@/stores/useUIStateStore'; // For hashtags/cuisines
import Button from '@/components/Button';
import { Loader2, CheckCircle, Info, X } from 'lucide-react';

const NewList = () => {
    const navigate = useNavigate();
    const addToListAction = useUserListStore(state => state.addToList); // Use the unified action
    const isProcessing = useUserListStore(state => state.isAddingToList); // Check overall adding state
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

    // Form handler for list name, description, public toggle
    const {
        formData,
        handleChange,
        handleSubmit,
        isSubmitting, // Use this for form-specific loading state if needed, but store's `isProcessing` is primary
        submitError,
        setSubmitError,
        resetForm,
    } = useFormHandler({
        name: '',
        description: '',
        is_public: true,
    });

    // Fetch cuisines if not already loaded
    useEffect(() => {
        if (cuisines.length === 0) {
            fetchCuisines();
        }
    }, [cuisines, fetchCuisines]);

    // Clear errors on mount/unmount
    useEffect(() => {
        clearStoreError?.();
        return () => clearStoreError?.();
    }, [clearStoreError]);

    // --- Hashtag Logic ---
    const filteredHashtags = useMemo(() => {
        if (!hashtagInput.trim() || cuisines.length === 0) return [];
        const inputLower = hashtagInput.toLowerCase();
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
                createNew: true,
                listData: {
                    name: currentFormData.name.trim(),
                    description: currentFormData.description.trim() || null,
                    is_public: currentFormData.is_public,
                    tags: selectedHashtags,
                }
            });

            if (result?.success && result?.listId) {
                console.log("New list created, navigating to:", `/lists/${result.listId}`);
                // Navigate to the newly created list's detail page on success
                navigate(`/lists/${result.listId}`);
            } else {
                 throw new Error("List creation succeeded but no ID was returned.");
            }
        } catch (error) {
            // Error is set in the store, re-throw it for useFormHandler
             console.error("Error during list creation submission:", error);
             throw error;
        }
    };

    // Wrapper for form's onSubmit
    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit(performSubmit); // Pass the submission logic to the hook
    };

    const displayError = submitError || storeError; // Show form handler error or store error

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Button onClick={() => navigate('/lists')} variant="tertiary" size="sm" className="mb-6">
                &larr; Back to My Lists
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create New List</h1>
            <form onSubmit={handleFormSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow border border-gray-100">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                        placeholder="A short description of your list's theme"
                        rows="3"
                        disabled={isProcessing}
                    />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
                        placeholder={isLoadingCuisines ? "Loading tags..." : "Type to add relevant tags"}
                        disabled={isProcessing || isLoadingCuisines}
                        autoComplete="off"
                    />
                    {showHashtagSuggestions && filteredHashtags.length > 0 && hashtagInput && (
                        <ul className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg">
                            {filteredHashtags.map((name) => (
                                <li
                                    key={name}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onMouseDown={(e) => { // Use onMouseDown to register click before blur hides list
                                        e.preventDefault();
                                        handleSelectHashtagSuggestion(name);
                                    }}
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
                                    onClick={() => handleRemoveHashtag(h)}
                                    disabled={isProcessing}
                                    className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none"
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
                        className="w-full flex justify-center py-2 px-4"
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