// src/components/FloatingQuickAdd.jsx
// UPDATE: Use specific stores useSubmissionStore, useConfigStore
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Utensils, Store, List, X, Loader2, Send } from "lucide-react";
// Import specific stores needed
import useConfigStore from '@/stores/useConfigStore.js';
import useSubmissionStore from '@/stores/useSubmissionStore.js';
// Keep QuickAddContext for triggering the Create List flow in the separate modal
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js"; // Keep config import

const FloatingQuickAdd = () => {
  // --- Hooks ---
  // Keep context hook for opening the QuickAddPopup in 'createNewList' mode
  const { openQuickAdd } = useQuickAdd();
  // Select state/actions from specific stores
  const cuisines = useConfigStore((state) => state.cuisines || []);
  const addPendingSubmission = useSubmissionStore((state) => state.addPendingSubmission);
  // Potentially add loading/error state from useSubmissionStore if needed for feedback
  // const isSubmitting = useSubmissionStore((state) => state.isLoading); // Or a more specific loading flag if added
  // const submissionError = useSubmissionStore((state) => state.error); // Or a more specific error flag

  // --- Local State for this component's UI ---
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controls visibility of Dish/Restaurant/List buttons OR the form
  const [formType, setFormType] = useState(null); // 'dish' or 'restaurant' - determines which form to show
  const [localErrorMessage, setLocalErrorMessage] = useState(""); // Error messages specific to form validation/API calls here
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false); // Local loading state for the submit action

  // Form field states
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null); // Stores { name, formattedAddress, city, neighborhood, placeId, location }

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
    setLocalErrorMessage(""); // Clear local errors
    setIsSubmittingLocal(false); // Reset local loading state
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, []); // No dependencies needed here

  // --- Close Handlers ---
  const closeMenuAndForm = useCallback(() => {
    setIsMenuOpen(false);
    setFormType(null);
    resetForm();
  }, [resetForm]);

  // --- Suggestion Fetching Logic ---
   const fetchHashtagSuggestions = useCallback((query) => {
    // Suggest based on cuisines from ConfigStore
    if (!query.trim()) {
      setSuggestedHashtags(cuisines.map(c => c.name).slice(0, 5));
      return;
    }
    const filtered = cuisines
      .map(c => c.name)
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
    setSuggestedHashtags(filtered.length > 0 ? filtered : cuisines.map(c => c.name).slice(0, 5));
  }, [cuisines]); // Dependency on cuisines from store

  const fetchPlaceSuggestions = useCallback(async (input) => {
    // ... (keep existing implementation using API_BASE_URL and GOOGLE_PLACES_API_KEY) ...
    if (!input.trim() || !GOOGLE_PLACES_API_KEY) {
        setPlaceSuggestions([]); return;
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
      } catch (error) { console.error("Failed to fetch place suggestions:", error); setPlaceSuggestions([]); }
      finally { setIsLoadingSuggestions(false); }
    }, 300);
  }, []); // No dependencies needed

  const fetchDishSuggestions = useCallback(async (input) => {
     // ... (keep existing implementation using API_BASE_URL) ...
     if (!input.trim()) { setDishSuggestions([]); return; }
    setIsLoadingSuggestions(true);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Assuming GET /api/dishes?name=... endpoint exists for suggestions
        const response = await fetch(`${API_BASE_URL}/api/dishes?name=${encodeURIComponent(input)}`);
        if (!response.ok) throw new Error("Dish suggestion fetch failed");
        const dishes = await response.json();
        setDishSuggestions((dishes || []).map(d => d.name)); // Extract names
      } catch (error) { console.error("Failed to fetch dish suggestions:", error); setDishSuggestions([]); }
      finally { setIsLoadingSuggestions(false); }
    }, 300);
  }, []); // No dependencies needed

  // --- Form Input Handlers ---
  // handleHashtagInputChange, handleItemNameChange, handleRestaurantInputChange, handlePlaceSelect, handleDishSelect, handleTagToggle, handleAddManualHashtag
  // Keep these useCallback handlers exactly as they were in the previous version,
  // ensuring they use the state setters defined within this component. Example:
  const handleHashtagInputChange = useCallback((e) => {
    const value = e.target.value;
    setHashtagInput(value);
    fetchHashtagSuggestions(value);
  }, [fetchHashtagSuggestions]);

   const handleItemNameChange = useCallback((e) => {
     const value = e.target.value;
     setNewItemName(value);
     if (formType === "dish") fetchDishSuggestions(value);
     else if (formType === 'restaurant') fetchPlaceSuggestions(value);
   }, [formType, fetchDishSuggestions, fetchPlaceSuggestions]);

   const handleRestaurantInputChange = useCallback((e) => {
     const value = e.target.value;
     setRestaurantInput(value);
     fetchPlaceSuggestions(value);
   }, [fetchPlaceSuggestions]);

    const handlePlaceSelect = useCallback(async (place) => {
        setRestaurantInput(place.description);
        setPlaceSuggestions([]);
        setIsLoadingSuggestions(true);
        setSelectedPlaceDetails(null);
        try {
            const response = await fetch( `${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`);
            if (!response.ok) throw new Error("Place details fetch failed");
            const details = await response.json();
             // Store the structured details: { name, formattedAddress, city, neighborhood, placeId, location }
            setSelectedPlaceDetails(details);
            // If adding a restaurant, pre-fill the main name input too
             if (formType === 'restaurant') {
                 setNewItemName(details.name || place.description.split(',')[0]);
             }
             console.log("Selected Place Details:", details);
        } catch (error) {
            console.error("Failed to fetch place details:", error);
            setLocalErrorMessage("Could not fetch place details.");
            setSelectedPlaceDetails(null); // Clear on error
        } finally { setIsLoadingSuggestions(false); }
    }, [formType]); // Added formType dependency

    const handleDishSelect = useCallback((dishName) => {
        setNewItemName(dishName);
        setDishSuggestions([]);
        // Optionally fetch tags based on selected dish?
        // fetchHashtagSuggestions(dishName);
    }, []);

   const handleTagToggle = useCallback((tag) => {
     setSelectedTags((prev) =>
       prev.includes(tag)
         ? prev.filter((t) => t !== tag)
         // Limit to 5 tags
         : prev.length < 5 ? [...prev, tag.toLowerCase().trim()] : prev
     );
   }, []);

  const handleAddManualHashtag = useCallback(() => {
    const trimmedTag = hashtagInput.trim().toLowerCase();
    if (!trimmedTag) return;
    if (selectedTags.includes(trimmedTag)) { setHashtagInput(""); return; } // Don't add duplicates
    if (selectedTags.length >= 5) {
      setLocalErrorMessage("Maximum of 5 tags allowed.");
      return;
    }
    setSelectedTags((prev) => [...prev, trimmedTag]);
    setHashtagInput(""); // Clear input
    setLocalErrorMessage(""); // Clear error
  }, [hashtagInput, selectedTags]);

  // --- Action Button Handlers ---
  const handleOpenMainButton = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    setFormType(null); // Always reset form type when toggling main button
    resetForm();
  }, [resetForm]);

  const handleOpenDishForm = useCallback(() => {
    setFormType("dish");
    resetForm();
    fetchHashtagSuggestions(''); // Load initial cuisine tags
  }, [resetForm, fetchHashtagSuggestions]);

  const handleOpenRestaurantForm = useCallback(() => {
    setFormType("restaurant");
    resetForm();
    fetchHashtagSuggestions(''); // Load initial cuisine tags
  }, [resetForm, fetchHashtagSuggestions]);

  // Use QuickAddContext to open the separate modal for list creation
  const handleCreateNewList = useCallback(() => {
    openQuickAdd({ type: "createNewList" });
    closeMenuAndForm(); // Close this component's menu/form
  }, [openQuickAdd, closeMenuAndForm]);

  // --- Direct Submit Handler (using SubmissionStore action) ---
  const handleDirectSubmit = useCallback(async () => {
    setLocalErrorMessage(""); // Clear previous local errors
    if (!newItemName.trim()) {
      setLocalErrorMessage("Item name is required.");
      return;
    }
    const isDish = formType === "dish";
    // For dishes, require either a selected place OR manually typed restaurant input
    if (isDish && !selectedPlaceDetails && !restaurantInput.trim()) {
      setLocalErrorMessage("Restaurant required for dishes. Please select from suggestions or type name.");
      return;
    }

    setIsSubmittingLocal(true); // Set local loading state

    // Construct submission data carefully using selectedPlaceDetails if available
    const submissionData = {
      type: isDish ? "dish" : "restaurant",
      name: newItemName.trim(),
      // Location for dish is the restaurant name (fetched or typed)
      location: isDish ? (selectedPlaceDetails?.name || restaurantInput.trim()) : null,
      tags: selectedTags,
      // Use details from selected place if available
      place_id: selectedPlaceDetails?.placeId || null,
      city: selectedPlaceDetails?.city || null,
      neighborhood: selectedPlaceDetails?.neighborhood || null,
    };

    console.log('[FloatingQuickAdd] Submitting Data:', submissionData);

    try {
      // Call the action from the submission store
      await addPendingSubmission(submissionData);
      console.log("[FloatingQuickAdd] Submission successful via store action for:", submissionData.name);
      closeMenuAndForm(); // Close and reset on success
    } catch (error) {
      console.error("[FloatingQuickAdd] Error during submission via store action:", error);
      // Error state is set in the store, but show local feedback too
      setLocalErrorMessage(`Submission Failed: ${error.message || "Unknown error"}`);
      setIsSubmittingLocal(false); // Turn off local loading on error
    }
  }, [
    formType, newItemName, restaurantInput, selectedTags, selectedPlaceDetails,
    addPendingSubmission, // Action from SubmissionStore
    closeMenuAndForm
  ]);

  // --- Effect for initial hashtag suggestions when form opens ---
  useEffect(() => {
    if (isMenuOpen && (formType === "dish" || formType === "restaurant")) {
      // Load initial suggestions (e.g., popular cuisines)
      fetchHashtagSuggestions('');
    }
  }, [isMenuOpen, formType, fetchHashtagSuggestions]);


  // --- Render ---
  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpenMainButton}
        className={`fixed bottom-6 right-6 text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] w-14 h-14 flex items-center justify-center transition-all duration-200 ease-in-out transform ${isMenuOpen ? 'bg-[#b89e89] rotate-45 scale-110' : 'bg-[#D1B399]'}`}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Close Quick Add" : "Open Quick Add"}
      >
        <Plus size={28} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Menu/Form Container */}
      {/* Animate appearance/disappearance */}
      <div className={`fixed bottom-24 right-6 w-[340px] z-50 transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Initial Action Selection Buttons (Only show if formType is not set) */}
        {!formType && (
            <div className="flex flex-col items-end space-y-3">
                {/* Buttons with slight animation delay */}
                <button onClick={handleOpenDishForm} title="Add Dish" className="bg-[#D1B399] text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center transition-all duration-150 hover:scale-110"> <Utensils size={20} /> </button>
                <button onClick={handleOpenRestaurantForm} title="Add Restaurant" className="bg-[#D1B399] text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center transition-all duration-150 delay-75 hover:scale-110"> <Store size={20} /> </button>
                <button onClick={handleCreateNewList} title="Create New List" className="bg-white text-[#D1B399] border border-[#D1B399] rounded-full p-3 shadow-lg hover:bg-[#D1B399]/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center transition-all duration-150 delay-150 hover:scale-110"> <List size={20} /> </button>
            </div>
        )}

          {/* Submission Form (Show if formType is 'dish' or 'restaurant') */}
          {formType && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-full animate-fade-in-up"> {/* Simple fade-in animation */}
               {/* Header */}
               <div className="flex justify-between items-center mb-3">
                   <h3 className="text-base font-semibold text-gray-800"> {/* Reduced size */}
                     {formType === "dish" ? "Submit New Dish" : "Submit New Restaurant"}
                   </h3>
                   {/* Close button */}
                    <button onClick={closeMenuAndForm} className="text-gray-400 hover:text-gray-600 p-1 -mr-1"> <X size={18} /> </button>
               </div>

               {/* Form Fields */}
               <div className="space-y-3 text-sm"> {/* Reduced spacing and text size */}
                   {/* Item Name Input */}
                   <div>
                       <label className="block text-xs font-medium text-gray-500 mb-0.5"> {/* Adjusted label style */}
                           {formType === "dish" ? "Dish Name*" : "Restaurant Name*"}
                       </label>
                       <input type="text" value={newItemName} onChange={handleItemNameChange} placeholder={formType === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza (Search or type)"} className="w-full px-2.5 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm" />
                       {/* Suggestions */}
                       {(isLoadingSuggestions && newItemName) && (<div className="text-xs text-gray-400 mt-1">Loading suggestions...</div>)}
                       {formType === "dish" && dishSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-20 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {dishSuggestions.map((dish, index) => ( <li key={index} onClick={() => handleDishSelect(dish)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer truncate"> {dish} </li> ))} </ul> )}
                       {formType === "restaurant" && placeSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-20 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {placeSuggestions.map((place, index) => ( <li key={place.place_id || index} onClick={() => handlePlaceSelect(place)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer truncate"> {place.description} </li> ))} </ul> )}
                   </div>

                   {/* Restaurant Input (for dish) */}
                   {formType === "dish" && (
                       <div>
                           <label className="block text-xs font-medium text-gray-500 mb-0.5">Restaurant*</label>
                           <input type="text" value={restaurantInput} onChange={handleRestaurantInputChange} placeholder="Search restaurants..." className="w-full px-2.5 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm" />
                           {(isLoadingSuggestions && restaurantInput) && (<div className="text-xs text-gray-400 mt-1">Loading suggestions...</div>)}
                           {placeSuggestions.length > 0 && !isLoadingSuggestions && ( <ul className="mt-1 max-h-20 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-sm text-xs"> {placeSuggestions.map((place, index) => ( <li key={place.place_id || index} onClick={() => handlePlaceSelect(place)} className="px-2 py-1 hover:bg-[#D1B399]/10 cursor-pointer truncate"> {place.description} </li> ))} </ul> )}
                           {/* Display selected place details concisely */}
                           {selectedPlaceDetails && (
                               <p className="text-xs text-gray-500 mt-1 truncate">
                                   Selected: {selectedPlaceDetails.name} ({selectedPlaceDetails.city || 'City N/A'})
                                </p>
                           )}
                       </div>
                   )}

                   {/* Tags Input */}
                   <div>
                       <label className="block text-xs font-medium text-gray-500 mb-0.5">Tags (max 5)</label>
                       <div className="flex flex-wrap gap-1 mb-1 min-h-[18px]">
                           {selectedTags.map((tag) => ( <span key={tag} className="px-1.5 py-0.5 bg-[#D1B399]/20 border border-[#D1B399]/50 text-[#6e5a4c] rounded-full text-[10px] flex items-center"> #{tag} <button onClick={() => handleTagToggle(tag)} className="ml-0.5 opacity-70 hover:opacity-100 focus:outline-none"> <X size={9} /> </button> </span> ))}
                       </div>
                       <div className="flex gap-1">
                           <input type="text" value={hashtagInput} onChange={handleHashtagInputChange} placeholder="Add tags..." className="flex-1 px-2.5 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm" />
                           <Button onClick={handleAddManualHashtag} variant="tertiary" size="sm" className="!px-2 !py-0.5 !text-xs" disabled={selectedTags.length >= 5 || !hashtagInput.trim()}>Add</Button>
                       </div>
                       <div className="flex flex-wrap gap-1 mt-1">
                           {suggestedHashtags.map((tag) => ( <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-1.5 py-0.5 text-[10px] rounded-full border transition-colors ${selectedTags.includes(tag) ? "bg-[#D1B399] text-white border-[#D1B399]" : "border-gray-300 text-gray-500 hover:border-[#D1B399] hover:text-[#6e5a4c]"}`} disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}> #{tag} </button> ))}
                       </div>
                   </div>

                   {/* Error Message */}
                   {localErrorMessage && ( <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-1.5">{localErrorMessage}</p> )}

                   {/* Submit Button */}
                   <Button onClick={handleDirectSubmit} variant="primary" size="sm" className="w-full !py-1.5 mt-1" disabled={isSubmittingLocal || !newItemName.trim() || (formType === 'dish' && !restaurantInput.trim() && !selectedPlaceDetails)}>
                       {isSubmittingLocal ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : <span className="flex items-center justify-center gap-1"><Send size={14}/> Submit</span> }
                   </Button>
               </div>
            </div>
          )}
      </div>
      {/* Add a backdrop maybe? */}
       {isMenuOpen && formType && (
           <div className="fixed inset-0 bg-black bg-opacity-10 z-40" onClick={closeMenuAndForm}></div>
       )}
    </>
  );
};

// Simple fade-in animation CSS (add to index.css or similar)
/*
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
*/


export default FloatingQuickAdd;