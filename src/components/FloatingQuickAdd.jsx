// src/components/FloatingQuickAdd.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';
import useSubmissionStore from '@/stores/useSubmissionStore';
// REMOVED: import useConfigStore from '@/stores/useConfigStore';
import useUIStateStore from '@/stores/useUIStateStore'; // Import the consolidated store
import useFormHandler from '@/hooks/useFormHandler';

const FloatingQuickAdd = () => {
  // --- State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formType, setFormType] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const fetchAttemptedRef = useRef(false);

  // --- Hooks and Store Selections ---
  const { openQuickAdd } = useQuickAdd();
  const { addPendingSubmission } = useSubmissionStore();
  // Select cuisine fetching logic from the consolidated UI store
  const fetchCuisines = useUIStateStore((state) => state.fetchCuisines);
  const isLoadingCuisines = useUIStateStore((state) => state.isLoadingCuisines);
  // You might also want cuisines list from here if needed:
  // const cuisines = useUIStateStore((state) => state.cuisines);

  // Initialize Form Handler
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    resetForm: resetHookForm
  } = useFormHandler({
    newItemName: '',
    restaurantInput: '',
  });

  // Fetch cuisines (uses fetchCuisines from useUIStateStore now)
  useEffect(() => {
     // Trigger fetch only once if not already loading
     if (!fetchAttemptedRef.current && !isLoadingCuisines) {
       fetchAttemptedRef.current = true;
       fetchCuisines()
         .catch(err => console.error('[FloatingQuickAdd] useEffect: Cuisine fetch failed.', err))
         .then(() => { /* Optional: handle success logging */ });
     }
   }, [fetchCuisines, isLoadingCuisines]); // Dependencies updated

  // --- Reset/Close Logic ---
  const resetAllFormState = useCallback(() => {
    resetHookForm();
    setTagInput("");
    setSelectedTags([]);
    setSubmitError(null);
  }, [resetHookForm, setSubmitError]);

  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    setFormType(null);
    resetAllFormState();
  }, [resetAllFormState]);

  // --- Action Button Handlers ---
  const handleOpenMainButton = useCallback(() => {
     setIsMenuOpen((prev) => {
         const nextIsOpen = !prev;
         if (!nextIsOpen) { closeMenuAndForm(); } // Use combined close/reset
         else { setFormType(null); } // Show menu first when opening
         return nextIsOpen;
     });
   }, [closeMenuAndForm]); // Dependency updated

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
  const performSubmit = async (currentHookFormData) => {
    if (!currentHookFormData.newItemName?.trim()) {
      throw new Error("Please provide a name."); // Throw error for hook
    }
    if (formType === "dish" && !currentHookFormData.restaurantInput?.trim()) {
      throw new Error("Please provide the restaurant name."); // Throw error for hook
    }

    try {
      const submissionData = {
        type: formType,
        name: currentHookFormData.newItemName.trim(),
        location: formType === 'dish' ? currentHookFormData.restaurantInput.trim() : null,
        tags: selectedTags,
      };
      await addPendingSubmission(submissionData);
      closeMenuAndForm(); // Close and reset on success
    } catch (error) {
      console.error('[FloatingQuickAdd] Submission error caught:', error);
      throw error; // Re-throw for hook
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(performSubmit);
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