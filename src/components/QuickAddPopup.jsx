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
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [manualHashtag, setManualHashtag] = useState("");
  const [autoLocation, setAutoLocation] = useState("");
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
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
    resetForm();
    if (selectedItem?.type === "submission") {
      setMode("submission");
    } else if (selectedItem?.type === "createNewList") {
      setMode("createNewList");
    } else if (selectedItem) {
      setMode("addToList");
    } else {
      closeQuickAdd();
    }
  }, [isOpen, selectedItem, closeQuickAdd, resetForm]);

  const fetchPlaceSuggestions = useCallback(async (input) => {
    if (!input || input.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    if (!GOOGLE_PLACES_API_KEY) {
      setErrorMessage("Places API key not configured.");
      setPlaceSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setPlaceSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      setPlaceSuggestions([]);
      setErrorMessage(`Failed to fetch locations: ${error.message}`);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const fetchDishSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) {
      setDishSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/common-dishes?input=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error('Failed to fetch dish suggestions');
      const data = await response.json();
      setDishSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching dish suggestions:', error);
      setDishSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleRestaurantNameChange = useCallback((e) => {
    const value = e.target.value;
    setNewItemName(value);
    setDuplicateWarning("");
    setSelectedPlaceDetails(null);
    setAutoLocation("");
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  }, [fetchPlaceSuggestions]);

  const handleDishNameChange = useCallback((e) => {
    const value = e.target.value;
    setNewItemName(value);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchDishSuggestions(value);
    }, 300);
  }, [fetchDishSuggestions]);

  const handleRestaurantInputChange = useCallback((e) => {
    const value = e.target.value;
    setRestaurantInput(value);
    setSelectedPlaceDetails(null);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value);
    }, 300);
  }, [fetchPlaceSuggestions]);

  const handlePlaceSelect = useCallback(async (place) => {
    if (!place?.place_id) return;
    if (selectedItem?.subtype === 'restaurant') {
      setNewItemName(place.description.split(',')[0].trim());
    }
    if (selectedItem?.subtype === 'dish') {
      setRestaurantInput(place.description);
    }
    setPlaceSuggestions([]);
    setIsLoadingSuggestions(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const details = await response.json();
      setSelectedPlaceDetails({
        name: details.name,
        placeId: place.place_id,
        city: details.city,
        neighborhood: details.neighborhood,
        formattedAddress: details.formattedAddress,
      });
      if (selectedItem?.subtype === 'restaurant') {
        setAutoLocation(details.formattedAddress);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      setErrorMessage(`Failed to get details: ${error.message}`);
      setSelectedPlaceDetails(null);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [selectedItem?.subtype]);

  const handleDishSelect = useCallback((dishName) => {
    setNewItemName(dishName);
    setDishSuggestions([]);
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5 ? [...prev, tag] : prev
    );
  }, []);

  const handleAddManualHashtag = useCallback(() => {
    const trimmedTag = manualHashtag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setManualHashtag("");
    } else if (selectedTags.length >= 5) {
      setErrorMessage("Maximum 5 tags allowed.");
    } else if (selectedTags.includes(trimmedTag)) {
      setErrorMessage(`Tag "#${trimmedTag}" already added.`);
    } else {
      setManualHashtag("");
    }
  }, [manualHashtag, selectedTags]);

  const handleAddToList = useCallback(async (listId) => {
    if (selectedItem) {
      const updatedList = await addToList(listId, selectedItem);
      if (updatedList) {
        closeQuickAdd();
      } else {
        setErrorMessage("Failed to add item to list.");
      }
    }
  }, [selectedItem, addToList, closeQuickAdd]);

  const handleCreateNewList = useCallback(async () => {
    if (newListName) {
      const newListData = {
        name: newListName,
        isPublic: isPublic,
      };
      const savedList = await addToList(null, newListData, true);
      if (savedList) {
        if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') {
          await handleAddToList(savedList.id);
        } else {
          closeQuickAdd();
        }
        await fetchUserLists(); // Ensure MyLists updates
      } else {
        setErrorMessage("Failed to create list. Please try again.");
      }
    }
  }, [newListName, isPublic, addToList, closeQuickAdd, selectedItem, handleAddToList, fetchUserLists]);

  const handleSubmitNewItem = useCallback(async () => {
    if (!newItemName) {
      setErrorMessage("Name is required.");
      return;
    }
    if (selectedItem?.subtype === 'dish' && !restaurantInput) {
      setErrorMessage("Restaurant is required for a dish.");
      return;
    }
    if ((selectedItem?.subtype === 'restaurant' || selectedItem?.subtype === 'dish') && !selectedPlaceDetails) {
      setErrorMessage("Please select a valid location from the suggestions.");
      return;
    }
    if (selectedItem?.subtype === 'restaurant' && duplicateWarning) {
      setErrorMessage(duplicateWarning);
      return;
    }

    const submissionData = {
      type: selectedItem?.subtype,
      name: selectedItem?.subtype === 'restaurant' ? selectedPlaceDetails?.name || newItemName : newItemName,
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      location: selectedItem?.subtype === 'restaurant'
        ? selectedPlaceDetails?.formattedAddress || autoLocation
        : selectedPlaceDetails?.name || restaurantInput,
      city: selectedPlaceDetails?.city || 'Unknown',
      neighborhood: selectedPlaceDetails?.neighborhood || 'Unknown',
    };

    await addPendingSubmission(submissionData);
    closeQuickAdd();
  }, [
    newItemName, restaurantInput, selectedTags, selectedPlaceDetails, autoLocation,
    selectedItem?.subtype, addPendingSubmission, closeQuickAdd, duplicateWarning
  ]);

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
      const isDuplicate = checkDuplicateRestaurant(itemToCheck);
      if (isDuplicate) {
        setDuplicateWarning(
          `Restaurant "${itemToCheck.name}" may already exist in ${itemToCheck.neighborhood}, ${itemToCheck.city}.`
        );
      } else {
        setDuplicateWarning("");
      }
    } else {
      setDuplicateWarning("");
    }
  }, [selectedPlaceDetails, checkDuplicateRestaurant, mode, selectedItem?.subtype]);

  const filteredUserLists = useMemo(() => {
    if (!Array.isArray(userLists)) return [];
    return userLists;
  }, [userLists]);

  if (!isOpen) return null;

  const renderAddToListMode = () => (
    <div>
      {selectedItem && <p className="text-gray-600 mb-4">Add <strong>{selectedItem.name}</strong> to a list:</p>}
      <div className="space-y-2 max-h-60 overflow-y-auto mb-4 no-scrollbar">
        {filteredUserLists.length > 0 ? (
          filteredUserLists.map((list) => (
            <div
              key={list.id}
              className="border border-gray-200 hover:border-[#D1B399] rounded-lg p-3 flex justify-between items-center cursor-pointer transition-colors duration-150"
              onClick={() => handleAddToList(list.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleAddToList(list.id)}
            >
              <span>{list.name || "Unnamed List"}</span>
              <span className="text-[#D1B399] font-medium">Add</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No lists found. Create one below!</p>
        )}
      </div>
      <Button
        variant="tertiary"
        className="w-full"
        onClick={() => setMode("createNewList")}
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
        onChange={(e) => setNewItemName(e.target.value)}
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
      <Button
        variant="primary"
        className="w-full"
        onClick={handleCreateNewList}
        disabled={!newListName.trim()}
      >
        Create List{selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission' ? " & Add Item" : ""}
      </Button>
    </div>
  );

  const renderSubmissionMode = () => (
    <div>
      {errorMessage && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMessage}</div>}
      {duplicateWarning && !errorMessage && <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm">{duplicateWarning}</div>}

      <div className="relative mb-4">
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
          {selectedItem?.subtype === "dish" ? "Dish Name *" : "Restaurant Name *"}
        </label>
        <input
          id="itemName"
          type="text"
          placeholder={selectedItem?.subtype === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza"}
          value={newItemName}
          onChange={selectedItem?.subtype === "dish" ? handleDishNameChange : handleRestaurantNameChange}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
          required
          aria-required="true"
        />
        {isLoadingSuggestions && <div className="absolute right-2 top-9 text-xs text-gray-500">Loading...</div>}
        {!isLoadingSuggestions && (selectedItem?.subtype === "dish" ? dishSuggestions : placeSuggestions).length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]">
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
            onChange={handleRestaurantInputChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
            required
            aria-required="true"
          />
          {isLoadingSuggestions && restaurantInput && <div className="absolute right-2 top-9 text-xs text-gray-500">Loading...</div>}
          {!isLoadingSuggestions && placeSuggestions.length > 0 && restaurantInput && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-40 overflow-y-auto mt-[-1px]">
              {placeSuggestions.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  onClick={() => handlePlaceSelect(suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  role="option"
                  aria-selected="false"
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
          {selectedPlaceDetails && restaurantInput && (
            <div className="text-xs text-gray-500 mt-1 pl-1">
              Selected: {selectedPlaceDetails.name}, {selectedPlaceDetails.city}
            </div>
          )}
        </div>
      )}

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
            tabIndex={-1}
          />
        </div>
      )}

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
                      ? "bg-[#E9D8CC] text-[#6e5a4c] border-[#E9D8CC]"
                      : isDisabled
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-[#E9D8CC] hover:border-[#D1B399] hover:text-[#6e5a4c]"
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
              if (errorMessage.includes('tag')) setErrorMessage('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddManualHashtag()}
            placeholder="Add custom tag..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399] text-sm"
            aria-label="Add custom tag"
            disabled={selectedTags.length >= 5}
          />
          <Button
            onClick={handleAddManualHashtag}
            variant="tertiary"
            size="sm"
            className="px-3 py-2"
            disabled={!manualHashtag.trim() || selectedTags.length >= 5}
          >
            Add
          </Button>
        </div>
        {selectedTags.length >= 5 && <p className="text-xs text-red-500 mt-1">Tag limit reached.</p>}
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleSubmitNewItem}
        disabled={
          !newItemName.trim() ||
          isLoadingSuggestions ||
          (selectedItem?.subtype === 'dish' && !selectedPlaceDetails) ||
          (selectedItem?.subtype === 'restaurant' && !selectedPlaceDetails) ||
          (selectedItem?.subtype === 'restaurant' && !!duplicateWarning && !errorMessage)
        }
      >
        Submit for Review
      </Button>
    </div>
  );

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