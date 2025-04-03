import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Utensils, Store, List, X, Loader2, Send } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext'; // Named export
import Button from '@/components/Button'; // Default export
import useSubmissionStore from '@/stores/useSubmissionStore'; // Default export
import useConfigStore from '@/stores/useConfigStore'; // Default export

const FloatingQuickAdd = () => {
  // --- State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formType, setFormType] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [localErrorMessage, setLocalErrorMessage] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [hasFetchedCuisines, setHasFetchedCuisines] = useState(false); // Track if fetch was attempted

  // --- Hooks and Store Selections ---
  const { openQuickAdd } = useQuickAdd();
  const { addPendingSubmission } = useSubmissionStore();
  const { cuisines, fetchCuisines, isLoadingCuisines, errorCuisines } = useConfigStore();

  // Fetch cuisines on mount if not already fetched
  useEffect(() => {
    if (!hasFetchedCuisines && !isLoadingCuisines && !errorCuisines) {
      console.log('[FloatingQuickAdd] Fetching cuisines on mount...');
      fetchCuisines().then(() => {
        setHasFetchedCuisines(true);
      }).catch(() => {
        setHasFetchedCuisines(true); // Set even on error to prevent retry
      });
    }
  }, [hasFetchedCuisines, isLoadingCuisines, errorCuisines, fetchCuisines]);

  console.log("FloatingQuickAdd (Step 5.2b Re-re-attempt): BEFORE selecting cuisines...");
  console.log("FloatingQuickAdd (Step 5.2b Re-re-attempt): AFTER selecting cuisines. Value:", cuisines);

  // --- Reset/Close Logic ---
  const resetForm = useCallback(() => {
    setFormType(null);
    setNewItemName("");
    setRestaurantInput("");
    setTagInput("");
    setLocalErrorMessage("");
    setIsSubmittingLocal(false);
    setSuggestedHashtags([]);
    setSelectedTags([]);
  }, []);

  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    resetForm();
  }, [resetForm]);

  // --- Action Button Handlers ---
  const handleOpenMainButton = useCallback(() => {
    if (isMenuOpen && formType) {
      closeMenuAndForm();
    } else {
      setIsMenuOpen((prev) => !prev);
      if (!isMenuOpen) resetForm();
    }
  }, [isMenuOpen, closeMenuAndForm, resetForm]);

  const handleOpenDishForm = useCallback(() => {
    setFormType("dish");
    resetForm();
  }, [resetForm]);

  const handleOpenRestaurantForm = useCallback(() => {
    setFormType("restaurant");
    resetForm();
  }, [resetForm]);

  const handleCreateNewList = useCallback(() => {
    openQuickAdd({ type: 'list', createNew: true });
    closeMenuAndForm();
  }, [openQuickAdd, closeMenuAndForm]);

  const fetchHashtagSuggestions = useCallback((query) => {
    console.log(`%c[FQA fetchHashtagSuggestions Defined] Query: "${query}". Cuisines length: ${cuisines?.length}`, 'color: gray');
    // Placeholder for future implementation
  }, [cuisines]);

  // --- Submit Handler ---
  const handleDirectSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newItemName.trim()) {
        setLocalErrorMessage("Please provide a name for the item.");
        return;
      }
      if (formType === "dish" && !restaurantInput.trim()) {
        setLocalErrorMessage("Please provide a restaurant name for the dish.");
        return;
      }

      setIsSubmittingLocal(true);
      setLocalErrorMessage("");

      try {
        const submissionData = {
          type: formType,
          name: newItemName.trim(),
          ...(formType === "dish" && { restaurant: restaurantInput.trim() }),
          tags: selectedTags,
        };
        await addPendingSubmission(submissionData);
        closeMenuAndForm();
      } catch (error) {
        setLocalErrorMessage(error.message || "Failed to submit. Please try again.");
      } finally {
        setIsSubmittingLocal(false);
      }
    },
    [formType, newItemName, restaurantInput, selectedTags, addPendingSubmission, closeMenuAndForm]
  );

  console.log("FloatingQuickAdd (Step 5.2b Re-re-attempt): Rendering. formType =", formType);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpenMainButton}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-50"
        aria-label={isMenuOpen && formType ? "Close menu" : "Open quick add menu"}
      >
        {isMenuOpen && formType ? <X size={28} /> : <Plus size={28} />}
      </button>

      {/* Expanded Menu/Form Container */}
      <div
        className={`fixed bottom-24 right-6 w-[340px] z-50 transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {!formType ? (
          // Menu Buttons
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3">
            <Button
              onClick={handleOpenDishForm}
              variant="secondary"
              className="w-full flex items-center justify-center space-x-2"
            >
              <Utensils size={16} />
              <span>Add Dish</span>
            </Button>
            <Button
              onClick={handleOpenRestaurantForm}
              variant="secondary"
              className="w-full flex items-center justify-center space-x-2"
            >
              <Store size={16} />
              <span>Add Restaurant</span>
            </Button>
            <Button
              onClick={handleCreateNewList}
              variant="secondary"
              className="w-full flex items-center justify-center space-x-2"
            >
              <List size={16} />
              <span>Create New List</span>
            </Button>
          </div>
        ) : (
          // Basic Form
          <form onSubmit={handleDirectSubmit} className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formType === "dish" ? "Add a Dish" : "Add a Restaurant"}
              </h3>
              <button
                type="button"
                onClick={closeMenuAndForm}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>
            {/* Form Fields */}
            <div className="space-y-3 text-sm">
              {/* Name Input */}
              <div>
                <label htmlFor="fq-item-name" className="block text-gray-700 font-medium mb-1">
                  {formType === "dish" ? "Dish Name" : "Restaurant Name"}
                </label>
                <input
                  id="fq-item-name"
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                  placeholder={formType === "dish" ? "e.g., Short Rib Taco" : "e.g., Kogi BBQ Truck"}
                  disabled={isSubmittingLocal}
                  required
                />
              </div>
              {/* Restaurant Input (for dishes only) */}
              {formType === "dish" && (
                <div>
                  <label htmlFor="fq-restaurant-name" className="block text-gray-700 font-medium mb-1">
                    Restaurant
                  </label>
                  <input
                    id="fq-restaurant-name"
                    type="text"
                    value={restaurantInput}
                    onChange={(e) => setRestaurantInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                    placeholder="e.g., Kogi BBQ Truck"
                    disabled={isSubmittingLocal}
                    required
                  />
                </div>
              )}
              {/* Tags Input */}
              <div>
                <label htmlFor="fq-tags" className="block text-gray-700 font-medium mb-1">
                  Tags (optional)
                </label>
                <input
                  id="fq-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#D1B399] focus:border-[#D1B399]"
                  placeholder="e.g., spicy, mexican"
                  disabled={isSubmittingLocal}
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {/* Error Message */}
              {localErrorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {localErrorMessage}
                </p>
              )}
              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center py-2 px-4"
                disabled={isSubmittingLocal}
              >
                {isSubmittingLocal ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
      {/* Backdrop */}
      {isMenuOpen && formType && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={closeMenuAndForm}
        />
      )}
    </>
  );
};

export default FloatingQuickAdd;