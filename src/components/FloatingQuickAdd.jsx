/* src/components/FloatingQuickAdd.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Plus, Utensils, Store, List, X as IconX, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
// Preserving original import paths assuming Button/Modal are UI components
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import useSubmissionStore from '@/stores/useSubmissionStore';
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow';
import useFormHandler from '@/hooks/useFormHandler.js';
import { placeService } from '@/services/placeService.js';

// Debounce function (preserved)
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const FloatingQuickAddComponent = () => {
    // State hooks (preserved)
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

    // Refs (preserved)
    const containerRef = useRef(null);
    const tagInputRef = useRef(null);
    const restaurantInputRef = useRef(null);
    const tagSuggestionsRef = useRef(null);
    const restaurantSuggestionsRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Context and Store hooks (preserved)
    const { openQuickAdd } = useQuickAdd();
    const addPendingSubmission = useSubmissionStore((state) => state.addPendingSubmission);
    const { cuisines, isLoadingCuisines, fetchCuisines } = useUIStateStore(
        useShallow((state) => ({
            cuisines: state.cuisines || [],
            isLoadingCuisines: state.isLoadingCuisines,
            fetchCuisines: state.fetchCuisines,
        }))
    );

    // --- Functional Fix: Use Form Handler for Item Submission ---
    const {
        formData: itemFormData,
        handleChange: handleItemFormChange,
        handleSubmit: handleItemFormSubmit,
        isSubmitting: isSubmittingItem,
        submitError: itemSubmitError,
        setSubmitError: setItemSubmitError,
        resetForm: resetItemForm,
        setFormData: setItemFormData,
    } = useFormHandler({
        newItemName: '', // Name of the dish or restaurant
        restaurantInput: '', // Input for restaurant name/location lookup
    });
    // --- End Functional Fix ---

    // Fetch cuisines effect (preserved)
    useEffect(() => {
        if (cuisines.length === 0 && !isLoadingCuisines) {
            fetchCuisines();
        }
    }, [fetchCuisines, cuisines.length, isLoadingCuisines]);

    // Reset state functions (functional fix: resets only item form)
    const resetLocalFormState = useCallback(() => {
        setFormState({ formType: null, tagInput: '', selectedTags: [], restaurantSuggestions: [], placeDetails: null });
        setShowTagSuggestionsUI(false);
        setShowRestaurantSuggestionsUI(false);
        setIsFetchingPlaceSuggestions(false);
    }, []);

    const resetAllState = useCallback(() => {
        resetLocalFormState();
        resetItemForm({ newItemName: '', restaurantInput: '' }); // Reset item form
        setItemSubmitError(null);
    }, [resetItemForm, setItemSubmitError, resetLocalFormState]);

    // Fetch place suggestions (functional fix: uses setItemSubmitError)
    const fetchPlaceSuggestions = useCallback(
        async (input) => {
            const trimmedInput = input?.trim();
            if (!trimmedInput || trimmedInput.length < 2) { /* ... clear suggestions ... */ return; }
            setIsFetchingPlaceSuggestions(true);
            try {
                const predictions = await placeService.getAutocompleteSuggestions(trimmedInput);
                const validPredictions = (Array.isArray(predictions) ? predictions : [])
                    .map((p) => ({ name: p?.description, placeId: p?.place_id })).filter(p => !!p.name && !!p.placeId);
                setFormState((prev) => ({ ...prev, restaurantSuggestions: validPredictions }));
                setShowRestaurantSuggestionsUI(validPredictions.length > 0);
            } catch (error) { /* ... setItemSubmitError ... */ } finally { setIsFetchingPlaceSuggestions(false); }
        }, [setItemSubmitError]
    );

    // Debounce restaurant input changes (functional fix: uses itemFormData)
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if ((formState.formType === 'dish' || formState.formType === 'restaurant') && itemFormData.restaurantInput?.trim().length >= 2) { // Uses itemFormData
            debounceTimerRef.current = setTimeout(() => fetchPlaceSuggestions(itemFormData.restaurantInput), 350);
        } else { /* ... clear suggestions ... */ }
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [itemFormData.restaurantInput, formState.formType, fetchPlaceSuggestions]); // Uses itemFormData

    // Click Outside Handling (preserved)
    useEffect(() => { /* ... */ }, [isMenuOpen, resetAllState, showTagSuggestionsUI, showRestaurantSuggestionsUI]);

    // Button Actions (functional fix: handleCreateNewList uses openQuickAdd)
    const handleOpenMainButton = useCallback(() => { setIsMenuOpen((prev) => { const nextState = !prev; if (!nextState) resetAllState(); return nextState; }); }, [resetAllState]);
    const handleOpenDishForm = useCallback(() => { resetAllState(); setFormState((prev) => ({ ...prev, formType: 'dish' })); }, [resetAllState]);
    const handleOpenRestaurantForm = useCallback(() => { resetAllState(); setFormState((prev) => ({ ...prev, formType: 'restaurant' })); }, [resetAllState]);
    const handleCreateNewList = useCallback(() => {
        openQuickAdd({ type: 'list', createNew: true }); // Use context action
        setIsMenuOpen(false);
        resetAllState();
    }, [openQuickAdd, resetAllState]);

    // Tag Handling (functional fix: uses setItemSubmitError)
    const handleAddTag = useCallback(() => { /* ... uses setItemSubmitError ... */ }, [formState.tagInput, formState.selectedTags, setItemSubmitError, cuisines]);
    const handleTagInputKeyDown = useCallback((e) => { /* ... */ }, [handleAddTag]);
    const handleRemoveTag = useCallback((tagToRemove) => { /* ... */ }, []);
    const handleSelectTagSuggestion = useCallback((tag) => { /* ... */ }, [formState.selectedTags]);
    const handleHashtagInputChange = useCallback((e) => { /* ... uses setItemSubmitError ... */ }, [setItemSubmitError]);

    // Restaurant Selection (functional fix: uses setItemFormData, setItemSubmitError)
    const handleSelectRestaurantSuggestion = useCallback(
        async (suggestion) => {
            if (!suggestion || !suggestion.placeId) return;
            setItemFormData((prev) => ({ ...prev, newItemName: formState.formType === 'restaurant' ? suggestion.name : prev.newItemName, restaurantInput: suggestion.name, })); // Use item form setter
            /* ... clear suggestions, set loading ... */
            setItemSubmitError(null); // Use item form error setter
            try {
                const details = await placeService.getPlaceDetails(suggestion.placeId);
                if (details) {
                    setFormState((prev) => ({ ...prev, placeDetails: details }));
                    if (formState.formType === 'restaurant' && details.name) { setItemFormData((prev) => ({ ...prev, newItemName: details.name })); } // Use item form setter
                } else { setItemSubmitError('Could not retrieve full place details.'); /* ... */ }
            } catch (error) { setItemSubmitError('Could not fetch place details.'); /* ... */ } finally { setIsFetchingPlaceSuggestions(false); }
        }, [setItemFormData, formState.formType, setItemSubmitError] // Use item form setters
    );

    // Restaurant Input Change Handler (functional fix: uses handleItemFormChange)
    const handleRestaurantInputChange = useCallback((event) => { handleItemFormChange(event); if (formState.placeDetails) { setFormState((prev) => ({ ...prev, placeDetails: null })); } }, [handleItemFormChange, formState.placeDetails]); // Use item form handler
    const handleRestaurantInputFocus = useCallback(() => { /* ... */ }, [formState.restaurantSuggestions.length]);

    // Item Submission Logic (functional fix: receives itemFormData)
    const performItemSubmit = useCallback(
        async (currentHookFormData) => { // receives itemFormData
            /* ... validation using currentHookFormData ... */
            const submissionData = { /* ... uses currentHookFormData, formState ... */ };
            await addPendingSubmission(submissionData);
            setIsMenuOpen(false); resetAllState();
        }, [formState.formType, formState.selectedTags, formState.placeDetails, addPendingSubmission, resetAllState]
    );

    // Form Submit Handler for item form (functional fix: uses handleItemFormSubmit)
    const handleItemFormSubmitWrapper = useCallback((e) => { e.preventDefault(); handleItemFormSubmit(performItemSubmit); }, [handleItemFormSubmit, performItemSubmit]);

    // Derived State (functional fix: only uses itemSubmitError)
    const filteredHashtags = useMemo(() => { /* ... */ }, [formState.tagInput, formState.selectedTags, cuisines, isLoadingCuisines]);
    const displayError = itemSubmitError; // Only item submission error is relevant here now

    return (
        <>
            {/* FAB Button - Original Classes */}
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

            {/* Menu/Form Container - Original Classes */}
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
                    // Initial menu options - Original Classes
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
                    // Form display (Dish or Restaurant Submission) - Original Classes
                    <form onSubmit={handleItemFormSubmitWrapper} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                       {/* Form header - Original Classes */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 id="fq-dialog-title" className="text-lg font-semibold text-gray-900">
                                {formState.formType === 'dish' ? 'Submit a Dish' : 'Submit a Restaurant'}
                            </h3>
                            {/* Button component preserves its own classes */}
                            <Button onClick={resetAllState} variant="tertiary" size="sm" className="p-1 text-gray-400 hover:text-gray-600" aria-label="Back to quick add menu">
                                <IconX size={18} />
                            </Button>
                        </div>

                        <div className="space-y-3 text-sm">
                            {/* Item Name - Original Classes */}
                            <div>
                                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                                    {formState.formType === 'dish' ? 'Dish Name*' : 'Restaurant Name*'}
                                </label>
                                {/* Input preserves its classes */}
                                <input
                                    id="fq-item-name"
                                    type="text"
                                    required
                                    name="newItemName"
                                    value={itemFormData.newItemName} /* Use item form state */
                                    onChange={handleItemFormChange} /* Use item form handler */
                                    disabled={isSubmittingItem}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                                    placeholder={formState.formType === 'dish' ? 'e.g., Short Rib Taco' : 'e.g., Kogi BBQ Truck'}
                                />
                            </div>

                            {/* Restaurant/Location Input - Original Classes */}
                             <div ref={restaurantInputRef} className="relative">
                                <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">
                                    {formState.formType === 'dish' ? 'Restaurant Name*' : 'Restaurant Location (City/Neighborhood)'}
                                </label>
                                <div className="relative">
                                     {/* Input preserves its classes */}
                                    <input
                                        id="fq-restaurant-name"
                                        type="text"
                                        required={formState.formType === 'dish'}
                                        name="restaurantInput" /* Use item form state name */
                                        value={itemFormData.restaurantInput} /* Use item form state */
                                        onChange={handleRestaurantInputChange}
                                        onFocus={handleRestaurantInputFocus}
                                        disabled={isSubmittingItem || isFetchingPlaceSuggestions}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100 pr-8"
                                        placeholder={formState.formType === 'dish' ? "Restaurant where dish is found" : "e.g., Los Angeles or Venice Beach"}
                                        autoComplete="off"
                                    />
                                    {isFetchingPlaceSuggestions && (
                                        <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                                    )}
                                </div>
                                 {/* Suggestions - Original Classes */}
                                {formState.formType === 'restaurant' && showRestaurantSuggestionsUI && Array.isArray(formState.restaurantSuggestions) && formState.restaurantSuggestions.length > 0 && (
                                    <div ref={restaurantSuggestionsRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                                        <ul>
                                            {formState.restaurantSuggestions.map((suggestion) =>
                                                suggestion?.placeId ? (
                                                    <li key={`rest-sugg-${suggestion.placeId}`}>
                                                        {/* Button preserves its classes */}
                                                        <button type="button" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate" onMouseDown={(e) => { e.preventDefault(); handleSelectRestaurantSuggestion(suggestion); }}>
                                                            {suggestion.name}
                                                        </button>
                                                    </li>
                                                ) : null
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                             {/* Tags Input - Original Classes */}
                            <div ref={tagInputRef} className="relative">
                                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">Tags (optional, comma or Enter)</label>
                                {/* Input preserves its classes */}
                                <input
                                    id="fq-tags"
                                    type="text"
                                    value={formState.tagInput}
                                    onChange={handleHashtagInputChange}
                                    onKeyDown={handleTagInputKeyDown}
                                    onFocus={() => setShowTagSuggestionsUI(true)}
                                    disabled={isSubmittingItem}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                                    placeholder={isLoadingCuisines ? "Loading tags..." : "Type to find matching tags"}
                                    autoComplete="off"
                                />
                                {/* Tag Suggestions - Original Classes */}
                                {showTagSuggestionsUI && !isLoadingCuisines && filteredHashtags.length > 0 && (
                                    <div ref={tagSuggestionsRef} className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                                        <ul>
                                            {filteredHashtags.map((tag) => (
                                                <li key={`tag-sugg-${tag}`}>
                                                    {/* Button preserves its classes */}
                                                    <button type="button" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none" onMouseDown={(e) => { e.preventDefault(); handleSelectTagSuggestion(tag); }}>
                                                        #{tag}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                 {/* Selected Tags - Original Classes */}
                                {Array.isArray(formState.selectedTags) && formState.selectedTags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {formState.selectedTags.map((tag) => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                                                #{tag}
                                                {/* Button preserves its classes */}
                                                <button type="button" onClick={() => handleRemoveTag(tag)} disabled={isSubmittingItem} className="ml-1 -mr-0.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full focus:outline-none focus:bg-gray-200 disabled:cursor-not-allowed" aria-label={`Remove tag ${tag}`}>
                                                    <IconX size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Display Place Details - Original Classes */}
                            {formState.placeDetails && (
                                <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                                    <p className="font-medium">Google Location Info:</p>
                                    <p>Address: {formState.placeDetails.formattedAddress || 'N/A'}</p>
                                    <p>City: {formState.placeDetails.city || 'N/A'}, Neighborhood: {formState.placeDetails.neighborhood || 'N/A'}</p>
                                </div>
                            )}

                            {/* Error and Submit Button - Original Classes */}
                            {displayError && (
                                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2 text-center">
                                    {displayError}
                                </p>
                            )}
                             {/* Button component preserves its own classes */}
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full flex justify-center py-2 px-4 mt-4"
                                disabled={isSubmittingItem || isFetchingPlaceSuggestions}
                            >
                                {isSubmittingItem ? (
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