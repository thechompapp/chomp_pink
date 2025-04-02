// src/components/FloatingQuickAdd.jsx
// Refactored for single-step Dish/Restaurant submission
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Utensils, Store, List, X, Loader2, Send } from "lucide-react"; // Added Loader2, Send
import useAppStore from "@/hooks/useAppStore.js";
import { useQuickAdd } from "@/context/QuickAddContext.jsx"; // Still needed for Create List
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js";

const FloatingQuickAdd = () => {
  // --- Hooks ---
  const { openQuickAdd } = useQuickAdd(); // Keep for Create List functionality
  const cuisines = useAppStore((state) => state.cuisines || []);
  const addPendingSubmission = useAppStore((state) => state.addPendingSubmission); // Get submission action

  // --- State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controls visibility of Dish/Restaurant/List buttons OR the form
  const [formType, setFormType] = useState(null); // 'dish' or 'restaurant' - determines which form to show
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for submission

  // Form state (moved from QuickAddPopup)
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [hashtagInput, setHashtagInput] = useState(""); // For manual tag input
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null); // Stores details from Google Places API

  const debounceTimeoutRef = useRef(null);

  // --- Reset Form State ---
  const resetForm = useCallback(() => {
    setNewItemName("");
    setRestaurantInput("");
    setHashtagInput("");
    setSuggestedHashtags([]);
    setSelectedTags([]);
    setPlaceSuggestions([]);
    setDishSuggestions([]);
    setIsLoadingSuggestions(false);
    setSelectedPlaceDetails(null);
    setErrorMessage("");
    setIsSubmitting(false);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, []); // Removed cuisine dependency as it comes from store

  // --- Close Handlers ---
  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    setFormType(null); // Reset form type
    resetForm(); // Clear form fields
  }, [resetForm]);

  // --- Suggestion Fetching Logic (moved from QuickAddPopup) ---
   const fetchHashtagSuggestions = useCallback((query) => {
    if (!query.trim()) {
      setSuggestedHashtags(cuisines.map(c => c.name).slice(0, 5));
      return;
    }
    const filtered = cuisines
      .map(c => c.name)
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
    setSuggestedHashtags(filtered.length > 0 ? filtered : cuisines.map(c => c.name).slice(0, 5));
  }, [cuisines]);

  const fetchPlaceSuggestions = useCallback(async (input) => {
    if (!input.trim() || !GOOGLE_PLACES_API_KEY) {
        setPlaceSuggestions([]); // Clear suggestions if no input/key
        return;
    }
    setIsLoadingSuggestions(true);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`
        );
        if (!response.ok) throw new Error("Place suggestion fetch failed");
        const data = await response.json();
        setPlaceSuggestions(data || []);
      } catch (error) {
        console.error("Failed to fetch place suggestions:", error);
        setPlaceSuggestions([]); // Clear on error
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []); // Empty dependency array is fine here

  const fetchDishSuggestions = useCallback(async (input) => {
    if (!input.trim()) {
        setDishSuggestions([]); // Clear if no input
        return;
    }
    setIsLoadingSuggestions(true);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dishes?name=${encodeURIComponent(input)}`); // Assuming backend filters by name query param
         if (!response.ok) throw new Error("Dish suggestion fetch failed");
        const dishes = await response.json();
        // Filter client-side if backend doesn't filter
        // const filteredDishes = dishes.filter(d => d.name.toLowerCase().includes(input.toLowerCase()));
        setDishSuggestions((dishes || []).map(d => d.name)); // Assuming backend returns filtered list
      } catch (error) {
        console.error("Failed to fetch dish suggestions:", error);
         setDishSuggestions([]); // Clear on error
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []); // Empty dependency array fine here

  // --- Form Input Handlers (moved from QuickAddPopup) ---
  const handleHashtagInputChange = useCallback((e) => {
    const value = e.target.value;
    setHashtagInput(value);
    fetchHashtagSuggestions(value);
  }, [fetchHashtagSuggestions]);

  const handleItemNameChange = useCallback((e) => {
    const value = e.target.value;
    setNewItemName(value);
    if (formType === "dish") {
      fetchDishSuggestions(value);
      // Optional: Also fetch hashtag suggestions based on dish name
      // fetchHashtagSuggestions(value);
    } else if (formType === 'restaurant') {
       fetchPlaceSuggestions(value); // Suggest places based on restaurant name
    }
  }, [formType, fetchDishSuggestions, fetchPlaceSuggestions]); // Removed fetchHashtagSuggestions for now

  const handleRestaurantInputChange = useCallback((e) => {
    const value = e.target.value;
    setRestaurantInput(value);
    fetchPlaceSuggestions(value); // Fetch places based on restaurant input
  }, [fetchPlaceSuggestions]);

  const handlePlaceSelect = useCallback(async (place) => {
    setRestaurantInput(place.description); // Use full description for input
    setPlaceSuggestions([]);
    setIsLoadingSuggestions(true);
    setSelectedPlaceDetails(null); // Reset details before fetching new ones
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`
      );
       if (!response.ok) throw new Error("Place details fetch failed");
      const details = await response.json();
      setSelectedPlaceDetails(details); // Store full details object { name, formattedAddress, city, neighborhood, placeId, location }
      // If adding a restaurant, pre-fill the main name input too
      if(formType === 'restaurant') {
        setNewItemName(details.name || place.description.split(',')[0]); // Use place name or fallback from description
      }
    } catch (error) {
      console.error("Failed to fetch place details:", error);
      setErrorMessage("Could not fetch place details.");
      setSelectedPlaceDetails(null);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [formType]); // Add formType dependency

  const handleDishSelect = useCallback((dishName) => {
    setNewItemName(dishName);
    setDishSuggestions([]);
    fetchHashtagSuggestions(dishName); // Fetch related tags
  }, [fetchHashtagSuggestions]);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5 ? [...prev, tag] : prev
    );
  }, []);

  const handleAddManualHashtag = useCallback(() => {
    const trimmedTag = hashtagInput.trim().toLowerCase();
    if (!trimmedTag || selectedTags.includes(trimmedTag) || selectedTags.length >= 5) {
      if (selectedTags.length >= 5) setErrorMessage("Maximum of 5 tags allowed.");
      return;
    }
    setSelectedTags((prev) => [...prev, trimmedTag]);
    setHashtagInput(""); // Clear input
    setErrorMessage("");
  }, [hashtagInput, selectedTags]);

  // --- Action Button Handlers ---
  const handleOpenMainButton = useCallback(() => {
    setIsMenuOpen(prev => !prev); // Toggle menu/form visibility
    setFormType(null); // Reset form type when toggling main button
    resetForm();
  }, [resetForm]);

  const handleOpenDishForm = useCallback(() => {
    setFormType("dish");
    // Keep menu open (isMenuOpen is already true if this button is visible)
    resetForm(); // Reset form when switching type
    fetchHashtagSuggestions(''); // Load initial tags
  }, [resetForm, fetchHashtagSuggestions]);

  const handleOpenRestaurantForm = useCallback(() => {
    setFormType("restaurant");
    resetForm();
    fetchHashtagSuggestions('');
  }, [resetForm, fetchHashtagSuggestions]);

  const handleCreateNewList = useCallback(() => {
    // Use the existing QuickAddPopup for list creation
    openQuickAdd({ type: "createNewList" });
    closeMenuAndForm(); // Close local menu/form
  }, [openQuickAdd, closeMenuAndForm]);

  // --- Direct Submit Handler ---
  const handleDirectSubmit = useCallback(async () => {
    setErrorMessage(""); // Clear previous errors
    if (!newItemName.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }
    const isDish = formType === "dish";
    if (isDish && !restaurantInput.trim()) {
      setErrorMessage("Restaurant name is required for dishes.");
      return;
    }

    setIsSubmitting(true); // Set loading state

    const submissionData = {
      type: isDish ? "dish" : "restaurant",
      name: newItemName.trim(),
      location: isDish ? (selectedPlaceDetails?.name || restaurantInput.trim()) : null, // Use fetched name or input for dish location
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      city: selectedPlaceDetails?.city || null,
      neighborhood: selectedPlaceDetails?.neighborhood || null,
    };

    console.log('[FloatingQuickAdd] handleDirectSubmit - Payload:', submissionData);

    try {
      await addPendingSubmission(submissionData);
      console.log("[FloatingQuickAdd] Submission successful for:", submissionData.name);
      closeMenuAndForm(); // Close and reset on success
    } catch (error) {
      console.error("[FloatingQuickAdd] Error during submission:", error);
      setErrorMessage(`Failed to submit: ${error.message || "Unknown error"}`);
      setIsSubmitting(false); // Turn off loading on error
    }
  }, [
    formType,
    newItemName,
    restaurantInput,
    selectedTags,
    selectedPlaceDetails,
    addPendingSubmission,
    closeMenuAndForm
  ]);

  // --- Effect for initial hashtag suggestions ---
  useEffect(() => {
    if (isMenuOpen && (formType === "dish" || formType === "restaurant")) {
      fetchHashtagSuggestions(formType === 'dish' ? newItemName : ''); // Suggest based on dish name or empty for restaurant
    }
  }, [isMenuOpen, formType, fetchHashtagSuggestions, newItemName]);


  // --- Render ---
  return (
    <>
      {/* Main Floating Action Button */}
      <button
        onClick={handleOpenMainButton}
        className={`fixed bottom-6 right-6 text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] w-14 h-14 flex items-center justify-center transition-transform duration-200 ease-in-out ${isMenuOpen ? 'bg-[#b89e89] rotate-45' : 'bg-[#D1B399]'}`}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close Quick Add" : "Open Quick Add"}
      >
        <Plus size={28} />
      </button>

      {/* Expanded Menu/Form Container */}
      {isMenuOpen && (
        <div className="fixed bottom-24 right-6 w-[340px] z-50">
          {/* Initial Action Selection Buttons (Only show if formType is not set) */}
          {!formType && (
            <div className="flex flex-col items-end space-y-3">
              {/* Add Dish Button */}
              <button
                onClick={handleOpenDishForm}
                title="Add Dish"
                className="bg-[#D1B399] text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center"
              >
                <Utensils size={20} />
              </button>
              {/* Add Restaurant Button */}
              <button
                onClick={handleOpenRestaurantForm}
                title="Add Restaurant"
                className="bg-[#D1B399] text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center"
              >
                <Store size={20} />
              </button>
               {/* Create List Button */}
              <button
                onClick={handleCreateNewList}
                 title="Create New List"
                className="bg-white text-[#D1B399] border border-[#D1B399] rounded-full p-3 shadow-lg hover:bg-[#D1B399]/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center"
              >
                <List size={20} />
              </button>
            </div>
          )}

          {/* Submission Form (Show if formType is 'dish' or 'restaurant') */}
          {formType && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-full">
               {/* Header with Back Button */}
               <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-semibold text-gray-800">
                     {formType === "dish" ? "Submit New Dish" : "Submit New Restaurant"}
                   </h3>
                   {/* Back button replaces close if needed, or keep close */}
                   {/* <button onClick={() => setFormType(null)} className="text-gray-500 hover:text-gray-700">&lt; Back</button> */}
                    <button onClick={closeMenuAndForm} className="text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
               </div>

               {/* Form Fields */}
               <div className="space-y-3">
                  {/* Item Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {formType === "dish" ? "Dish Name*" : "Restaurant Name*"}
                    </label>
                    <input
                       type="text"
                       value={newItemName}
                       onChange={handleItemNameChange}
                       placeholder={formType === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza (Search or type)"}
                       className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm"
                     />
                    {/* Suggestions */}
                     {isLoadingSuggestions && formType === 'dish' && newItemName && ( <div className="text-xs text-gray-500 mt-1">Loading dish suggestions...</div> )}
                     {isLoadingSuggestions && formType === 'restaurant' && newItemName && ( <div className="text-xs text-gray-500 mt-1">Loading place suggestions...</div> )}
                     {formType === "dish" && dishSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-24 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {dishSuggestions.map((dish, index) => ( <li key={index} onClick={() => handleDishSelect(dish)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer"> {dish} </li> ))} </ul> )}
                     {formType === "restaurant" && placeSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-24 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {placeSuggestions.map((place, index) => ( <li key={place.place_id || index} onClick={() => handlePlaceSelect(place)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer"> {place.description} </li> ))} </ul> )}
                  </div>

                  {/* Restaurant Input (for dish) */}
                  {formType === "dish" && (
                     <div>
                       <label className="block text-xs font-medium text-gray-600 mb-1">Restaurant*</label>
                       <input
                         type="text"
                         value={restaurantInput}
                         onChange={handleRestaurantInputChange}
                         placeholder="Search or type restaurant name"
                         className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm"
                       />
                       {isLoadingSuggestions && restaurantInput && ( <div className="text-xs text-gray-500 mt-1">Loading place suggestions...</div> )}
                       {placeSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-24 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {placeSuggestions.map((place, index) => ( <li key={place.place_id || index} onClick={() => handlePlaceSelect(place)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer"> {place.description} </li> ))} </ul> )}
                     </div>
                   )}

                   {/* Tags Input */}
                  <div>
                     <label className="block text-xs font-medium text-gray-600 mb-1">Tags (max 5)</label>
                     {/* Selected Tags */}
                     <div className="flex flex-wrap gap-1 mb-1.5 min-h-[20px]">
                       {selectedTags.map((tag) => (
                         <span key={tag} className="px-1.5 py-0.5 bg-[#D1B399]/20 border border-[#D1B399]/50 text-[#6e5a4c] rounded-full text-[11px] flex items-center">
                           #{tag}
                           <button onClick={() => handleTagToggle(tag)} className="ml-1 opacity-70 hover:opacity-100 focus:outline-none"> <X size={10} /> </button>
                         </span>
                       ))}
                     </div>
                     {/* Manual Input + Add Button */}
                     <div className="flex gap-1.5">
                       <input
                         type="text"
                         value={hashtagInput}
                         onChange={handleHashtagInputChange}
                         placeholder="Add tags..."
                         className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm"
                       />
                       <Button onClick={handleAddManualHashtag} variant="tertiary" size="sm" className="px-2.5 py-1" disabled={selectedTags.length >= 5 || !hashtagInput.trim()}>Add</Button>
                     </div>
                     {/* Suggested Tags */}
                     <div className="flex flex-wrap gap-1 mt-1.5">
                       {suggestedHashtags.map((tag) => (
                         <button
                           key={tag}
                           onClick={() => handleTagToggle(tag)}
                           className={`px-1.5 py-0.5 text-[11px] rounded-full border transition-colors ${
                             selectedTags.includes(tag)
                               ? "bg-[#D1B399] text-white border-[#D1B399]"
                               : "border-gray-300 text-gray-500 hover:border-[#D1B399] hover:text-[#6e5a4c]"
                           }`}
                           disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                         > #{tag} </button>
                       ))}
                     </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && ( <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{errorMessage}</p> )}

                   {/* Submit Button */}
                  <Button
                     onClick={handleDirectSubmit}
                     variant="primary"
                     className="w-full mt-2" // Added margin top
                     disabled={isSubmitting || !newItemName.trim() || (formType === 'dish' && !restaurantInput.trim())}
                   >
                     {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : <span className="flex items-center justify-center gap-1.5"><Send size={16}/> Submit</span> }
                   </Button>
               </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingQuickAdd;