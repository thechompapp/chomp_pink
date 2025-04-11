/* src/components/FloatingQuickAdd.jsx */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/UI/Button.jsx'; // Corrected path
import Modal from '@/components/UI/Modal.jsx'; // Corrected path
import useSubmissionStore from '@/stores/useSubmissionStore';
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow';
import useFormHandler from '@/hooks/useFormHandler.ts'; // Use .ts extension
import { placeService } from '@/services/placeService.ts'; // Use .ts extension
import { GOOGLE_PLACES_API_KEY } from '@/config';

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const FloatingQuickAddComponent = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formState, setFormState] = useState({
        formType: null, // 'dish', 'restaurant', or null
        tagInput: '',
        selectedTags: [],
        restaurantSuggestions: [],
        placeDetails: null,
    });
    const [isFetchingPlaceSuggestions, setIsFetchingPlaceSuggestions] = useState(false);
    const [showTagSuggestionsUI, setShowTagSuggestionsUI] = useState(false);
    const [showRestaurantSuggestionsUI, setShowRestaurantSuggestionsUI] = useState(false);

    const containerRef = useRef(null);
    const tagInputRef = useRef(null);
    const restaurantInputRef = useRef(null);
    const tagSuggestionsRef = useRef(null);
    const restaurantSuggestionsRef = useRef(null);
    const debounceTimerRef = useRef(null);

    const { openQuickAdd } = useQuickAdd();
    const addPendingSubmission = useSubmissionStore((state) => state.addPendingSubmission);
    const { cuisines, isLoadingCuisines } = useUIStateStore(
        useShallow((state) => ({
            cuisines: state.cuisines || [],
            isLoadingCuisines: state.isLoadingCuisines,
        }))
    );

    const { formData, handleChange, handleSubmit, isSubmitting, submitError, setSubmitError, resetForm, setFormData } =
        useFormHandler({ newItemName: '', restaurantInput: '' });

    const hasGooglePlacesKey = !!GOOGLE_PLACES_API_KEY;

    // --- State Resets ---
    const resetLocalFormState = useCallback(() => {
        setFormState({ formType: null, tagInput: '', selectedTags: [], restaurantSuggestions: [], placeDetails: null });
        setShowTagSuggestionsUI(false);
        setShowRestaurantSuggestionsUI(false);
        setIsFetchingPlaceSuggestions(false);
    }, []);

    const resetAllState = useCallback(() => {
        resetLocalFormState();
        resetForm({ newItemName: '', restaurantInput: '' });
        setSubmitError(null);
    }, [resetForm, setSubmitError, resetLocalFormState]);

    // --- Place Suggestions ---
    const fetchPlaceSuggestions = useCallback(
        async (input) => {
            if (!hasGooglePlacesKey) {
                setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
                setShowRestaurantSuggestionsUI(false);
                return;
            }
            const trimmedInput = input?.trim();
            if (!trimmedInput || trimmedInput.length < 2) {
                setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
                setShowRestaurantSuggestionsUI(false);
                return;
            }
            setIsFetchingPlaceSuggestions(true);
            try {
                const predictions = await placeService.getAutocompleteSuggestions(trimmedInput);
                // --- Corrected Filter Line (Removed TypeScript Type Predicate) ---
                const validPredictions = (Array.isArray(predictions) ? predictions : [])
                    .map((p) => ({ name: p?.description, placeId: p?.place_id }))
                    .filter(p => !!p.name && !!p.placeId); // Use simple boolean check
                // --- End Correction ---

                setFormState((prev) => ({ ...prev, restaurantSuggestions: validPredictions }));
                setShowRestaurantSuggestionsUI(validPredictions.length > 0);
            } catch (error) {
                console.error('[FloatingQuickAdd] Error fetching place suggestions:', error);
                setSubmitError('Failed to load restaurant suggestions.');
                setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
                setShowRestaurantSuggestionsUI(false);
            } finally {
                setIsFetchingPlaceSuggestions(false);
            }
        },
        [setSubmitError, hasGooglePlacesKey]
    );

    // Debounce restaurant input changes
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (formState.formType === 'dish' || formState.formType === 'restaurant') {
            debounceTimerRef.current = setTimeout(() => fetchPlaceSuggestions(formData.restaurantInput), 350);
        } else {
            setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
            setShowRestaurantSuggestionsUI(false);
        }
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [formData.restaurantInput, formState.formType, fetchPlaceSuggestions]);

    // --- Click Outside Handling ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            const fabButton = document.getElementById('floating-quick-add-button');
            const mainContainer = containerRef.current;

            if (mainContainer && !mainContainer.contains(event.target) && !(fabButton && fabButton.contains(event.target))) {
                if (isMenuOpen) {
                    setIsMenuOpen(false);
                    resetAllState();
                }
            } else if (mainContainer && mainContainer.contains(event.target)) {
                if (
                    showTagSuggestionsUI &&
                    tagInputRef.current && !tagInputRef.current.contains(event.target) &&
                    tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(event.target)
                ) {
                    setShowTagSuggestionsUI(false);
                }
                if (
                    showRestaurantSuggestionsUI &&
                    restaurantInputRef.current && !restaurantInputRef.current.contains(event.target) &&
                    restaurantSuggestionsRef.current && !restaurantSuggestionsRef.current.contains(event.target)
                ) {
                    setShowRestaurantSuggestionsUI(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, resetAllState, showTagSuggestionsUI, showRestaurantSuggestionsUI]);

    // --- Button Actions ---
    const handleOpenMainButton = useCallback(() => {
        setIsMenuOpen((prev) => {
            const nextState = !prev;
            if (!nextState) resetAllState();
            return nextState;
        });
    }, [resetAllState]);

    const handleOpenDishForm = useCallback(() => {
        resetAllState();
        setFormState((prev) => ({ ...prev, formType: 'dish' }));
    }, [resetAllState]);

    const handleOpenRestaurantForm = useCallback(() => {
        resetAllState();
        setFormState((prev) => ({ ...prev, formType: 'restaurant' }));
    }, [resetAllState]);

    const handleCreateNewList = useCallback(() => {
        if (openQuickAdd) {
            openQuickAdd({ type: 'list', createNew: true });
        }
        setIsMenuOpen(false);
        resetAllState();
    }, [openQuickAdd, resetAllState]);

    // --- Tag Handling ---
    const handleAddTag = useCallback(() => {
        const newTag = formState.tagInput.trim().toLowerCase();
        if (!newTag) return;

        if (formState.selectedTags.includes(newTag)) {
            setSubmitError(`Tag "${newTag}" already added.`);
            setFormState((prev) => ({ ...prev, tagInput: '' }));
            return;
        }

        const isValidTag = cuisines.some((c) => c.name.toLowerCase() === newTag);
        if (isValidTag) {
            setFormState((prev) => ({ ...prev, selectedTags: [...prev.selectedTags, newTag], tagInput: '' }));
            setShowTagSuggestionsUI(false);
            setSubmitError(null);
        } else {
            setSubmitError(`"${formState.tagInput.trim()}" is not a recognized tag.`);
        }
    }, [formState.tagInput, formState.selectedTags, setSubmitError, cuisines]);

    const handleTagInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    }, [handleAddTag]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setFormState((prev) => ({ ...prev, selectedTags: prev.selectedTags.filter((tag) => tag !== tagToRemove) }));
    }, []);

    const handleSelectTagSuggestion = useCallback((tag) => {
        if (tag && !formState.selectedTags.includes(tag)) {
            setFormState((prev) => ({ ...prev, selectedTags: [...prev.selectedTags, tag], tagInput: '' }));
        } else {
            setFormState((prev) => ({ ...prev, tagInput: '' }));
        }
        setShowTagSuggestionsUI(false);
    }, [formState.selectedTags]);

    // --- Restaurant Selection ---
    const handleSelectRestaurantSuggestion = useCallback(
        async (suggestion) => {
            if (!suggestion || !suggestion.placeId) return;

            setFormData((prev) => ({
                ...prev,
                newItemName: formState.formType === 'restaurant' ? suggestion.name : prev.newItemName,
                restaurantInput: suggestion.name,
            }));
            setShowRestaurantSuggestionsUI(false);
            setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));

            if (!hasGooglePlacesKey) {
                setSubmitError('Google Places API key is missing; place details unavailable.');
                return;
            }

            setIsFetchingPlaceSuggestions(true);
            setFormState((prev) => ({ ...prev, placeDetails: null }));
            setSubmitError(null);

            try {
                const details = await placeService.getPlaceDetails(suggestion.placeId);
                if (details && typeof details === 'object') {
                    setFormState((prev) => ({ ...prev, placeDetails: details }));
                    if (formState.formType === 'restaurant' && !formData.newItemName) {
                        setFormData((prev) => ({ ...prev, newItemName: details.name || suggestion.name }));
                    }
                } else {
                    throw new Error('Received invalid details from place service.');
                }
            } catch (error) {
                console.error('[FloatingQuickAdd] Error fetching place details:', error);
                setSubmitError('Could not fetch place details.');
                setFormState((prev) => ({ ...prev, placeDetails: null }));
            } finally {
                setIsFetchingPlaceSuggestions(false);
            }
        },
        [setFormData, formState.formType, setSubmitError, formData.newItemName, hasGooglePlacesKey]
    );

    // --- Input Change Handlers ---
    const handleRestaurantInputChange = useCallback((event) => {
        handleChange(event);
        if (formState.placeDetails) {
            setFormState((prev) => ({ ...prev, placeDetails: null }));
        }
    }, [handleChange, formState.placeDetails]);

    const handleHashtagInputChange = useCallback((e) => {
        const value = e.target.value;
        setFormState((prev) => ({ ...prev, tagInput: value }));
        if (value.trim()) {
            setShowTagSuggestionsUI(true);
        } else {
            setShowTagSuggestionsUI(false);
        }
    }, []);

     const handleRestaurantInputFocus = useCallback(() => {
        if (formState.restaurantSuggestions.length > 0) {
            setShowRestaurantSuggestionsUI(true);
        }
    }, [formState.restaurantSuggestions.length]);

    // --- Submission Logic ---
    const performSubmit = useCallback(
        async (currentHookFormData) => {
            if (!currentHookFormData?.newItemName?.trim()) {
                throw new Error('Please provide a name for the item.');
            }
            if (formState.formType === 'dish' && !currentHookFormData?.restaurantInput?.trim()) {
                throw new Error('Please provide the restaurant name for the dish.');
            }

            const submissionData = {
                type: formState.formType,
                name: currentHookFormData.newItemName.trim(),
                location: formState.placeDetails?.formattedAddress ?? (formState.formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null),
                city: formState.placeDetails?.city ?? null,
                neighborhood: formState.placeDetails?.neighborhood ?? null,
                place_id: formState.placeDetails?.placeId ?? null,
                restaurant_name: (formState.formType === 'dish' && !formState.placeDetails?.placeId)
                                 ? currentHookFormData.restaurantInput.trim()
                                 : null,
                tags: Array.isArray(formState.selectedTags) ? formState.selectedTags : [],
            };

            console.log('[FloatingQuickAdd] Submitting:', submissionData);
            await addPendingSubmission(submissionData);

            setIsMenuOpen(false);
            resetAllState();
        },
        [formState.formType, formState.selectedTags, formState.placeDetails, addPendingSubmission, resetAllState]
    );

    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        handleSubmit(performSubmit);
    }, [handleSubmit, performSubmit]);

    // --- Derived State ---
    const filteredHashtags = useMemo(() => {
        const inputLower = formState.tagInput.trim().toLowerCase();
        if (!inputLower || isLoadingCuisines || !Array.isArray(cuisines)) return [];
        return cuisines
            .filter((cuisine) => cuisine.name.toLowerCase().includes(inputLower) && !formState.selectedTags.includes(cuisine.name.toLowerCase()))
            .map((cuisine) => cuisine.name)
            .slice(0, 5);
    }, [formState.tagInput, formState.selectedTags, cuisines, isLoadingCuisines]);


    return (
        <>
            <button
                id="floating-quick-add-button"
                onClick={handleOpenMainButton}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50"
                aria-label={isMenuOpen ? 'Close quick add menu' : 'Open quick add menu'}
                aria-expanded={isMenuOpen}
                aria-controls="quick-add-menu"
            >
                <Plus size={28} className={`transition-transform duration-200 ease-in-out ${isMenuOpen ? 'transform rotate-45' : ''}`} />
            </button>

            <div
                id="quick-add-menu"
                ref={containerRef}
                className={`fixed bottom-24 right-6 w-[340px] z-40 transition-all duration-300 ease-in-out transform ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                role="dialog"
                aria-modal="true"
                aria-hidden={!isMenuOpen}
                aria-labelledby="fq-dialog-title"
            >
                {!formState.formType ? (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
                        <h3 id="fq-dialog-title" className="text-sm font-semibold text-gray-600 text-center mb-2">Quick Add</h3>
                        <Button onClick={handleOpenDishForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 py-2 px-3">
                            <Utensils size={16} /> <span>Add New Dish...</span>
                        </Button>
                        <Button onClick={handleOpenRestaurantForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 py-2 px-3">
                            <Store size={16} /> <span>Add New Restaurant...</span>
                        </Button>
                        <Button onClick={handleCreateNewList} variant="tertiary" className="w-full flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 py-2 px-3">
                            <List size={16} /> <span>Create New List...</span>
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 id="fq-dialog-title" className="text-lg font-semibold text-gray-900">
                                {formState.formType === 'dish' ? 'Submit a Dish' : 'Submit a Restaurant'}
                            </h3>
                            <Button onClick={resetAllState} variant="tertiary" size="sm" className="p-1 text-gray-400 hover:text-gray-600" aria-label="Back to quick add menu">
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div>
                                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                                    {formState.formType === 'dish' ? 'Dish Name*' : 'Restaurant Name*'}
                                </label>
                                <input
                                    id="fq-item-name"
                                    type="text"
                                    required
                                    name="newItemName"
                                    value={formData.newItemName}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                                    placeholder={formState.formType === 'dish' ? 'e.g., Short Rib Taco' : 'e.g., Kogi BBQ Truck'}
                                />
                            </div>

                            {formState.formType === 'dish' && (
                                <div ref={restaurantInputRef} className="relative">
                                    <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">Restaurant Name*</label>
                                    <div className="relative">
                                        <input
                                            id="fq-restaurant-name"
                                            type="text"
                                            required
                                            name="restaurantInput"
                                            value={formData.restaurantInput}
                                            onChange={handleRestaurantInputChange}
                                            onFocus={handleRestaurantInputFocus}
                                            disabled={isSubmitting || isFetchingPlaceSuggestions}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100 pr-8"
                                            placeholder="Start typing..."
                                            autoComplete="off"
                                        />
                                        {isFetchingPlaceSuggestions && (
                                            <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                                        )}
                                    </div>
                                    {showRestaurantSuggestionsUI && Array.isArray(formState.restaurantSuggestions) && formState.restaurantSuggestions.length > 0 && (
                                        <div ref={restaurantSuggestionsRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                                            <ul>
                                                {formState.restaurantSuggestions.map((suggestion) =>
                                                    suggestion?.placeId ? (
                                                        <li key={`rest-sugg-${suggestion.placeId}`}>
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleSelectRestaurantSuggestion(suggestion);
                                                                }}
                                                            >
                                                                {suggestion.name}
                                                            </button>
                                                        </li>
                                                    ) : null
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div ref={tagInputRef} className="relative">
                                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">Tags (optional, comma or Enter)</label>
                                <input
                                    id="fq-tags"
                                    type="text"
                                    value={formState.tagInput}
                                    onChange={handleHashtagInputChange}
                                    onKeyDown={handleTagInputKeyDown}
                                    onFocus={() => setShowTagSuggestionsUI(true)}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                                    placeholder={isLoadingCuisines ? "Loading tags..." : "Type to find matching tags"}
                                    autoComplete="off"
                                />
                                {showTagSuggestionsUI && !isLoadingCuisines && filteredHashtags.length > 0 && (
                                    <div ref={tagSuggestionsRef} className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                                        <ul>
                                            {filteredHashtags.map((tag) => (
                                                <li key={`tag-sugg-${tag}`}>
                                                    <button
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                                        onMouseDown={(e) => { e.preventDefault(); handleSelectTagSuggestion(tag); }}
                                                    >
                                                        #{tag}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {Array.isArray(formState.selectedTags) && formState.selectedTags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {formState.selectedTags.map((tag) => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    disabled={isSubmitting}
                                                    className="ml-1 -mr-0.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full focus:outline-none focus:bg-gray-200 disabled:cursor-not-allowed"
                                                    aria-label={`Remove tag ${tag}`}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {formState.placeDetails && (
                                <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                                    <p><strong>Selected Location:</strong> {formState.placeDetails.formattedAddress}</p>
                                    <p><strong>City:</strong> {formState.placeDetails.city || 'N/A'}, <strong>Neighborhood:</strong> {formState.placeDetails.neighborhood || 'N/A'}</p>
                                </div>
                            )}

                            {submitError && (
                                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2 text-center">
                                    {submitError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full flex justify-center py-2 px-4 mt-4"
                                disabled={isSubmitting || isFetchingPlaceSuggestions}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <>
                                        <Send size={16} className="mr-2" /> Submit for Review
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default React.memo(FloatingQuickAddComponent);