/* src/components/FloatingQuickAdd.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Plus, Utensils, Store, List, X as IconX, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow';
import useFormHandler from '@/hooks/useFormHandler'; // Use .js extension removed
import { placeService } from '@/services/placeService'; // Use .js extension removed
// REMOVED: import { GOOGLE_PLACES_API_KEY } from '@/config';

// Debounce function
const debounce = (func, wait) => { /* ... same implementation ... */ };

const FloatingQuickAddComponent = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formState, setFormState] = useState({
        formType: null,
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
    const { cuisines, isLoadingCuisines, fetchCuisines } = useUIStateStore( // Added fetchCuisines
        useShallow((state) => ({
            cuisines: state.cuisines || [],
            isLoadingCuisines: state.isLoadingCuisines,
            fetchCuisines: state.fetchCuisines, // Get action
        }))
    );

    const { formData, handleChange, handleSubmit, isSubmitting, submitError, setSubmitError, resetForm, setFormData } =
        useFormHandler({ newItemName: '', restaurantInput: '' });

    // Fetch cuisines on mount if needed
    useEffect(() => {
        if (cuisines.length === 0 && !isLoadingCuisines) {
            fetchCuisines();
        }
    }, [fetchCuisines, cuisines.length, isLoadingCuisines]);

    // Reset state functions (no TS needed)
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

    // Fetch place suggestions (removed API key check logic, relies on backend proxy)
    const fetchPlaceSuggestions = useCallback(
        async (input) => { // REMOVED: Type hint
            const trimmedInput = input?.trim();
            if (!trimmedInput || trimmedInput.length < 2) {
                setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
                setShowRestaurantSuggestionsUI(false);
                return;
            }
            setIsFetchingPlaceSuggestions(true);
            try {
                // placeService calls the backend proxy
                const predictions = await placeService.getAutocompleteSuggestions(trimmedInput);
                // Ensure predictions is an array before mapping
                const validPredictions = (Array.isArray(predictions) ? predictions : [])
                    .map((p) => ({ name: p?.description, placeId: p?.place_id }))
                    .filter(p => !!p.name && !!p.placeId);

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
        [setSubmitError]
    );

    // Debounce restaurant input changes
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (formState.formType === 'dish' || formState.formType === 'restaurant') {
             // Only fetch if input has some length
             if (formData.restaurantInput?.trim().length >= 2) {
                debounceTimerRef.current = setTimeout(() => fetchPlaceSuggestions(formData.restaurantInput), 350);
             } else {
                // Clear suggestions if input is too short
                setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
                setShowRestaurantSuggestionsUI(false);
             }
        } else {
            setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
            setShowRestaurantSuggestionsUI(false);
        }
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [formData.restaurantInput, formState.formType, fetchPlaceSuggestions]);

    // Click Outside Handling (no TS changes needed)
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
                 // Hide suggestion lists if clicking outside their specific areas
                 if (showTagSuggestionsUI && tagInputRef.current && !tagInputRef.current.contains(event.target) && tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(event.target)) {
                    setShowTagSuggestionsUI(false);
                 }
                 if (showRestaurantSuggestionsUI && restaurantInputRef.current && !restaurantInputRef.current.contains(event.target) && restaurantSuggestionsRef.current && !restaurantSuggestionsRef.current.contains(event.target)) {
                    setShowRestaurantSuggestionsUI(false);
                 }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, resetAllState, showTagSuggestionsUI, showRestaurantSuggestionsUI]);


    // Button Actions (no TS changes needed)
    const handleOpenMainButton = useCallback(() => {
        setIsMenuOpen((prev) => {
            const nextState = !prev;
            if (!nextState) resetAllState(); // Reset if closing
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
        setIsMenuOpen(false); // Close the FAB menu
        resetAllState();
    }, [openQuickAdd, resetAllState]);

    // Tag Handling (no TS changes needed)
    const handleAddTag = useCallback(() => {
        const newTag = formState.tagInput.trim().toLowerCase();
        if (!newTag) return;
        if (formState.selectedTags.includes(newTag)) {
             setSubmitError(`Tag "${newTag}" already added.`);
             setFormState(prev => ({ ...prev, tagInput: '' })); // Clear input
             return;
        }
        const isValidTag = cuisines.some((c) => c.name.toLowerCase() === newTag);
        if (isValidTag) {
            setFormState((prev) => ({ ...prev, selectedTags: [...prev.selectedTags, newTag], tagInput: '' }));
            setShowTagSuggestionsUI(false);
            setSubmitError(null);
        } else {
            setSubmitError(`"${formState.tagInput.trim()}" is not a recognized tag.`);
             // Maybe don't clear input if tag is invalid? User might want to correct it.
             // setFormState(prev => ({ ...prev, tagInput: '' }));
        }
    }, [formState.tagInput, formState.selectedTags, setSubmitError, cuisines]); // Added cuisines dependency

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
             setFormState(prev => ({ ...prev, selectedTags: [...prev.selectedTags, tag], tagInput: '' }));
         } else {
              setFormState(prev => ({ ...prev, tagInput: '' })); // Clear input even if tag already selected
         }
        setShowTagSuggestionsUI(false);
    }, [formState.selectedTags]);


    // Restaurant Selection (removed API key check, relies on backend proxy)
    const handleSelectRestaurantSuggestion = useCallback(
        async (suggestion) => { // REMOVED: Type hint
            if (!suggestion || !suggestion.placeId) return;

            // Update form fields first
            setFormData((prev) => ({
                ...prev,
                // Update item name only if adding a restaurant, keep dish name otherwise
                newItemName: formState.formType === 'restaurant' ? suggestion.name : prev.newItemName,
                restaurantInput: suggestion.name, // Set restaurant input regardless of type
            }));
            setShowRestaurantSuggestionsUI(false); // Hide suggestions
            setFormState((prev) => ({ ...prev, restaurantSuggestions: [] })); // Clear suggestions array

            setIsFetchingPlaceSuggestions(true);
            setFormState((prev) => ({ ...prev, placeDetails: null })); // Clear previous details
            setSubmitError(null);

            try {
                 // Use placeService which calls the backend proxy
                const details = await placeService.getPlaceDetails(suggestion.placeId);
                if (details) { // Check if details are returned
                    setFormState((prev) => ({ ...prev, placeDetails: details }));
                    // If adding a restaurant, ensure name is updated from details if available
                    if (formState.formType === 'restaurant' && details.name) {
                         setFormData((prev) => ({ ...prev, newItemName: details.name }));
                    }
                } else {
                     console.warn(`[FloatingQuickAdd] No place details returned from service for ${suggestion.placeId}`);
                     setSubmitError('Could not retrieve full place details.');
                     setFormState((prev) => ({ ...prev, placeDetails: null })); // Ensure details are null
                }
            } catch (error) {
                console.error('[FloatingQuickAdd] Error fetching place details:', error);
                setSubmitError('Could not fetch place details.');
                setFormState((prev) => ({ ...prev, placeDetails: null }));
            } finally {
                setIsFetchingPlaceSuggestions(false);
            }
        },
        [setFormData, formState.formType, setSubmitError] // Removed placeService dependency as it's stable
    );

    // Input Change Handlers (no TS changes needed)
    const handleRestaurantInputChange = useCallback((event) => {
        handleChange(event); // Update form handler state
        // Clear place details if user modifies the restaurant input manually
        if (formState.placeDetails) {
            setFormState((prev) => ({ ...prev, placeDetails: null }));
        }
         // Trigger suggestion fetch via useEffect watching formData.restaurantInput
    }, [handleChange, formState.placeDetails]); // Added formState.placeDetails dependency

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
         // Show suggestions on focus only if there are already suggestions loaded
        if (formState.restaurantSuggestions.length > 0) {
            setShowRestaurantSuggestionsUI(true);
        }
         // Fetching is handled by the debounced useEffect on input change
    }, [formState.restaurantSuggestions.length]);

    // Submission Logic (no TS changes needed)
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
                // Use place details if available, otherwise use manual input
                location: formState.placeDetails?.formattedAddress ?? (formState.formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null),
                city: formState.placeDetails?.city ?? null,
                neighborhood: formState.placeDetails?.neighborhood ?? null,
                place_id: formState.placeDetails?.placeId ?? null,
                // Only send restaurant_name if type is dish AND no place_id was found
                restaurant_name: (formState.formType === 'dish' && !formState.placeDetails?.placeId)
                                 ? currentHookFormData.restaurantInput.trim()
                                 : null,
                tags: Array.isArray(formState.selectedTags) ? formState.selectedTags : [],
            };

            console.log('[FloatingQuickAdd] Submitting:', submissionData);
            // Assume addPendingSubmission handles success/error and returns necessary info or throws
            await addPendingSubmission(submissionData);

            // Reset UI on successful submission
            setIsMenuOpen(false); // Close the FAB menu
            resetAllState();
             // Optionally show a success toast/message here
        },
        [formState.formType, formState.selectedTags, formState.placeDetails, addPendingSubmission, resetAllState]
    );

    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        handleSubmit(performSubmit);
    }, [handleSubmit, performSubmit]);

    // Derived State (no TS changes needed)
    const filteredHashtags = useMemo(() => {
        const inputLower = formState.tagInput.trim().toLowerCase();
        if (!inputLower || isLoadingCuisines || !Array.isArray(cuisines)) return [];
        return cuisines
            .filter((cuisine) => cuisine.name.toLowerCase().includes(inputLower) && !formState.selectedTags.includes(cuisine.name.toLowerCase()))
            .map((cuisine) => cuisine.name) // Return just the name
            .slice(0, 5);
    }, [formState.tagInput, formState.selectedTags, cuisines, isLoadingCuisines]);


    // JSX Render (removed type checks/assertions, kept logic)
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
                    // Initial menu options
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
                    // Form display
                    <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                       {/* Form header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 id="fq-dialog-title" className="text-lg font-semibold text-gray-900">
                                {formState.formType === 'dish' ? 'Submit a Dish' : 'Submit a Restaurant'}
                            </h3>
                            <Button onClick={resetAllState} variant="tertiary" size="sm" className="p-1 text-gray-400 hover:text-gray-600" aria-label="Back to quick add menu">
                                <IconX size={18} />
                            </Button>
                        </div>

                        <div className="space-y-3 text-sm">
                            {/* Item Name */}
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

                            {/* Restaurant Input (for Dish) or Location Hint (for Restaurant) */}
                             <div ref={restaurantInputRef} className="relative">
                                <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">
                                    {formState.formType === 'dish' ? 'Restaurant Name*' : 'Restaurant Location (City/Neighborhood)'}
                                </label>
                                <div className="relative">
                                    <input
                                        id="fq-restaurant-name"
                                        type="text"
                                        required={formState.formType === 'dish'} // Only required for dish
                                        name="restaurantInput" // Consistent name for form state
                                        value={formData.restaurantInput}
                                        onChange={handleRestaurantInputChange}
                                        onFocus={handleRestaurantInputFocus}
                                        disabled={isSubmitting || isFetchingPlaceSuggestions}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100 pr-8"
                                        placeholder={formState.formType === 'dish' ? "Restaurant where dish is found" : "e.g., Los Angeles or Venice Beach"}
                                        autoComplete="off"
                                    />
                                     {/* Show spinner only when fetching suggestions */}
                                    {isFetchingPlaceSuggestions && (
                                        <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                                    )}
                                </div>
                                 {/* Display suggestions only for restaurants */}
                                {formState.formType === 'restaurant' && showRestaurantSuggestionsUI && Array.isArray(formState.restaurantSuggestions) && formState.restaurantSuggestions.length > 0 && (
                                    <div ref={restaurantSuggestionsRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                                        <ul>
                                            {formState.restaurantSuggestions.map((suggestion) =>
                                                suggestion?.placeId ? ( // Check suggestion validity
                                                    <li key={`rest-sugg-${suggestion.placeId}`}>
                                                        <button
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
                                                             // Use onMouseDown to prevent blur before click registers
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


                            {/* Tags Input */}
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
                                                    <IconX size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Display Place Details */}
                            {formState.placeDetails && (
                                <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                                    <p className="font-medium">Google Location Info:</p>
                                    <p>Address: {formState.placeDetails.formattedAddress || 'N/A'}</p>
                                    <p>City: {formState.placeDetails.city || 'N/A'}, Neighborhood: {formState.placeDetails.neighborhood || 'N/A'}</p>
                                </div>
                            )}

                            {/* Error and Submit Button */}
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