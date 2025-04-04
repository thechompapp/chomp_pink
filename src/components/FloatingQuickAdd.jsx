// src/components/FloatingQuickAdd.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import useSubmissionStore from '@/stores/useSubmissionStore';
import useConfigStore from '@/stores/useConfigStore';
import useFormHandler from '@/hooks/useFormHandler'; // Import the hook

const FloatingQuickAdd = () => {
  // --- State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formType, setFormType] = useState(null); // 'dish', 'restaurant', or null
  // Tag-specific state remains local
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const fetchAttemptedRef = useRef(false);

  // --- Hooks and Store Selections ---
  const { openQuickAdd } = useQuickAdd();
  const { addPendingSubmission } = useSubmissionStore();
  const fetchCuisines = useConfigStore((state) => state.fetchCuisines);
  const isLoadingCuisines = useConfigStore((state) => state.isLoadingCuisines);

  // Initialize Form Handler for text inputs and submission status
  const {
    formData,        // Contains { newItemName, restaurantInput }
    handleChange,    // Handles onChange for text inputs
    handleSubmit,    // Wraps form submission
    isSubmitting,    // Submission loading state from hook
    submitError,     // Submission error message from hook
    setSubmitError,  // To manually set errors (e.g., for validation)
    resetForm: resetHookForm // Rename to avoid conflict with local resetForm function
  } = useFormHandler({
    newItemName: '',
    restaurantInput: '', // Only used for 'dish' type, but initialize anyway
  });

  // Fetch cuisines (remains same)
  useEffect(() => {
     if (!fetchAttemptedRef.current && !isLoadingCuisines) {
       fetchAttemptedRef.current = true; // Mark attempt immediately
       console.log('[FloatingQuickAdd] useEffect: Attempting to fetch cuisines...');
       fetchCuisines()
         .catch(err => console.error('[FloatingQuickAdd] useEffect: Cuisine fetch failed.', err))
         .then(() => console.log('[FloatingQuickAdd] useEffect: Cuisine fetch attempt finished.'));
     }
   }, [fetchCuisines, isLoadingCuisines]);

  // --- Reset/Close Logic ---
  // Expanded reset function to include hook reset and local tag reset
  const resetAllFormState = useCallback(() => {
    resetHookForm(); // Reset hook state (newItemName, restaurantInput)
    setTagInput("");
    setSelectedTags([]);
    setSubmitError(null); // Also clear hook error state
  }, [resetHookForm, setSubmitError]);

  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    setFormType(null); // Hide the form view
    resetAllFormState(); // Use expanded reset
  }, [resetAllFormState]);

  // --- Action Button Handlers (Remain mostly the same) ---
  const handleOpenMainButton = useCallback(() => {
     setIsMenuOpen((prev) => {
         const nextIsOpen = !prev;
         if (!nextIsOpen) { // If closing
              setFormType(null); resetAllFormState();
         } else { // If opening
              setFormType(null); // Show menu first
         }
         return nextIsOpen;
     });
   }, [resetAllFormState]);

  const handleOpenDishForm = useCallback(() => { resetAllFormState(); setFormType("dish"); }, [resetAllFormState]);
  const handleOpenRestaurantForm = useCallback(() => { resetAllFormState(); setFormType("restaurant"); }, [resetAllFormState]);
  const handleCreateNewList = useCallback(() => { openQuickAdd({ type: 'list', createNew: true }); closeMenuAndForm(); }, [openQuickAdd, closeMenuAndForm]);

  // --- Tag Handling (Remains local) ---
  const handleAddTag = useCallback(() => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]); setTagInput(""); setSubmitError(null);
    } else if (newTag) { setSubmitError(`Tag "${newTag}" already added.`); setTagInput(""); }
  }, [tagInput, selectedTags, setSubmitError]);
  const handleTagInputKeyDown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(); } };
  const handleRemoveTag = useCallback((tagToRemove) => { setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove)); }, []);

  // --- Submit Handler ---
  // This function contains the core logic to run on submit
  const performSubmit = async (currentHookFormData) => { // Renamed arg for clarity
    console.log('[FloatingQuickAdd] performSubmit called with hook data:', currentHookFormData);
    // Basic Validation (using hook's error reporting)
    if (!currentHookFormData.newItemName?.trim()) {
      setSubmitError("Please provide a name."); throw new Error("Name required.");
    }
    if (formType === "dish" && !currentHookFormData.restaurantInput?.trim()) {
      setSubmitError("Please provide the restaurant name."); throw new Error("Restaurant required for dish.");
    }

    try {
      const submissionData = {
        type: formType,
        name: currentHookFormData.newItemName.trim(),
        location: formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null,
        tags: selectedTags, // Use local state for tags
      };
      console.log('[FloatingQuickAdd] Submitting via store action:', submissionData);
      await addPendingSubmission(submissionData); // Call store action
      console.log('[FloatingQuickAdd] Submission successful via store action.');
      closeMenuAndForm(); // Close and reset on success
    } catch (error) {
      console.error('[FloatingQuickAdd] Submission error caught:', error);
      // Re-throw error so the hook's handleSubmit catches it and sets submitError
      throw error;
    }
  };

  // Wrapper for form's onSubmit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(performSubmit); // Pass the core logic to the hook's handler
  };

  return (
    <>
      {/* Floating Action Button */}
      <button onClick={handleOpenMainButton} className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50" aria-label={isMenuOpen ? "Close quick add menu" : "Open quick add menu"} aria-expanded={isMenuOpen} >
        {isMenuOpen ? <X size={28} /> : <Plus size={28} />}
      </button>

      {/* Expanded Menu/Form Container */}
      <div className={`fixed bottom-24 right-6 w-[340px] z-50 transition-all duration-300 ease-in-out ${ isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none' }`} >
        {!formType ? (
          // Menu Buttons
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 space-y-3">
             <h3 className="text-sm font-semibold text-gray-600 text-center mb-2">Quick Add</h3>
            <Button onClick={handleOpenDishForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <Utensils size={16} /> <span>Add New Dish...</span> </Button>
            <Button onClick={handleOpenRestaurantForm} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <Store size={16} /> <span>Add New Restaurant...</span> </Button>
            <Button onClick={handleCreateNewList} variant="tertiary" className="w-full flex items-center justify-start space-x-2 !text-gray-700 hover:!bg-gray-100"> <List size={16} /> <span>Create New List...</span> </Button>
          </div>
        ) : (
          // Basic Form
          <form onSubmit={handleFormSubmit} className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900"> {formType === "dish" ? "Submit a Dish" : "Submit a Restaurant"} </h3>
            </div>
            {/* Form Fields */}
            <div className="space-y-3 text-sm">
              {/* Name Input */}
              <div>
                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1"> {formType === "dish" ? "Dish Name*" : "Restaurant Name*"} </label>
                <input id="fq-item-name" type="text" required name="newItemName" value={formData.newItemName} onChange={handleChange} disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder={formType === "dish" ? "e.g., Short Rib Taco" : "e.g., Kogi BBQ Truck"} />
              </div>
              {/* Restaurant Input */}
              {formType === "dish" && (
                <div>
                  <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">Restaurant Name*</label>
                  <input id="fq-restaurant-name" type="text" required name="restaurantInput" value={formData.restaurantInput} onChange={handleChange} disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder="e.g., Kogi BBQ Truck" />
                </div>
              )}
              {/* Tags Input & Display */}
              <div>
                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1"> Tags (optional, comma or Enter) </label>
                <input id="fq-tags" type="text" value={tagInput} onChange={(e) => { setTagInput(e.target.value); setSubmitError(null); }} onKeyDown={handleTagInputKeyDown} disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]" placeholder="e.g., spicy, mexican" />
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center">
                        #{tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} disabled={isSubmitting} className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={`Remove tag ${tag}`}> <X size={12} /> </button>
                      </span>
                    ))}
                  </div>
                 )}
              </div>
              {/* Error Message */}
              {submitError && ( <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-2"> {submitError} </p> )}
              {/* Submit Button */}
              <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4 mt-4" disabled={isSubmitting} >
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