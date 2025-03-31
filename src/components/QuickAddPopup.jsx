// src/components/QuickAddPopup.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore.js";
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Modal from "@/components/UI/Modal.jsx";
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js";

const QuickAddPopup = React.memo(() => {
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();
  const { userLists, addToList, addPendingSubmission, checkDuplicateRestaurant, fetchUserLists } = useAppStore();

  const [mode, setMode] = useState("addToList");
  const [newItemName, setNewItemName] = useState(""); // For dish name or restaurant name depending on mode
  const [restaurantInput, setRestaurantInput] = useState(""); // Specifically for dish's restaurant input
  const [selectedTags, setSelectedTags] = useState([]);
  const [manualHashtag, setManualHashtag] = useState("");
  const [autoLocation, setAutoLocation] = useState(""); // Used for restaurant submission autofill
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null); // Holds details from Places API
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([
    "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert",
    "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining"
  ]);
  const [newListName, setNewListName] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const debounceTimeoutRef = React.useRef(null);

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
    setErrorMessage("");
    setDuplicateWarning("");
    setNewListName("");
    setIsPublic(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    // Reset form whenever it opens or selected item changes
    resetForm();
    if (selectedItem?.type === "submission") {
      setMode("submission");
    } else if (selectedItem?.type === "createNewList") {
      setMode("createNewList");
    } else if (selectedItem) {
      setMode("addToList");
      // Pre-fill tags if adding an existing item with tags
      if (Array.isArray(selectedItem.tags)) {
          setSelectedTags(selectedItem.tags.slice(0, 5)); // Apply limit
      }
    } else {
      closeQuickAdd();
    }
  }, [isOpen, selectedItem, closeQuickAdd, resetForm]);

  const fetchPlaceSuggestions = useCallback(async (input) => {
    console.log(`[QuickAddPopup fetchPlaceSuggestions] Input: "${input}"`);
    if (!input || input.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    if (!GOOGLE_PLACES_API_KEY) {
      setErrorMessage("Places API key not configured.");
      console.error("[QuickAddPopup fetchPlaceSuggestions] Missing Google API Key");
      setPlaceSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      console.log(`[QuickAddPopup fetchPlaceSuggestions] Received ${data?.length || 0} suggestions.`);
      setPlaceSuggestions(data || []);
    } catch (error) {
      console.error("[QuickAddPopup fetchPlaceSuggestions] Error fetching place suggestions:", error);
      setPlaceSuggestions([]);
      setErrorMessage(`Failed to fetch locations: ${error.message}`);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const fetchDishSuggestions = useCallback(async (input) => {
    console.log(`[QuickAddPopup fetchDishSuggestions] Input: "${input}"`);
    if (!input || input.length < 2) {
      setDishSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/common-dishes?input=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error('Failed to fetch dish suggestions');
      const data = await response.json();
      console.log(`[QuickAddPopup fetchDishSuggestions] Received ${data?.length || 0} suggestions.`);
      setDishSuggestions(data || []);
    } catch (error) {
      console.error('[QuickAddPopup fetchDishSuggestions] Error fetching dish suggestions:', error);
      setDishSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Handler for the main item name input (Restaurant Name OR Dish Name)
  const handleItemNameChange = useCallback((e) => {
    const value = e.target.value;
    setNewItemName(value);

    // Clear previous place details if name changes
    setSelectedPlaceDetails(null);
    setAutoLocation("");
    setPlaceSuggestions([]); // Clear suggestions immediately

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    // Fetch suggestions based on submission type
    if (selectedItem?.subtype === "restaurant") {
        console.log("[QuickAddPopup handleItemNameChange] Debouncing place suggestions for restaurant name...");
        setDuplicateWarning(""); // Clear warning on new input
        debounceTimeoutRef.current = setTimeout(() => {
          fetchPlaceSuggestions(value);
        }, 300);
    } else if (selectedItem?.subtype === "dish") {
        console.log("[QuickAddPopup handleItemNameChange] Debouncing dish suggestions for dish name...");
        debounceTimeoutRef.current = setTimeout(() => {
            fetchDishSuggestions(value);
        }, 300);
    }
  }, [fetchPlaceSuggestions, fetchDishSuggestions, selectedItem?.subtype]);


  // Handler specifically for the "Restaurant" input when submitting a DISH
  const handleRestaurantInputChange = useCallback((e) => {
    const value = e.target.value;
    setRestaurantInput(value);
    console.log(`[QuickAddPopup handleRestaurantInputChange] Input: "${value}"`);

    // Clear previous place details if restaurant input changes
    setSelectedPlaceDetails(null);
    setPlaceSuggestions([]); // Clear suggestions immediately

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    // Fetch PLACE suggestions for the restaurant input
    console.log("[QuickAddPopup handleRestaurantInputChange] Debouncing place suggestions for dish's restaurant...");
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  }, [fetchPlaceSuggestions]);

  const handlePlaceSelect = useCallback(async (place) => {
    console.log("[QuickAddPopup handlePlaceSelect] Place selected:", place);
    if (!place?.place_id) {
      console.warn("[QuickAddPopup handlePlaceSelect] No place_id found in selected place.");
      return;
    }

    const placeName = place.description.split(',')[0].trim();
    setPlaceSuggestions([]); // Clear suggestions list

    // Update the correct input field based on context
    if (selectedItem?.subtype === 'restaurant') {
      setNewItemName(placeName); // Update the main name input for restaurant submission
      console.log(`[QuickAddPopup handlePlaceSelect] Set newItemName to: "${placeName}" (for restaurant submission)`);
    } else if (selectedItem?.subtype === 'dish') {
      setRestaurantInput(place.description); // Update the restaurant input for dish submission
      console.log(`[QuickAddPopup handlePlaceSelect] Set restaurantInput to: "${place.description}" (for dish submission)`);
    }

    setIsLoadingSuggestions(true);
    setErrorMessage("");
    try {
      console.log(`[QuickAddPopup handlePlaceSelect] Fetching details for placeId: ${place.place_id}`);
      const response = await fetch(`${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const details = await response.json();
      console.log("[QuickAddPopup handlePlaceSelect] Fetched details:", details);
      setSelectedPlaceDetails({ // Store the structured details
        name: details.name,
        placeId: place.place_id,
        city: details.city,
        neighborhood: details.neighborhood,
        formattedAddress: details.formattedAddress,
      });

      // If submitting a restaurant, autofill the location field
      if (selectedItem?.subtype === 'restaurant') {
        setAutoLocation(details.formattedAddress);
        console.log(`[QuickAddPopup handlePlaceSelect] Set autoLocation to: "${details.formattedAddress}"`);
      }
    } catch (error) {
      console.error("[QuickAddPopup handlePlaceSelect] Error fetching place details:", error);
      setErrorMessage(`Failed to get details: ${error.message}`);
      setSelectedPlaceDetails(null); // Clear details on error
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [selectedItem?.subtype]); // Depend on subtype to set the correct input

  const handleDishSelect = useCallback((dishName) => {
    console.log(`[QuickAddPopup handleDishSelect] Selected: "${dishName}"`);
    setNewItemName(dishName);
    setDishSuggestions([]);
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5 ? [...prev, tag] : prev // Limit to 5 tags
    );
  }, []);

  const handleAddManualHashtag = useCallback(() => {
    const trimmedTag = manualHashtag.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); // Basic sanitization
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setManualHashtag("");
      setErrorMessage(""); // Clear error on success
    } else if (selectedTags.length >= 5) {
      setErrorMessage("Maximum 5 tags allowed.");
    } else if (selectedTags.includes(trimmedTag)) {
      setErrorMessage(`Tag "#${trimmedTag}" already added.`);
    } else {
      // Clear input even if tag is empty/invalid after trimming
      setManualHashtag("");
    }
  }, [manualHashtag, selectedTags]);

  const handleAddToList = useCallback(async (listId) => {
    if (selectedItem) {
        console.log(`[QuickAddPopup handleAddToList] Adding item to list ID: ${listId}`, selectedItem);
        // Ensure item includes tags if selected during the add process
        const itemToAdd = {
            ...selectedItem,
            tags: selectedItem.tags || selectedTags || [], // Use tags from original item or newly selected ones
        };
        const updatedList = await addToList(listId, itemToAdd);
        if (updatedList) {
            console.log("[QuickAddPopup handleAddToList] Successfully added to list.");
            closeQuickAdd();
        } else {
            setErrorMessage("Failed to add item to list.");
            console.error("[QuickAddPopup handleAddToList] addToList action failed.");
        }
    } else {
        console.error("[QuickAddPopup handleAddToList] No selectedItem to add.");
    }
  }, [selectedItem, addToList, closeQuickAdd, selectedTags]);


  const handleCreateNewList = useCallback(async () => {
    if (!newListName.trim()) {
        setErrorMessage("List name cannot be empty.");
        return;
    }
    console.log(`[QuickAddPopup handleCreateNewList] Creating list: "${newListName}"`);
    const newListData = {
      name: newListName.trim(),
      isPublic: isPublic,
    };
    const savedList = await addToList(null, newListData, true); // `true` indicates new list
    if (savedList && savedList.id) {
      console.log(`[QuickAddPopup handleCreateNewList] List created with ID: ${savedList.id}`);
      // If an item was selected to be added, add it to the new list
      if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') {
        console.log(`[QuickAddPopup handleCreateNewList] Adding originally selected item to new list ${savedList.id}`);
        await handleAddToList(savedList.id); // handleAddToList now closes the popup
      } else {
        closeQuickAdd(); // Close popup if only creating list
      }
      // Consider fetching lists again if MyLists isn't automatically updating via state
      await fetchUserLists();
    } else {
      setErrorMessage("Failed to create list. Please try again.");
      console.error("[QuickAddPopup handleCreateNewList] addToList action failed to return a valid list.");
    }
  }, [newListName, isPublic, addToList, closeQuickAdd, selectedItem, handleAddToList, fetchUserLists]);


  const handleSubmitNewItem = useCallback(async () => {
    console.log("[QuickAddPopup handleSubmitNewItem] Attempting submission...");
    console.log("[QuickAddPopup handleSubmitNewItem] State:", {
        newItemName, restaurantInput, selectedTags, selectedPlaceDetails, autoLocation, subtype: selectedItem?.subtype
    });

    // Basic Validations
    if (!newItemName.trim()) {
      setErrorMessage(selectedItem?.subtype === 'dish' ? "Dish Name is required." : "Restaurant Name is required.");
      return;
    }
    if (selectedItem?.subtype === 'dish' && !restaurantInput.trim()) {
      setErrorMessage("Restaurant is required for a dish submission.");
      return;
    }

    // Place Selection Validation
    if ((selectedItem?.subtype === 'restaurant' || selectedItem?.subtype === 'dish') && !selectedPlaceDetails) {
        // Allow submission without place details ONLY IF the input doesn't match any suggestion exactly? Risky.
        // For now, enforce selection if submitting restaurant/dish.
        setErrorMessage("Please select a valid location/restaurant from the suggestions.");
        console.warn("[QuickAddPopup handleSubmitNewItem] Submission blocked: No place details selected.");
        return;
    }

    // Duplicate Warning Check (for restaurants)
    if (selectedItem?.subtype === 'restaurant' && duplicateWarning) {
      // Maybe allow submission despite warning? Or enforce clearing it?
      // For now, let's just log it and proceed, user can override.
      console.warn("[QuickAddPopup handleSubmitNewItem] Submitting despite duplicate warning:", duplicateWarning);
      // setErrorMessage(duplicateWarning); // Option: uncomment to block submission
      // return;
    }

    // Prepare Submission Data
    const submissionData = {
      type: selectedItem?.subtype, // 'dish' or 'restaurant'
      name: selectedItem?.subtype === 'restaurant'
            ? selectedPlaceDetails?.name // Use name from Google Details for restaurants
            : newItemName.trim(), // Use user input for dish name
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      // For 'location', use the selected Place Name for dishes, and address for restaurants
      location: selectedItem?.subtype === 'dish'
            ? selectedPlaceDetails?.name // Restaurant name for dish
            : selectedPlaceDetails?.formattedAddress || autoLocation, // Full address for restaurant
      city: selectedPlaceDetails?.city || 'Unknown',
      neighborhood: selectedPlaceDetails?.neighborhood || 'Unknown',
      user_id: 1 // Hardcoded user ID for now
    };

    console.log("[QuickAddPopup handleSubmitNewItem] Prepared submission data:", submissionData);

    // Call API
    setErrorMessage(""); // Clear previous errors
    try {
        await addPendingSubmission(submissionData);
        console.log("[QuickAddPopup handleSubmitNewItem] Submission successful.");
        closeQuickAdd();
    } catch (error) {
        console.error("[QuickAddPopup handleSubmitNewItem] Submission failed:", error);
        setErrorMessage(`Submission failed: ${error.message}`);
    }

  }, [
    newItemName, restaurantInput, selectedTags, selectedPlaceDetails, autoLocation,
    selectedItem?.subtype, addPendingSubmission, closeQuickAdd, duplicateWarning
  ]);

  // Check for duplicate restaurant when place details are selected for a restaurant submission
  useEffect(() => {
    if (
      mode === "submission" &&
      selectedItem?.subtype === "restaurant" &&
      selectedPlaceDetails?.name &&
      selectedPlaceDetails?.city &&
      selectedPlaceDetails?.neighborhood
    ) {
      const itemToCheck = {
        name: selectedPlaceDetails.name,
        city: selectedPlaceDetails.city,
        neighborhood: selectedPlaceDetails.neighborhood,
      };
      console.log("[QuickAddPopup useEffect] Checking duplicate for restaurant:", itemToCheck);
      const isDuplicate = checkDuplicateRestaurant(itemToCheck);
      if (isDuplicate) {
        const warningMsg = `Restaurant "${itemToCheck.name}" may already exist in ${itemToCheck.neighborhood}, ${itemToCheck.city}.`;
        console.warn("[QuickAddPopup useEffect] Duplicate detected:", warningMsg);
        setDuplicateWarning(warningMsg);
      } else {
        setDuplicateWarning("");
      }
    } else {
      setDuplicateWarning(""); // Clear warning if not relevant
    }
  }, [selectedPlaceDetails, checkDuplicateRestaurant, mode, selectedItem?.subtype]);


  const filteredUserLists = useMemo(() => {
    if (!Array.isArray(userLists)) {
        console.warn("[QuickAddPopup] userLists is not an array:", userLists);
        return [];
    };
    // Exclude lists that already contain the selected item? (More complex check needed)
    return userLists;
  }, [userLists]);

  if (!isOpen) return null;

  // --- RENDER FUNCTIONS ---

  const renderAddToListMode = () => (
    <div>
      {selectedItem && <p className="text-gray-600 mb-4">Add <strong>{selectedItem.name}</strong> to a list:</p>}
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4 no-scrollbar p-1"> {/* Added padding */}
        {filteredUserLists.length > 0 ? (
          filteredUserLists.map((list) => {
            // Basic check if item might already be in the list (requires item structure in list.items)
            // const alreadyAdded = list.items?.some(item => item.id === selectedItem?.id && item.type === selectedItem?.type);
            return (
              <div
                key={list.id}
                className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition-colors duration-150 ${
                    // alreadyAdded ? "bg-gray-100 cursor-not-allowed" : "border-gray-200 hover:border-[#D1B399]"
                    "border-gray-200 hover:border-[#D1B399]" // Simplified for now
                }`}
                onClick={() => /* !alreadyAdded && */ handleAddToList(list.id)}
                role="button"
                aria-disabled={/* alreadyAdded */ false}
                tabIndex={/* alreadyAdded ? -1 : */ 0}
                onKeyPress={(e) => e.key === 'Enter' && /* !alreadyAdded && */ handleAddToList(list.id)}
              >
                <span>{list.name || "Unnamed List"}</span>
                <span className={`font-medium ${/* alreadyAdded ? "text-gray-400" : */ "text-[#D1B399]"}`}>
                    {/* alreadyAdded ? "Added" : "Add" */}
                    Add
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">No lists found. Create one below!</p>
        )}
      </div>
       {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>}
      <Button
        variant="tertiary"
        className="w-full"
        onClick={() => { setMode("createNewList"); setErrorMessage(""); setNewListName(""); }} // Reset on mode change
      >
        Create New List
      </Button>
    </div>
  );

  const renderCreateNewListMode = () => (
    <div>
      <input
        type="text"
        placeholder="New list name"
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)} // Corrected state setter
        className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
        aria-label="New list name"
      />
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
          className="mr-2 h-4 w-4 text-[#D1B399] focus:ring-[#b89e89] border-gray-300 rounded"
        />
        <label htmlFor="isPublic" className="text-gray-700">Make this list public</label>
      </div>
      {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>}
      <div className="flex flex-col sm:flex-row gap-2">
         <Button
              variant="tertiary"
              className="flex-1"
              onClick={() => {
                  // Go back to 'Add to List' mode only if an item was originally selected
                  if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') {
                      setMode("addToList");
                  } else {
                      closeQuickAdd(); // Otherwise just close
                  }
                  setErrorMessage("");
              }}
          >
             Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleCreateNewList}
            disabled={!newListName.trim()}
          >
            Create List{selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission' ? " & Add Item" : ""}
          </Button>
      </div>
    </div>
  );

  const renderSubmissionMode = () => (
    <div>
      {/* Errors and Warnings */}
      {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>}
      {duplicateWarning && !errorMessage && <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm">{duplicateWarning}</div>}

      {/* Item Name Input (Dish or Restaurant) */}
      <div className="relative mb-4">
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
          {selectedItem?.subtype === "dish" ? "Dish Name *" : "Restaurant Name *"}
        </label>
        <input
          id="itemName"
          type="text"
          placeholder={selectedItem?.subtype === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza"}
          value={newItemName}
          onChange={handleItemNameChange} // Use combined handler
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
          required
          aria-required="true"
          autoComplete="off" // Prevent browser autocomplete interference
        />
        {/* Suggestions for Item Name */}
        {isLoadingSuggestions && (newItemName.length > 1 || (selectedItem?.subtype === "restaurant" && newItemName.length > 2)) &&
            <div className="absolute right-2 top-9 text-xs text-gray-500">Loading...</div>}
        {!isLoadingSuggestions && (
            (selectedItem?.subtype === "dish" && dishSuggestions.length > 0) ||
            (selectedItem?.subtype === "restaurant" && placeSuggestions.length > 0)
           ) && (
          <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]">
            {(selectedItem?.subtype === "dish" ? dishSuggestions : placeSuggestions).map((suggestion, index) => (
              <li
                key={suggestion.place_id || suggestion || `suggestion-${index}`}
                onClick={() => selectedItem?.subtype === "dish" ? handleDishSelect(suggestion) : handlePlaceSelect(suggestion)}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                role="option"
                aria-selected="false"
              >
                {suggestion.description || suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Restaurant Input (Only for Dish Submission) */}
      {selectedItem?.subtype === "dish" && (
        <div className="relative mb-4">
          <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant *
          </label>
          <input
            id="restaurantName"
            type="text"
            placeholder="Search for the restaurant..."
            value={restaurantInput}
            onChange={handleRestaurantInputChange} // Specific handler for this input
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
            required
            aria-required="true"
            autoComplete="off"
          />
          {/* Suggestions for Restaurant Input */}
          {isLoadingSuggestions && restaurantInput.length > 2 && <div className="absolute right-2 top-9 text-xs text-gray-500">Loading...</div>}
          {!isLoadingSuggestions && placeSuggestions.length > 0 && restaurantInput.length > 2 && ( // Only show suggestions if related input has text
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]">
              {placeSuggestions.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  onClick={() => handlePlaceSelect(suggestion)} // Selects the place
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  role="option"
                  aria-selected="false"
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
          {/* Display Selected Restaurant Details */}
          {selectedPlaceDetails && restaurantInput && ( // Show details only if input has text & details exist
            <div className="text-xs text-gray-500 mt-1 pl-1">
              Selected: {selectedPlaceDetails.name}, {selectedPlaceDetails.city}
            </div>
          )}
        </div>
      )}

       {/* Autofilled Location (Only for Restaurant Submission) */}
       {selectedItem?.subtype === "restaurant" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (Autofilled)
          </label>
          <input
            type="text"
            value={autoLocation || (selectedPlaceDetails?.formattedAddress || '')}
            readOnly
            placeholder="Select a restaurant from suggestions"
            className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none text-gray-600 text-sm"
            tabIndex={-1} // Make it non-focusable
          />
           {selectedPlaceDetails && !autoLocation && <p className="text-xs text-red-500 mt-1">Could not autofill address, but place selected.</p>}
        </div>
      )}


      {/* Tag Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags (Optional, max 5):</label>
        {selectedTags.length > 0 && (
          <div className="mb-3 p-2 border border-dashed border-gray-300 rounded-lg flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-[#E9D8CC] text-[#6e5a4c] rounded-full text-sm flex items-center">
                #{tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1.5 text-[#9c8270] hover:text-[#6e5a4c]"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedHashtags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const limitReached = selectedTags.length >= 5;
              const isDisabled = limitReached && !isSelected;
              return (
                <button
                  key={tag}
                  onClick={() => !isDisabled && handleTagToggle(tag)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors duration-150 ${
                    isSelected
                      ? "bg-[#E9D8CC] text-[#6e5a4c] border-[#E9D8CC]" // Style for selected
                      : isDisabled
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" // Style for disabled
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-[#E9D8CC]/50 hover:border-[#D1B399]/50 hover:text-[#6e5a4c]" // Style for available
                  }`}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={manualHashtag}
            onChange={(e) => {
              setManualHashtag(e.target.value);
              if (errorMessage.includes('tag')) setErrorMessage(''); // Clear tag errors on input
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddManualHashtag()}
            placeholder="Add custom tag..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399] text-sm"
            aria-label="Add custom tag"
            disabled={selectedTags.length >= 5} // Disable input when limit reached
          />
          <Button
            onClick={handleAddManualHashtag}
            variant="tertiary"
            size="sm"
            className="px-3 py-2" // Adjusted padding to match input height
            disabled={!manualHashtag.trim() || selectedTags.length >= 5}
          >
            Add
          </Button>
        </div>
         {selectedTags.length >= 5 && <p className="text-xs text-red-500 mt-1">Tag limit reached.</p>}
      </div>

      {/* Submit Button */}
      <Button
        variant="primary"
        className="w-full"
        onClick={handleSubmitNewItem}
        disabled={ // More robust disabling logic
          isLoadingSuggestions || // Disable while loading suggestions
          !newItemName.trim() || // Disable if main name is empty
          (selectedItem?.subtype === 'dish' && !restaurantInput.trim()) || // Disable if dish restaurant is empty
          // Disable if place details are required but missing
          ((selectedItem?.subtype === 'restaurant' || selectedItem?.subtype === 'dish') && !selectedPlaceDetails)
        }
      >
        Submit for Review
      </Button>
    </div>
  );

  // --- Main Modal Render ---
  return (
    <Modal
      isOpen={isOpen}
      onClose={closeQuickAdd}
      title={
        mode === "submission" ? `Add New ${selectedItem?.subtype === "dish" ? "Dish" : "Restaurant"}`
        : mode === "createNewList" ? "Create New List"
        : selectedItem ? `Add "${selectedItem.name}"` : "Quick Add"
      }
    >
      {mode === "addToList" && renderAddToListMode()}
      {mode === "createNewList" && renderCreateNewListMode()}
      {mode === "submission" && renderSubmissionMode()}
    </Modal>
  );
});

export default QuickAddPopup;