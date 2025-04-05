// src/components/FloatingQuickAdd.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send, User } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import useSubmissionStore from '@/stores/useSubmissionStore';
import useUIStateStore from '@/stores/useUIStateStore';
import useFormHandler from '@/hooks/useFormHandler';
import apiClient from '@/utils/apiClient'; // Import apiClient

const FloatingQuickAdd = () => {
  // --- State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formType, setFormType] = useState(null); // null | 'dish' | 'restaurant'
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const fetchAttemptedRef = useRef(false); // Prevent multiple fetches for cuisines

  // State for autocomplete suggestions
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [restaurantSuggestions, setRestaurantSuggestions] = useState([]);
  const [showRestaurantSuggestions, setShowRestaurantSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false); // Loading for suggestions

  // Refs for click-away listeners
  const containerRef = useRef(null); // Ref for the main floating container
  const tagInputRef = useRef(null);
  const restaurantInputRef = useRef(null);

  // --- Hooks and Store Selections ---
  const { openQuickAdd } = useQuickAdd(); // Context hook for opening list quick add
  const { addPendingSubmission } = useSubmissionStore(); // Store action for submitting

  // Select UI store data and actions using individual selectors
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);
  const cuisines = useUIStateStore(state => state.cuisines); // Cuisines are used as tag suggestions

  // Initialize Form Handler hook
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting, // Submission loading state from hook
    submitError, // Submission error from hook
    setSubmitError,
    resetForm: resetHookForm,
    setFormData // Allow direct setting for autocomplete selection
  } = useFormHandler({
    newItemName: '',
    restaurantInput: '', // Separate input field for restaurant name/search
    placeId: null, // Store Google Place ID if selected
  });

  // --- Effects ---

  // Fetch cuisines (used for tag suggestions) only once on mount if needed
  useEffect(() => {
     if (!fetchAttemptedRef.current && cuisines.length === 0 && !isLoadingCuisines) {
       fetchAttemptedRef.current = true; // Mark as attempted
       fetchCuisines().catch(err => console.error('[FloatingQuickAdd] Initial cuisine fetch failed:', err));
     }
  // Run once on mount or if fetchCuisines changes (should be stable)
  }, [fetchCuisines, isLoadingCuisines, cuisines.length]);

  // Update tag suggestions based on input
  useEffect(() => {
    if (tagInput && tagInput.trim().length > 0) {
      const filtered = cuisines
        .filter(cuisine => cuisine.name.toLowerCase().includes(tagInput.toLowerCase()))
        .map(cuisine => cuisine.name); // Suggest only the name
      setTagSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  }, [tagInput, cuisines]); // Rerun when input or cuisine list changes

  // Function to fetch Google Place Autocomplete suggestions
  // Wrapped in useCallback for stability if passed as prop or dependency
  const fetchPlaceSuggestions = useCallback(async (input) => {
    if (!input || input.trim().length < 2) {
      setRestaurantSuggestions([]);
      setShowRestaurantSuggestions(false);
      return;
    }
    setIsFetchingSuggestions(true); // Indicate loading suggestions
    try {
        // Use apiClient for consistency, although this is a GET request
        const data = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetch Place Suggestions') || [];

        const predictions = data.map(prediction => ({
            name: prediction.description, // Google provides full description
            placeId: prediction.place_id
        }));
        setRestaurantSuggestions(predictions);
        setShowRestaurantSuggestions(predictions.length > 0);
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      setRestaurantSuggestions([]);
      setShowRestaurantSuggestions(false);
      // Optionally set a local error state for suggestion fetching
    } finally {
      setIsFetchingSuggestions(false); // Stop loading suggestions
    }
  }, []); // apiClient should be stable

  // Debounce restaurant input for autocomplete API calls
  useEffect(() => {
    // Only run debounce if the restaurant input has focus or value
    if (document.activeElement === restaurantInputRef.current || formData.restaurantInput) {
        const timer = setTimeout(() => {
             if (formData.restaurantInput && formData.restaurantInput.trim().length >= 2) {
                 fetchPlaceSuggestions(formData.restaurantInput);
             } else {
                  setRestaurantSuggestions([]); // Clear suggestions if input is too short
                  setShowRestaurantSuggestions(false);
             }
         }, 300); // 300ms debounce timer
        return () => clearTimeout(timer); // Cleanup timer on unmount or input change
    } else {
         // If input loses focus and is empty, clear suggestions immediately
         if (!formData.restaurantInput) {
             setRestaurantSuggestions([]);
             setShowRestaurantSuggestions(false);
         }
    }
  }, [formData.restaurantInput, fetchPlaceSuggestions]); // Rerun debounce on input change

  // Click away listener to close suggestion dropdowns and the main menu/form
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close main menu/form if click is outside the container
      if (isMenuOpen && containerRef.current && !containerRef.current.contains(event.target) && event.target !== document.querySelector('.fixed.bottom-6.right-6 button')) { // Exclude the FAB itself
         closeMenuAndForm();
      }
      // Close tag suggestions if click is outside the tag input area
      if (showTagSuggestions && tagInputRef.current && !tagInputRef.current.contains(event.target)) {
        setShowTagSuggestions(false);
      }
       // Close restaurant suggestions if click is outside the restaurant input area
      if (showRestaurantSuggestions && restaurantInputRef.current && !restaurantInputRef.current.contains(event.target)) {
        setShowRestaurantSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  // Dependency on state values to re-evaluate listener if needed
  }, [isMenuOpen, showTagSuggestions, showRestaurantSuggestions]); // Removed closeMenuAndForm from deps as it causes loops


  // --- Reset/Close Logic ---
  // Stable callback using resetForm from useFormHandler
  const resetAllFormState = useCallback(() => {
    resetHookForm({ // Reset to initial empty state
        newItemName: '',
        restaurantInput: '',
        placeId: null,
    });
    setTagInput("");
    setSelectedTags([]);
    setSubmitError(null); // Clear hook's error state
    setShowTagSuggestions(false);
    setShowRestaurantSuggestions(false);
  }, [resetHookForm, setSubmitError]); // Stable dependencies

  // Stable callback to close everything
  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    setFormType(null);
    resetAllFormState();
  }, [resetAllFormState]); // Depends on the stable reset function


  // --- Action Button Handlers (Wrapped in useCallback) ---
  const handleOpenMainButton = useCallback(() => {
     setIsMenuOpen((prev) => {
         const nextIsOpen = !prev;
         if (!nextIsOpen) {
             closeMenuAndForm(); // Use stable close function
         } else {
             setFormType(null); // Reset form type when opening menu
         }
         return nextIsOpen;
     });
   }, [closeMenuAndForm]); // Depends on stable close function

  const handleOpenDishForm = useCallback(() => { resetAllFormState(); setFormType("dish"); }, [resetAllFormState]);
  const handleOpenRestaurantForm = useCallback(() => { resetAllFormState(); setFormType("restaurant"); }, [resetAllFormState]);
  // For creating a list, use the context's openQuickAdd
  const handleCreateNewList = useCallback(() => {
      openQuickAdd({ type: 'list', createNew: true }); // Use context function
      closeMenuAndForm(); // Close this component's UI
  }, [openQuickAdd, closeMenuAndForm]);


  // --- Tag Handling (Wrapped in useCallback) ---
  const handleAddTag = useCallback(() => {
    const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-'); // Sanitize tag
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
      setTagInput(""); // Clear input after adding
      setSubmitError(null); // Clear error on successful add
       setShowTagSuggestions(false); // Hide suggestions after adding
    } else if (newTag && selectedTags.includes(newTag)) {
      setSubmitError(`Tag "${newTag}" already added.`); // Show error if duplicate
      setTagInput(""); // Still clear input
    } else if (!newTag) {
       // Maybe clear suggestions if input is empty and enter pressed?
        setShowTagSuggestions(false);
    }
  }, [tagInput, selectedTags, setSubmitError]); // Dependencies

  // Needs to be defined outside useCallback if used directly as event handler prop
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(); // Call the memoized handler
    }
  };

  const handleRemoveTag = useCallback((tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []); // No dependencies needed

  // Tag suggestion selection
  const handleSelectTagSuggestion = useCallback((tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput(""); // Clear input
    setShowTagSuggestions(false); // Hide suggestions
  }, [selectedTags]); // Depends on selectedTags


  // Restaurant suggestion selection
  const handleSelectRestaurantSuggestion = useCallback((restaurant) => {
     // Use setFormData provided by useFormHandler for consistency
     setFormData(prev => ({
         ...prev,
         restaurantInput: restaurant.name, // Set input value to the selected name
         placeId: restaurant.placeId // Store the placeId
     }));
    setShowRestaurantSuggestions(false); // Hide suggestions
  }, [setFormData]); // Depends on stable setFormData


  // --- Submit Handler (Passed to useFormHandler's handleSubmit) ---
  // Wrapped in useCallback for stability if needed elsewhere
  const performSubmit = useCallback(async (currentHookFormData) => {
    // Validation within the submission logic
    if (!currentHookFormData.newItemName?.trim()) {
      throw new Error("Please provide a name."); // Throws error for handleSubmit to catch
    }
    if (formType === "dish" && !currentHookFormData.restaurantInput?.trim()) {
      throw new Error("Please provide the restaurant name for the dish.");
    }

    try {
      const submissionData = {
        type: formType,
        name: currentHookFormData.newItemName.trim(),
        // Use restaurantInput as location for dish, null for restaurant
        location: formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null,
        // Potentially fetch city/neighborhood based on placeId if needed for submission
        // const details = await fetchPlaceDetails(currentHookFormData.placeId);
        // city: details?.city,
        // neighborhood: details?.neighborhood,
        tags: selectedTags,
        place_id: currentHookFormData.placeId || null, // Send placeId if available
      };
      console.log('[FloatingQuickAdd] Submitting data:', submissionData);
      await addPendingSubmission(submissionData); // Call store action
      closeMenuAndForm(); // Close and reset form on successful submission
       // Optionally show success message
       alert('Submission successful!'); // Temporary feedback

    } catch (error) {
      // Error is caught by handleSubmit, no need to setSubmitError here
      console.error('[FloatingQuickAdd] Submission error caught by performSubmit:', error);
      // Re-throw the error for handleSubmit to handle setting the error state
      throw error;
    }
  // Dependencies for the submission logic itself
  }, [formType, selectedTags, addPendingSubmission, closeMenuAndForm]);


  // Wrapper for the form's onSubmit event to use the hook's handler
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    handleSubmit(performSubmit); // Pass the actual submission logic to the hook
  }, [handleSubmit, performSubmit]); // Depends on hook's handleSubmit and our logic


  // --- Render ---
  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
          onClick={handleOpenMainButton}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50"
          aria-label={isMenuOpen ? "Close quick add menu" : "Open quick add menu"}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
      >
        {/* Animate icon transition */}
        <span className={`transform transition-transform duration-200 ease-in-out ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`}>
             <Plus size={28} />
        </span>
      </button>

      {/* Expanded Menu/Form Container */}
      {/* Use containerRef here */}
      <div
          ref={containerRef}
          className={`fixed bottom-24 right-6 w-[340px] z-40 transition-all duration-300 ease-in-out ${ isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none' }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
      >
        {!formType ? (
          // Menu Buttons View
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
             <h3 id="quick-add-title" className="text-sm font-semibold text-gray-600 text-center mb-2">Quick Add</h3>
            <Button onClick={handleOpenDishForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <Utensils size={16} /> <span>Add New Dish...</span> </Button>
            <Button onClick={handleOpenRestaurantForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <Store size={16} /> <span>Add New Restaurant...</span> </Button>
            <Button onClick={handleCreateNewList} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <List size={16} /> <span>Create New List...</span> </Button>
          </div>
        ) : (
          // Submission Form View
          <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
               <h3 id="quick-add-title" className="text-lg font-semibold text-gray-900">
                   {formType === "dish" ? "Submit a Dish" : "Submit a Restaurant"}
               </h3>
                 {/* Optional: Back button within form? */}
               {/* <Button onClick={() => setFormType(null)} variant="tertiary" size="sm" className="!p-1"> <X size={16}/> </Button> */}
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-sm">
              {/* Name Input */}
              <div>
                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                    {formType === "dish" ? "Dish Name*" : "Restaurant Name*"}
                </label>
                <input
                    id="fq-item-name" type="text" required
                    name="newItemName" value={formData.newItemName} onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                    placeholder={formType === "dish" ? "e.g., Short Rib Taco" : "e.g., Kogi BBQ Truck"}
                 />
              </div>

              {/* Restaurant Input (for Dish form) with Autocomplete */}
              {formType === "dish" && (
                <div ref={restaurantInputRef} className="relative">
                  <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">Restaurant Name*</label>
                  <input
                    id="fq-restaurant-name" type="text" required
                    name="restaurantInput" value={formData.restaurantInput}
                    onChange={handleChange}
                    onFocus={() => formData.restaurantInput && fetchPlaceSuggestions(formData.restaurantInput)} // Fetch on focus if value exists
                    disabled={isSubmitting || isFetchingSuggestions} // Disable while fetching suggestions too
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                    placeholder="e.g., Kogi BBQ Truck"
                    autoComplete="off" // Prevent browser autocomplete interfering
                  />
                   {isFetchingSuggestions && <Loader2 size={16} className="absolute right-2 top-9 animate-spin text-gray-400" />}
                  {/* Restaurant Suggestions Dropdown */}
                  {showRestaurantSuggestions && restaurantSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                      <ul>
                          {restaurantSuggestions.map((suggestion, index) => (
                            <li key={`rest-sugg-${suggestion.placeId || index}`}>
                                <button
                                  type="button" // Important: type="button" prevents form submission
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none truncate"
                                  onClick={() => handleSelectRestaurantSuggestion(suggestion)}
                                >
                                  {suggestion.name}
                                </button>
                             </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tags Input & Display with Autocomplete */}
              <div ref={tagInputRef} className="relative">
                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">
                    Tags (optional, comma or Enter)
                </label>
                <input
                  id="fq-tags" type="text" value={tagInput}
                  onChange={(e) => { setTagInput(e.target.value); setSubmitError(null); }}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => setShowTagSuggestions(tagSuggestions.length > 0)} // Show suggestions on focus if available
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]"
                  placeholder="e.g., spicy, korean, taco"
                  autoComplete="off"
                />
                 {/* Tag Suggestions Dropdown */}
                 {showTagSuggestions && tagSuggestions.length > 0 && (
                     <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                        <ul>
                             {tagSuggestions.map((tag, index) => (
                                <li key={`tag-sugg-${index}`}>
                                 <button
                                     type="button"
                                     className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                     onClick={() => handleSelectTagSuggestion(tag)}
                                 >
                                     #{tag}
                                 </button>
                                 </li>
                             ))}
                         </ul>
                     </div>
                 )}
                {/* Display Selected Tags */}
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                        #{tag}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={isSubmitting}
                            className="ml-1 -mr-0.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full focus:outline-none focus:bg-gray-200"
                            aria-label={`Remove tag ${tag}`}
                         >
                            <X size={12} />
                         </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submission Error Message */}
              {submitError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2">
                     {submitError}
                  </p>
               )}

              {/* Submit Button */}
              <Button
                  type="submit"
                  variant="primary"
                  className="w-full flex justify-center py-2 px-4 mt-4"
                  disabled={isSubmitting} // Disable while submitting
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <> <Send size={16} className="mr-2" /> Submit for Review </> }
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default FloatingQuickAdd;