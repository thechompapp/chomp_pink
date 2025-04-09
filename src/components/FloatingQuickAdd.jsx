/* src/components/FloatingQuickAdd.jsx */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button.jsx';
// Corrected: Use named import for useSubmissionStore
import useSubmissionStore from '@/stores/useSubmissionStore';
// Corrected: Use named import for useUIStateStore
import { useUIStateStore } from '@/stores/useUIStateStore';
import { useShallow } from 'zustand/react/shallow'; // Import useShallow
import useFormHandler from '@/hooks/useFormHandler';
import { placeService } from '@/services/placeService';

const FloatingQuickAddComponent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formState, setFormState] = useState({
    formType: null, // 'dish', 'restaurant', or null
    tagInput: '',
    selectedTags: [],
    restaurantSuggestions: [],
    placeDetails: null, // To store details fetched from Google Places API
  });
  const [isFetchingPlaceSuggestions, setIsFetchingPlaceSuggestions] = useState(false);
  const [showTagSuggestionsUI, setShowTagSuggestionsUI] = useState(false);
  const [showRestaurantSuggestionsUI, setShowRestaurantSuggestionsUI] = useState(false);

  const containerRef = useRef(null);
  const tagInputRef = useRef(null);
  const restaurantInputRef = useRef(null);
  const debounceTimerRef = useRef(null); // For debouncing place suggestions fetch

  // Context and Store Hooks
  const { openQuickAdd } = useQuickAdd();
  // Use named import correctly
  const addPendingSubmission = useSubmissionStore((state) => state.addPendingSubmission);
  // Use shallow compare for object selection from UI store
  const { cuisines, isLoadingCuisines } = useUIStateStore(
    useShallow((state) => ({
        cuisines: state.cuisines || [],
        isLoadingCuisines: state.isLoadingCuisines,
    }))
  );

  // Form handling hook
  const { formData, handleChange, handleSubmit, isSubmitting, submitError, setSubmitError, resetForm, setFormData } =
    useFormHandler({ newItemName: '', restaurantInput: '' }); // Initial form values

  // --- State Reset Logic ---
  const resetLocalFormState = useCallback(() => {
    setFormState({ formType: null, tagInput: '', selectedTags: [], restaurantSuggestions: [], placeDetails: null });
    setShowTagSuggestionsUI(false);
    setShowRestaurantSuggestionsUI(false);
    setIsFetchingPlaceSuggestions(false);
  }, []);

  const resetAllState = useCallback(() => {
    resetLocalFormState();
    resetForm(); // Reset form handler state
    setSubmitError(null); // Clear submission errors
  }, [resetForm, setSubmitError, resetLocalFormState]);

  // --- Place Suggestions Logic ---
  const fetchPlaceSuggestions = useCallback(
    async (input) => {
      if (!input || input.trim().length < 2) {
        setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
        setShowRestaurantSuggestionsUI(false);
        return;
      }
      setIsFetchingPlaceSuggestions(true);
      try {
        const predictions = await placeService.getAutocompleteSuggestions(input);
        setFormState((prev) => ({
          ...prev,
          // Ensure predictions is an array and map correctly
          restaurantSuggestions: (Array.isArray(predictions) ? predictions : [])
            .map((p) => ({ name: p?.description, placeId: p?.place_id }))
            .filter((p) => p.name && p.placeId), // Filter out invalid suggestions
        }));
        setShowRestaurantSuggestionsUI(predictions && predictions.length > 0);
      } catch (error) {
        console.error('[FloatingQuickAdd] Error fetching place suggestions:', error);
        setSubmitError('Failed to load restaurant suggestions.');
        setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
        setShowRestaurantSuggestionsUI(false);
      } finally {
        setIsFetchingPlaceSuggestions(false);
      }
    },
    [setSubmitError] // Dependency on setSubmitError
  );

  // Debounce place suggestion fetching for restaurant input
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    // Only fetch if it's a dish form and input has length
    if (formState.formType === 'dish' && formData.restaurantInput && formData.restaurantInput.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => fetchPlaceSuggestions(formData.restaurantInput), 350);
    } else {
        // Clear suggestions if input is too short or form type changes
        setFormState((prev) => ({ ...prev, restaurantSuggestions: [] }));
        setShowRestaurantSuggestionsUI(false);
    }
    // Cleanup timer on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData.restaurantInput, formState.formType, fetchPlaceSuggestions]);


  // --- Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      const fabButton = document.getElementById('floating-quick-add-button');
      const mainContainer = containerRef.current;

      // Close main menu if clicking outside FAB and menu container
      if (mainContainer && !mainContainer.contains(event.target) && !(fabButton && fabButton.contains(event.target))) {
        if (isMenuOpen) {
          setIsMenuOpen(false);
          resetAllState(); // Reset everything when menu closes
        }
      }
      // Handle closing suggestion dropdowns if clicking outside them specifically
      else if (mainContainer && mainContainer.contains(event.target)) {
        const tagSuggestionsList = mainContainer.querySelector('#fq-tag-suggestions');
        if (
          showTagSuggestionsUI &&
          tagInputRef.current &&
          !tagInputRef.current.contains(event.target) &&
          !(tagSuggestionsList && tagSuggestionsList.contains(event.target))
        ) {
          setShowTagSuggestionsUI(false);
        }

        const restaurantSuggestionsList = mainContainer.querySelector('#fq-restaurant-suggestions');
        if (
          showRestaurantSuggestionsUI &&
          restaurantInputRef.current &&
          !restaurantInputRef.current.contains(event.target) &&
          !(restaurantSuggestionsList && restaurantSuggestionsList.contains(event.target))
        ) {
          setShowRestaurantSuggestionsUI(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, resetAllState, showTagSuggestionsUI, showRestaurantSuggestionsUI]); // Dependencies


  // --- Menu/Form Open/Close Handlers ---
  const handleOpenMainButton = useCallback(() => {
    setIsMenuOpen((prev) => {
      const nextState = !prev;
      // Reset state only when closing the menu
      if (!nextState) resetAllState();
      return nextState;
    });
  }, [resetAllState]);

  const handleOpenDishForm = useCallback(() => {
    resetAllState(); // Reset everything before opening a specific form
    setFormState((prev) => ({ ...prev, formType: 'dish' }));
  }, [resetAllState]);

  const handleOpenRestaurantForm = useCallback(() => {
    resetAllState();
    setFormState((prev) => ({ ...prev, formType: 'restaurant' }));
  }, [resetAllState]);

  const handleCreateNewList = useCallback(() => {
    if (openQuickAdd) {
        // Trigger the main QuickAddPopup in create mode
      openQuickAdd({ type: 'list', createNew: true });
    }
    setIsMenuOpen(false); // Close this FAB menu
    resetAllState();
  }, [openQuickAdd, resetAllState]);

  // --- Tag Input Handlers ---
  const handleAddTag = useCallback(() => {
    const newTag = formState.tagInput.trim().toLowerCase();
    if (!newTag) return; // Ignore empty input

    if (formState.selectedTags.includes(newTag)) {
      setSubmitError(`Tag "${newTag}" already added.`);
      setFormState((prev) => ({ ...prev, tagInput: '' })); // Clear input
      return;
    }

    // Validate against available cuisines
    const isValidCuisine = cuisines.some((c) => c.name.toLowerCase() === newTag);
    if (isValidCuisine) {
      setFormState((prev) => ({ ...prev, selectedTags: [...prev.selectedTags, newTag], tagInput: '' }));
      setShowTagSuggestionsUI(false); // Hide suggestions after adding
      setSubmitError(null); // Clear any previous error
    } else {
      setSubmitError(`"${formState.tagInput.trim()}" is not a recognized tag.`);
    }
  }, [formState.tagInput, formState.selectedTags, setSubmitError, cuisines]);

  const handleTagInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault(); // Prevent form submission on Enter
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const handleRemoveTag = useCallback(
    (tagToRemove) => {
      setFormState((prev) => ({ ...prev, selectedTags: prev.selectedTags.filter((tag) => tag !== tagToRemove) }));
    },
    [] // No dependencies
  );

   const handleSelectTagSuggestion = useCallback(
    (tag) => {
      if (tag && !formState.selectedTags.includes(tag)) {
        setFormState((prev) => ({ ...prev, selectedTags: [...prev.selectedTags, tag], tagInput: '' }));
      } else {
         // If tag already selected or invalid, just clear input
         setFormState((prev) => ({ ...prev, tagInput: '' }));
      }
      setShowTagSuggestionsUI(false); // Hide suggestions after selection
    },
    [formState.selectedTags]
  );

  // --- Restaurant Input Handlers ---
   const handleSelectRestaurantSuggestion = useCallback(
    async (suggestion) => {
      if (!suggestion || !suggestion.placeId) return;

      // Set the input field immediately for better UX
      setFormData((prev) => ({
        ...prev,
        // Only set item name if it's a restaurant form, otherwise keep dish name
        newItemName: formState.formType === 'restaurant' ? suggestion.name : prev.newItemName,
        restaurantInput: suggestion.name,
      }));
      setShowRestaurantSuggestionsUI(false); // Hide suggestions
      setFormState((prev) => ({ ...prev, restaurantSuggestions: [] })); // Clear suggestions data

      // Fetch and set details
      setIsFetchingPlaceSuggestions(true); // Show loading specifically for details fetch
      setFormState((prev) => ({ ...prev, placeDetails: null })); // Clear old details
      setSubmitError(null); // Clear previous errors

      try {
        const details = await placeService.getPlaceDetails(suggestion.placeId);
        // Validate details structure before setting
        if (details && typeof details === 'object') {
          setFormState((prev) => ({ ...prev, placeDetails: details }));
           // If it's a restaurant form and name wasn't set before, update it from details
          if (formState.formType === 'restaurant' && !formData.newItemName) {
             setFormData((prev) => ({ ...prev, newItemName: details.name || suggestion.name }));
          }
        } else {
          throw new Error('Received invalid details object from place service.');
        }
      } catch (error) {
        console.error('[FloatingQuickAdd] Error fetching/setting place details:', error);
        setSubmitError('Could not fetch place details.');
        setFormState((prev) => ({ ...prev, placeDetails: null })); // Clear details on error
      } finally {
        setIsFetchingPlaceSuggestions(false); // Finish loading state
      }
    },
    [setFormData, formState.formType, setSubmitError, formData.newItemName]
  );

  // Clear place details if user manually edits restaurant input after selecting a suggestion
  const handleRestaurantInputChange = (event) => {
    handleChange(event); // Update form data
    if (formState.placeDetails) {
         setFormState((prev) => ({ ...prev, placeDetails: null })); // Clear details
    }
  };

  // Show suggestions on focus or refetch if needed
   const handleRestaurantInputFocus = () => {
    // Show existing suggestions immediately
     if (formState.restaurantSuggestions.length > 0) {
        setShowRestaurantSuggestionsUI(true);
     }
     // Fetch suggestions if input meets criteria
     if (formData.restaurantInput && formData.restaurantInput.trim().length >= 2) {
        fetchPlaceSuggestions(formData.restaurantInput);
     }
   };


  // --- Form Submission Logic ---
  const performSubmit = useCallback(
    async (currentHookFormData) => {
      // Add validation checks specific to this form
      if (!currentHookFormData?.newItemName?.trim()) {
          throw new Error('Please provide a name.');
      }
      if (formState.formType === 'dish' && !currentHookFormData?.restaurantInput?.trim()) {
          throw new Error('Please provide the restaurant name for the dish.');
      }

      // Construct payload for submission service
      const submissionData = {
        type: formState.formType, // 'dish' or 'restaurant'
        name: currentHookFormData.newItemName.trim(),
        // Use place details if available, otherwise use input/null
        location: formState.placeDetails?.formattedAddress ?? (formState.formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null),
        city: formState.placeDetails?.city ?? null,
        neighborhood: formState.placeDetails?.neighborhood ?? null,
        place_id: formState.placeDetails?.placeId ?? null,
        // Include restaurant name specifically for dish type if no place details were used
        restaurant_name: formState.formType === 'dish' && !formState.placeDetails?.placeId
                          ? currentHookFormData.restaurantInput.trim()
                          : null,
        tags: Array.isArray(formState.selectedTags) ? formState.selectedTags : [],
      };

      console.log('[FloatingQuickAdd] Submitting:', submissionData);
      // Call the action from the submission store
      await addPendingSubmission(submissionData);

      // Reset UI on successful submission
      setIsMenuOpen(false); // Close the FAB menu
      resetAllState(); // Reset local form state and form handler state
      // Optionally show a success toast/message here
    },
    [formState.formType, formState.selectedTags, formState.placeDetails, addPendingSubmission, resetAllState]
  );

  // Wrapper for handleSubmit from useFormHandler
  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      // Pass the performSubmit logic to the hook's handleSubmit
      handleSubmit(performSubmit);
    },
    [handleSubmit, performSubmit]
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="floating-quick-add-button"
        onClick={handleOpenMainButton}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50"
        aria-label={isMenuOpen ? 'Close quick add menu' : 'Open quick add menu'}
        aria-expanded={isMenuOpen}
        aria-controls="quick-add-menu"
      >
        {/* Icon changes based on open state */}
        <Plus size={28} className={`transition-transform duration-200 ease-in-out ${isMenuOpen ? 'transform rotate-45' : ''}`} />
      </button>

      {/* Menu/Form Container */}
      <div
        id="quick-add-menu"
        ref={containerRef}
        className={`fixed bottom-24 right-6 w-[340px] z-40 transition-all duration-300 ease-in-out transform ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
        aria-labelledby="fq-dialog-title"
      >
        {/* Conditional Rendering: Menu or Form */}
        {!formState.formType ? (
          // Initial Menu View
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
          // Form View (Dish or Restaurant)
          <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
             {/* Form Header */}
             <div className="flex items-center justify-between mb-4">
               <h3 id="fq-dialog-title" className="text-lg font-semibold text-gray-900">
                 {formState.formType === 'dish' ? 'Submit a Dish' : 'Submit a Restaurant'}
               </h3>
               {/* Back Button */}
               <Button onClick={resetAllState} variant="tertiary" size="sm" className="p-1 text-gray-400 hover:text-gray-600" aria-label="Back to quick add menu">
                 <X size={18} />
               </Button>
             </div>

              {/* Form Fields */}
             <div className="space-y-3 text-sm">
               {/* Name Input */}
                <div>
                  <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                    {formState.formType === 'dish' ? 'Dish Name*' : 'Restaurant Name*'}
                  </label>
                  <input
                    id="fq-item-name" type="text" required name="newItemName"
                    value={formData.newItemName} onChange={handleChange} disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                    placeholder={formState.formType === 'dish' ? 'e.g., Short Rib Taco' : 'e.g., Kogi BBQ Truck'}
                  />
                </div>

                 {/* Restaurant Input (only for dish form) */}
                {formState.formType === 'dish' && (
                  <div ref={restaurantInputRef} className="relative">
                    <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">Restaurant Name*</label>
                     <div className="relative">
                         <input
                             id="fq-restaurant-name" type="text" required name="restaurantInput"
                             value={formData.restaurantInput} onChange={handleRestaurantInputChange}
                             onFocus={handleRestaurantInputFocus}
                             disabled={isSubmitting || isFetchingPlaceSuggestions}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100 pr-8" // Added pr-8 for loader space
                             placeholder="Start typing..." autoComplete="off"
                         />
                         {isFetchingPlaceSuggestions && (
                             <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                         )}
                     </div>
                     {/* Restaurant Suggestions Dropdown */}
                      {showRestaurantSuggestionsUI && Array.isArray(formState.restaurantSuggestions) && formState.restaurantSuggestions.length > 0 && (
                         <div id="fq-restaurant-suggestions" className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                             <ul>
                                 {formState.restaurantSuggestions.map((suggestion, index) =>
                                     suggestion?.placeId ? ( // Ensure suggestion and placeId exist
                                         <li key={`rest-sugg-${suggestion.placeId}`}>
                                             <button type="button"
                                                 className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
                                                 // Use onMouseDown to prevent input blur before click registers
                                                 onMouseDown={(e) => { e.preventDefault(); handleSelectRestaurantSuggestion(suggestion); }}
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

                 {/* Tag Input */}
                <div ref={tagInputRef} className="relative">
                  <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">Tags (optional, comma or Enter)</label>
                   <input
                       id="fq-tags" type="text"
                       value={formState.tagInput} onChange={handleHashtagInputChange}
                       onKeyDown={handleTagInputKeyDown} onFocus={() => setShowTagSuggestionsUI(true)}
                       disabled={isSubmitting}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:bg-gray-100"
                       placeholder={isLoadingCuisines ? "Loading tags..." : "Type to find matching tags"} autoComplete="off"
                   />
                    {/* Tag Suggestions Dropdown */}
                   {showTagSuggestionsUI && !isLoadingCuisines && filteredHashtags.length > 0 && (
                       <div id="fq-tag-suggestions" className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                           <ul>
                               {filteredHashtags.map((tag) =>(
                                   <li key={`tag-sugg-${tag}`}>
                                       <button type="button"
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
                   {/* Selected Tags Display */}
                    {Array.isArray(formState.selectedTags) && formState.selectedTags.length > 0 && (
                       <div className="mt-2 flex flex-wrap gap-1">
                           {formState.selectedTags.map((tag) => (
                               <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                                   #{tag}
                                   <button type="button" onClick={() => handleRemoveTag(tag)} disabled={isSubmitting}
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

                {/* Display Fetched Place Details (Optional) */}
                 {formState.placeDetails && (
                     <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                         <p><strong>Selected Location:</strong> {formState.placeDetails.formattedAddress}</p>
                         <p><strong>City:</strong> {formState.placeDetails.city || 'N/A'}, <strong>Neighborhood:</strong> {formState.placeDetails.neighborhood || 'N/A'}</p>
                     </div>
                 )}


                {/* Submission Error Display */}
                {submitError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2 text-center">
                    {submitError}
                  </p>
                )}

                 {/* Submit Button */}
                <Button
                  type="submit" variant="primary"
                  className="w-full flex justify-center py-2 px-4 mt-4"
                  disabled={isSubmitting || isFetchingPlaceSuggestions} // Disable if submitting or fetching place details
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