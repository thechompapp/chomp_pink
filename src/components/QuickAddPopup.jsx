// src/components/QuickAddPopup.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import useAppStore from "@/hooks/useAppStore.js";
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Modal from "@/components/UI/Modal.jsx";
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js";

const QuickAddPopup = React.memo(() => {
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();
  const { userLists, addToList, addPendingSubmission, checkDuplicateRestaurant, fetchUserLists } = useAppStore();

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
  const [suggestedHashtags, setSuggestedHashtags] = useState([ "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert", "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining" ]);
  const [newListName, setNewListName] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const debounceTimeoutRef = useRef(null);
  const hashtagDebounceTimeoutRef = useRef(null);

  const resetForm = useCallback(() => {
    setNewItemName(""); setRestaurantInput(""); setSelectedTags([]); setManualHashtag("");
    setAutoLocation(""); setSelectedPlaceDetails(null); setPlaceSuggestions([]); setDishSuggestions([]);
    setIsLoadingSuggestions(false); setIsLoadingHashtags(false); setErrorMessage(""); setDuplicateWarning("");
    setNewListName(""); setIsPublic(true);
    setSuggestedHashtags([ "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert", "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining" ]);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (hashtagDebounceTimeoutRef.current) clearTimeout(hashtagDebounceTimeoutRef.current);
      return;
    }
    resetForm();
    if (selectedItem?.type === "submission") { setMode("submission"); }
    else if (selectedItem?.type === "createNewList") { setMode("createNewList"); }
    else if (selectedItem) {
      setMode("addToList");
      if (Array.isArray(selectedItem.tags)) { setSelectedTags(selectedItem.tags.slice(0, 5)); }
    } else { closeQuickAdd(); }
  }, [isOpen, selectedItem, closeQuickAdd, resetForm]);

  // --- Function to fetch dynamic hashtag suggestions (NEEDS BACKEND API) ---
  const fetchHashtagSuggestions = useCallback(async (dishNameQuery) => {
      if (!dishNameQuery || dishNameQuery.length < 3) {
           setSuggestedHashtags([ "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert", "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining" ]);
           setIsLoadingHashtags(false); return;
      }
      console.log(`[QuickAddPopup] Fetching hashtag suggestions for: "${dishNameQuery}"`);
      setIsLoadingHashtags(true);
      try {
          // ** TODO: Replace mock with API call to /api/hashtags/suggestions?query=... **
          await new Promise(resolve => setTimeout(resolve, 400)); // Simulate delay
          let dynamicTags = ["mock"]; /* Replace with API result */
          if (dishNameQuery.toLowerCase().includes("pizza")) dynamicTags = ["italian", "cheese", "slice", "pepperoni", "vegetarian"];
          else if (dishNameQuery.toLowerCase().includes("burger")) dynamicTags = ["american", "beef", "cheese", "fries", "fast-food"];
          else if (dishNameQuery.toLowerCase().includes("taco")) dynamicTags = ["mexican", "spicy", "corn", "cilantro", "street food"];
          else if (dishNameQuery.toLowerCase().includes("sushi")) dynamicTags = ["japanese", "fish", "raw", "rice", "wasabi"];
          else if (dishNameQuery.toLowerCase().includes("lasagna")) dynamicTags = ["italian", "pasta", "baked", "cheese", "comfort food"];
          setSuggestedHashtags(Array.isArray(dynamicTags) ? dynamicTags.slice(0, 15) : []);
      } catch (error) {
          console.error("[QuickAddPopup] Error fetching hashtag suggestions:", error);
          setSuggestedHashtags([ "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert", "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining" ]);
      } finally { setIsLoadingHashtags(false); }
  }, []); // Empty dependency array for now, add API client if needed

  const fetchPlaceSuggestions = useCallback(async (input) => {
        if (!input || input.length < 3) { setPlaceSuggestions([]); return; }
        if (!GOOGLE_PLACES_API_KEY) { setErrorMessage("Places API key needed."); return; }
        setIsLoadingSuggestions(true); setErrorMessage("");
        try {
          const response = await fetch(`${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json(); setPlaceSuggestions(data || []);
        } catch (error) { console.error("Err fetch place suggestions:", error); setPlaceSuggestions([]); setErrorMessage(`Loc fetch fail: ${error.message}`); }
        finally { setIsLoadingSuggestions(false); }
   }, []);

  const fetchDishSuggestions = useCallback(async (input) => {
        if (!input || input.length < 2) { setDishSuggestions([]); return; }
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/common-dishes?input=${encodeURIComponent(input)}`);
          if (!response.ok) throw new Error('Failed dish suggestions');
          const data = await response.json(); setDishSuggestions(data || []);
        } catch (error) { console.error('Err fetch dish suggestions:', error); setDishSuggestions([]); }
        finally { setIsLoadingSuggestions(false); }
  }, []);

  const handleItemNameChange = useCallback((e) => {
    const value = e.target.value; setNewItemName(value);
    setSelectedPlaceDetails(null); setAutoLocation(""); setPlaceSuggestions([]);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (hashtagDebounceTimeoutRef.current) clearTimeout(hashtagDebounceTimeoutRef.current);
    if (selectedItem?.subtype === "restaurant") {
        setDuplicateWarning(""); debounceTimeoutRef.current = setTimeout(() => { fetchPlaceSuggestions(value); }, 300);
    } else if (selectedItem?.subtype === "dish") {
        debounceTimeoutRef.current = setTimeout(() => { fetchDishSuggestions(value); }, 300);
        hashtagDebounceTimeoutRef.current = setTimeout(() => { fetchHashtagSuggestions(value); }, 500); // Fetch hashtags too
    }
  }, [fetchPlaceSuggestions, fetchDishSuggestions, fetchHashtagSuggestions, selectedItem?.subtype]);

  const handleRestaurantInputChange = useCallback((e) => {
     const value = e.target.value; setRestaurantInput(value);
     setSelectedPlaceDetails(null); setPlaceSuggestions([]);
     if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
     debounceTimeoutRef.current = setTimeout(() => { fetchPlaceSuggestions(value); }, 300);
  }, [fetchPlaceSuggestions]);

  const handlePlaceSelect = useCallback(async (place) => {
         if (!place?.place_id) return;
         const placeName = place.description.split(',')[0].trim(); setPlaceSuggestions([]);
         if (selectedItem?.subtype === 'restaurant') setNewItemName(placeName);
         else if (selectedItem?.subtype === 'dish') setRestaurantInput(place.description);
         setIsLoadingSuggestions(true); setErrorMessage("");
         try {
           const response = await fetch(`${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`);
           if (!response.ok) throw new Error(`HTTP ${response.status}`);
           const details = await response.json();
           setSelectedPlaceDetails({ name: details.name, placeId: place.place_id, city: details.city, neighborhood: details.neighborhood, formattedAddress: details.formattedAddress });
           if (selectedItem?.subtype === 'restaurant') setAutoLocation(details.formattedAddress);
         } catch (error) { console.error("Err fetch place details:", error); setErrorMessage(`Detail fetch fail: ${error.message}`); setSelectedPlaceDetails(null); }
         finally { setIsLoadingSuggestions(false); }
   }, [selectedItem?.subtype]);

  const handleDishSelect = useCallback((dishName) => {
        setNewItemName(dishName); setDishSuggestions([]);
        if (hashtagDebounceTimeoutRef.current) clearTimeout(hashtagDebounceTimeoutRef.current);
        fetchHashtagSuggestions(dishName); // Fetch hashtags when dish selected
  }, [fetchHashtagSuggestions]);

  const handleTagToggle = useCallback((tag) => {
      setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev );
  }, []);

  const handleAddManualHashtag = useCallback(() => {
       const trimmedTag = manualHashtag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
       if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 5) { setSelectedTags([...selectedTags, trimmedTag]); setManualHashtag(""); setErrorMessage(""); }
       else if (selectedTags.length >= 5) setErrorMessage("Max 5 tags.");
       else if (selectedTags.includes(trimmedTag)) setErrorMessage(`#${trimmedTag} added.`);
       else setManualHashtag("");
  }, [manualHashtag, selectedTags]);

  const handleAddToList = useCallback(async (listId) => {
         if (!selectedItem) return;
         const itemToAdd = { ...selectedItem, tags: selectedItem.tags || selectedTags || [] };
         try { await addToList(listId, itemToAdd); closeQuickAdd(); }
         catch (error) { setErrorMessage("Failed add to list."); }
  }, [selectedItem, addToList, closeQuickAdd, selectedTags]);

  const handleCreateNewList = useCallback(async () => {
       if (!newListName.trim()) { setErrorMessage("List name empty."); return; }
       const newListData = { name: newListName.trim(), isPublic: isPublic };
       try {
           const savedList = await addToList(null, newListData, true);
           if (savedList?.id) {
             if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') await handleAddToList(savedList.id);
             else closeQuickAdd();
             await fetchUserLists();
           } else throw new Error("List creation failed");
       } catch (error) { setErrorMessage("Failed to create list."); }
  }, [newListName, isPublic, addToList, closeQuickAdd, selectedItem, handleAddToList, fetchUserLists]);

  const handleSubmitNewItem = useCallback(async () => {
       if (!newItemName.trim() || (selectedItem?.subtype === 'dish' && !restaurantInput.trim()) || ((selectedItem?.subtype === 'restaurant' || selectedItem?.subtype === 'dish') && !selectedPlaceDetails)) { setErrorMessage("Required fields missing or location not selected."); return; }
       const submissionData = { type: selectedItem?.subtype, name: selectedItem?.subtype === 'restaurant' ? selectedPlaceDetails?.name : newItemName.trim(), tags: selectedTags, place_id: selectedPlaceDetails?.placeId || null, location: selectedItem?.subtype === 'dish' ? selectedPlaceDetails?.name : selectedPlaceDetails?.formattedAddress || autoLocation, city: selectedPlaceDetails?.city || 'Unknown', neighborhood: selectedPlaceDetails?.neighborhood || 'Unknown', user_id: 1 };
       setErrorMessage("");
       try { await addPendingSubmission(submissionData); closeQuickAdd(); }
       catch (error) { setErrorMessage(`Submit fail: ${error.message}`); }
  }, [ newItemName, restaurantInput, selectedTags, selectedPlaceDetails, autoLocation, selectedItem?.subtype, addPendingSubmission, closeQuickAdd, duplicateWarning ]);

  useEffect(() => {
       if (mode === "submission" && selectedItem?.subtype === "restaurant" && selectedPlaceDetails?.name) {
         const itemToCheck = { name: selectedPlaceDetails.name, city: selectedPlaceDetails.city, neighborhood: selectedPlaceDetails.neighborhood };
         if (checkDuplicateRestaurant(itemToCheck)) setDuplicateWarning(`Restaurant "${itemToCheck.name}" may exist.`); else setDuplicateWarning("");
       } else setDuplicateWarning("");
  }, [selectedPlaceDetails, checkDuplicateRestaurant, mode, selectedItem?.subtype]);

  const filteredUserLists = useMemo(() => Array.isArray(userLists) ? userLists : [], [userLists]);

  if (!isOpen) return null;

  // --- RENDER FUNCTIONS ---
  const renderSubmissionMode = () => (
    <div>
      {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>}
      {duplicateWarning && !errorMessage && <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm">{duplicateWarning}</div>}
      <div className="relative mb-4"> {/* Item Name */}
         <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">{selectedItem?.subtype === "dish" ? "Dish Name *" : "Restaurant Name *"}</label>
         <input id="itemName" type="text" placeholder={selectedItem?.subtype === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza"} value={newItemName} onChange={handleItemNameChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]" required aria-required="true" autoComplete="off" />
        {isLoadingSuggestions && (newItemName.length > 1) && <div className="absolute right-2 top-9 text-xs text-gray-500"><Loader2 size={14} className="animate-spin inline-block"/></div>}
        {!isLoadingSuggestions && ((selectedItem?.subtype === "dish" && dishSuggestions.length > 0) || (selectedItem?.subtype === "restaurant" && placeSuggestions.length > 0)) && ( <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]"> {(selectedItem?.subtype === "dish" ? dishSuggestions : placeSuggestions).map((suggestion, index) => ( <li key={suggestion.place_id || suggestion || `sug-${index}`} onClick={() => selectedItem?.subtype === "dish" ? handleDishSelect(suggestion) : handlePlaceSelect(suggestion)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" role="option"> {suggestion.description || suggestion} </li> ))} </ul> )}
      </div>
      {selectedItem?.subtype === "dish" && ( /* Restaurant Input */
        <div className="relative mb-4">
            <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">Restaurant *</label>
            <input id="restaurantName" type="text" placeholder="Search restaurant..." value={restaurantInput} onChange={handleRestaurantInputChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]" required aria-required="true" autoComplete="off" />
            {isLoadingSuggestions && restaurantInput.length > 2 && <div className="absolute right-2 top-9 text-xs text-gray-500"><Loader2 size={14} className="animate-spin inline-block"/></div>}
            {!isLoadingSuggestions && placeSuggestions.length > 0 && restaurantInput.length > 2 && ( <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]"> {placeSuggestions.map((suggestion) => ( <li key={suggestion.place_id} onClick={() => handlePlaceSelect(suggestion)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" role="option"> {suggestion.description} </li> ))} </ul> )}
            {selectedPlaceDetails && restaurantInput && ( <div className="text-xs text-gray-500 mt-1 pl-1"> Selected: {selectedPlaceDetails.name}, {selectedPlaceDetails.city} </div> )}
        </div> )}
       {selectedItem?.subtype === "restaurant" && ( /* Autofilled Location */ <div className="mb-4"> <label className="block text-sm font-medium text-gray-700 mb-1"> Location (Autofilled) </label> <input type="text" value={autoLocation || (selectedPlaceDetails?.formattedAddress || '')} readOnly placeholder="Select restaurant" className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none text-gray-600 text-sm" tabIndex={-1} /> </div> )}
      <div className="mb-4"> {/* Tag Selection */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Max 5):</label>
        {selectedTags.length > 0 && ( <div className="mb-3 p-2 border border-dashed border-gray-300 rounded-lg flex flex-wrap gap-2"> {selectedTags.map((tag) => ( <span key={tag} className="px-2.5 py-1 bg-[#E9D8CC] text-[#6e5a4c] rounded-full text-sm flex items-center"> #{tag} <button onClick={() => handleTagToggle(tag)} className="ml-1.5 text-[#9c8270] hover:text-[#6e5a4c]"> <X size={14} /> </button> </span> ))} </div> )}
        <div className="mb-3 min-h-[2.5rem]">
          <p className="text-xs text-gray-500 mb-1 flex items-center"> Suggestions: {isLoadingHashtags && <Loader2 size={14} className="animate-spin ml-2"/>} </p>
          <div className="flex flex-wrap gap-1.5">
            {!isLoadingHashtags && suggestedHashtags.length === 0 && <p className="text-xs text-gray-400">No suggestions.</p>}
            {!isLoadingHashtags && suggestedHashtags.map((tag) => { const isSelected = selectedTags.includes(tag); const isDisabled = selectedTags.length >= 5 && !isSelected; return ( <button key={tag} onClick={() => !isDisabled && handleTagToggle(tag)} className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${ isSelected ? "bg-[#E9D8CC] text-[#6e5a4c] border-[#E9D8CC]" : isDisabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-[#E9D8CC]/50 hover:border-[#D1B399]/50 hover:text-[#6e5a4c]" }`} disabled={isDisabled} > #{tag} </button> ); })}
          </div>
        </div>
        <div className="flex gap-2 items-center">
            <input type="text" value={manualHashtag} onChange={(e) => { setManualHashtag(e.target.value); if (errorMessage.includes('tag')) setErrorMessage(''); }} onKeyPress={(e) => e.key === 'Enter' && handleAddManualHashtag()} placeholder="Add custom tag..." className="flex-grow p-2 border border-gray-300 rounded-lg text-sm" disabled={selectedTags.length >= 5} />
            <Button onClick={handleAddManualHashtag} variant="tertiary" size="sm" className="px-3 py-2" disabled={!manualHashtag.trim() || selectedTags.length >= 5} > Add </Button>
        </div>
         {selectedTags.length >= 5 && <p className="text-xs text-red-500 mt-1">Tag limit.</p>}
      </div>
      <Button variant="primary" className="w-full" onClick={handleSubmitNewItem} disabled={ isLoadingSuggestions || isLoadingHashtags || !newItemName.trim() || (selectedItem?.subtype === 'dish' && !restaurantInput.trim()) || ((selectedItem?.subtype === 'restaurant' || selectedItem?.subtype === 'dish') && !selectedPlaceDetails) } > Submit for Review </Button>
    </div>
  );
  const renderAddToListMode = () => ( <div> {selectedItem && <p className="text-gray-600 mb-4">Add <strong>{selectedItem.name}</strong> to list:</p>} <div className="space-y-2 max-h-60 overflow-y-auto mb-4 no-scrollbar p-1"> {filteredUserLists.length > 0 ? ( filteredUserLists.map((list) => ( <div key={list.id} className="border rounded-lg p-3 flex justify-between items-center cursor-pointer border-gray-200 hover:border-[#D1B399]" onClick={() => handleAddToList(list.id)} role="button" tabIndex={0}> <span>{list.name || "Unnamed"}</span> <span className="font-medium text-[#D1B399]">Add</span> </div> )) ) : ( <p className="text-gray-500 text-center py-4">No lists. Create below!</p> )} </div> {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>} <Button variant="tertiary" className="w-full" onClick={() => { setMode("createNewList"); setErrorMessage(""); setNewListName(""); }}> Create New List </Button> </div> );
  const renderCreateNewListMode = () => ( <div> <input type="text" placeholder="New list name" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg mb-4" /> <div className="flex items-center mb-4"> <input type="checkbox" id="isPublic" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="mr-2 h-4 w-4 text-[#D1B399]" /> <label htmlFor="isPublic" className="text-gray-700">Make public</label> </div> {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>} <div className="flex flex-col sm:flex-row gap-2"> <Button variant="tertiary" className="flex-1" onClick={() => { if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') setMode("addToList"); else closeQuickAdd(); setErrorMessage(""); }}> Cancel </Button> <Button variant="primary" className="flex-1" onClick={handleCreateNewList} disabled={!newListName.trim()}> Create List{selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission' ? " & Add" : ""} </Button> </div> </div> );

  return ( <Modal isOpen={isOpen} onClose={closeQuickAdd} title={ mode === "submission" ? `Add ${selectedItem?.subtype === "dish" ? "Dish" : "Restaurant"}` : mode === "createNewList" ? "Create List" : selectedItem ? `Add "${selectedItem.name}"` : "Quick Add" } > {mode === "addToList" && renderAddToListMode()} {mode === "createNewList" && renderCreateNewListMode()} {mode === "submission" && renderSubmissionMode()} </Modal> );
});
export default QuickAddPopup;