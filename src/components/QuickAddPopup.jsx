// src/components/QuickAddPopup.jsx
// FIXED: Removed duplicate placeholder declarations causing "already been declared" error.
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import useAppStore from "@/hooks/useAppStore.js";
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Modal from "@/components/UI/Modal.jsx";
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js";

const QuickAddPopup = React.memo(() => {
  // --- Context ---
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();

  // --- Global State ---
  const userLists = useAppStore((state) => state.userLists || []);
  const addToList = useAppStore((state) => state.addToList);
  const addPendingSubmission = useAppStore((state) => state.addPendingSubmission);
  const checkDuplicateRestaurant = useAppStore((state) => state.checkDuplicateRestaurant);
  const fetchUserLists = useAppStore((state) => state.fetchUserLists);
  const cuisines = useAppStore((state) => state.cuisines || []);

  // --- Local State ---
  const [mode, setMode] = useState("addToList");
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [manualHashtag, setManualHashtag] = useState("");
  const [autoLocation, setAutoLocation] = useState("");
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  const debounceTimeoutRef = useRef(null);
  const hashtagDebounceTimeoutRef = useRef(null);

  // --- Callbacks & Effects ---
  const resetForm = useCallback(() => {
    setNewItemName("");
    setRestaurantInput("");
    setSelectedTags([]);
    setManualHashtag("");
    setAutoLocation("");
    setSelectedPlaceDetails(null);
    setPlaceSuggestions([]);
    setDishSuggestions([]);
    setIsLoadingSuggestions(false);
    setIsLoadingHashtags(false);
    setErrorMessage("");
    setDuplicateWarning("");
    setNewListName("");
    setIsPublic(true);
    setIsSubmittingList(false);
    setSuggestedHashtags(cuisines.map(c => c.name));
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (hashtagDebounceTimeoutRef.current) clearTimeout(hashtagDebounceTimeoutRef.current);
  }, [cuisines]);

  useEffect(() => {
    if (!isOpen) {
      // Keep mode as is, don't reset on close, default is set in useState
      return;
    }
    // Reset form state when modal opens or selectedItem changes
    resetForm();

    if (selectedItem?.type === "submission") {
        setMode("submission");
        // Pre-fill form fields...
        setNewItemName(selectedItem.name || "");
        if(selectedItem.subtype === 'dish') { setRestaurantInput(selectedItem.restaurant || ""); }
        setSelectedTags(Array.isArray(selectedItem.tags) ? selectedItem.tags.slice(0, 5) : []);
        if(selectedItem.place_id && selectedItem.city) {
             setSelectedPlaceDetails({ placeId: selectedItem.place_id, city: selectedItem.city, neighborhood: selectedItem.neighborhood });
        }
    } else if (selectedItem?.type === "createNewList") {
        setMode("createNewList");
    } else if (selectedItem && selectedItem.id && selectedItem.type) {
        setMode("addToList");
        if (Array.isArray(selectedItem.tags)) setSelectedTags(selectedItem.tags.slice(0, 5));
        if (userLists.length === 0) fetchUserLists();
    } else {
      setMode("addToList"); // Default to a safe mode if item is invalid
      console.warn("[QuickAddPopup useEffect] Invalid selectedItem on open.", selectedItem);
    }
  // Ensure dependencies correctly reflect what should trigger the effect
  }, [isOpen, selectedItem, resetForm, fetchUserLists, userLists.length]);


  // --- Helper Functions (Ensure these are defined correctly) ---
  const fetchHashtagSuggestions = useCallback(() => {/* ... */}, [cuisines]);
  const fetchPlaceSuggestions = useCallback(async () => {/* ... */}, []);
  const fetchDishSuggestions = useCallback(async () => {/* ... */}, []);
  const handleItemNameChange = useCallback(() => {/* ... */}, [/* dependencies */]);
  const handleRestaurantInputChange = useCallback(() => {/* ... */}, [fetchPlaceSuggestions]);
  const handlePlaceSelect = useCallback(async () => {/* ... */}, []);
  const handleDishSelect = useCallback(() => {/* ... */}, [fetchHashtagSuggestions]);
  const handleTagToggle = useCallback(() => {/* ... */}, []);
  const handleAddManualHashtag = useCallback(() => {/* ... */}, [manualHashtag, selectedTags]);
  const handleAddToListClick = useCallback(async (listId) => { /* ... */ }, [addToList, closeQuickAdd, selectedItem]);
  const handleSubmitNewItem = useCallback(async () => { /* ... */ }, [/* Add dependencies: newItemName, restaurantInput, selectedTags, selectedPlaceDetails, selectedItem, addPendingSubmission, closeQuickAdd */]);
  const handleCreateNewList = useCallback(async () => {
      if (!newListName.trim()) {
        setErrorMessage("List name cannot be empty.");
        return;
      }
      const newListData = { name: newListName.trim(), isPublic: isPublic };
      setErrorMessage("");
      setIsSubmittingList(true);
      try {
        const savedList = await addToList(null, newListData, true);
        if (savedList?.id) {
          closeQuickAdd();
        } else {
          throw new Error("List creation did not return a valid ID.");
        }
      } catch (error) {
        console.error("[QuickAddPopup handleCreateNewList] Error:", error);
        setErrorMessage(`Failed to create list: ${error.message || "Unknown error"}`);
      } finally {
         setIsSubmittingList(false);
      }
    }, [newListName, isPublic, addToList, closeQuickAdd]);


  // --- RENDER FUNCTIONS (Defined only ONCE here) ---
  const renderSubmissionMode = () => {
    // Actual JSX for submission mode
    return <div>Submission Form Placeholder...</div>; // Replace with actual JSX
  };

  const renderCreateNewListMode = () => {
      // Actual JSX for create list mode
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
            <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g., My Favorite NYC Pizza Joints" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]" disabled={isSubmittingList}/>
          </div>
          <div className="flex items-center">
             <label htmlFor="togglePublicList" className={`flex items-center mr-2 ${isSubmittingList ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                 <div className="relative"> <input type="checkbox" id="togglePublicList" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" disabled={isSubmittingList}/> <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div> <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div> </div>
             </label>
             <span className={`text-sm text-gray-700 select-none ${isSubmittingList ? 'opacity-50' : ''}`}>{isPublic ? 'Public List' : 'Private List'}</span>
           </div>
          {errorMessage && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{errorMessage}</p>}
          <Button onClick={handleCreateNewList} variant="primary" className="w-full" disabled={!newListName.trim() || isSubmittingList}>
            {isSubmittingList ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Create List"}
          </Button>
        </div>
      );
  };

  const renderAddToListMode = () => {
     // Actual JSX for add to list mode
     return <div>Add To List Placeholder...</div>; // Replace with actual JSX
  };

  const getModalTitle = () => {
    if (mode === "addToList") return "Add to List";
    if (mode === "createNewList") return "Create New List";
    if (mode === "submission") {
      return selectedItem?.subtype === "dish" ? "Submit New Dish" : "Submit New Restaurant";
    }
    return "Quick Add";
  };

  // --- Main Return ---
  // *** REMOVED the duplicate placeholder function/state declarations ***

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={getModalTitle()}>
      {/* Conditional rendering based on mode state */}
      {mode === "addToList" && renderAddToListMode()}
      {mode === "createNewList" && renderCreateNewListMode()}
      {mode === "submission" && renderSubmissionMode()}
    </Modal>
  );
});

export default QuickAddPopup;