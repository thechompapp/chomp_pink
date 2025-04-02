// src/components/QuickAddPopup.jsx
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
    setSuggestedHashtags(cuisines.map(c => c.name));
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (hashtagDebounceTimeoutRef.current) clearTimeout(hashtagDebounceTimeoutRef.current);
  }, [cuisines]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    resetForm();
    if (selectedItem?.type === "submission") setMode("submission");
    else if (selectedItem?.type === "createNewList") setMode("createNewList");
    else if (selectedItem) {
      setMode("addToList");
      if (Array.isArray(selectedItem.tags)) setSelectedTags(selectedItem.tags.slice(0, 5));
      if (userLists.length === 0) fetchUserLists();
    } else {
      closeQuickAdd();
    }
  }, [isOpen, selectedItem, closeQuickAdd, resetForm, fetchUserLists, userLists.length]);

  const fetchHashtagSuggestions = useCallback(async (dishNameQuery) => {
    if (!dishNameQuery.trim()) {
      setSuggestedHashtags(cuisines.map(c => c.name));
      return;
    }
    setIsLoadingHashtags(true);
    try {
      const filteredHashtags = cuisines
        .map(c => c.name)
        .filter(h => h.toLowerCase().includes(dishNameQuery.toLowerCase()));
      setSuggestedHashtags(filteredHashtags.length > 0 ? filteredHashtags : cuisines.map(c => c.name));
    } catch (error) {
      setErrorMessage("Failed to filter hashtags.");
    } finally {
      setIsLoadingHashtags(false);
    }
  }, [cuisines]);

  const fetchPlaceSuggestions = useCallback(async (input) => {
    if (!input.trim() || !GOOGLE_PLACES_API_KEY) return;
    setIsLoadingSuggestions(true);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`
        );
        const data = await response.json();
        setPlaceSuggestions(data || []);
      } catch (error) {
        setErrorMessage("Failed to fetch place suggestions.");
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const fetchDishSuggestions = useCallback(async (input) => {
    if (!input.trim()) return;
    setIsLoadingSuggestions(true);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dishes`);
        const dishes = await response.json();
        const filteredDishes = dishes.filter(d => d.name.toLowerCase().includes(input.toLowerCase()));
        setDishSuggestions(filteredDishes.map(d => d.name));
      } catch (error) {
        setErrorMessage("Failed to fetch dish suggestions.");
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const handleItemNameChange = useCallback((e) => {
    const value = e.target.value;
    setNewItemName(value);
    if (selectedItem?.subtype === "dish") {
      fetchDishSuggestions(value);
      fetchHashtagSuggestions(value);
    } else {
      fetchPlaceSuggestions(value);
    }
  }, [fetchDishSuggestions, fetchHashtagSuggestions, fetchPlaceSuggestions, selectedItem?.subtype]);

  const handleRestaurantInputChange = useCallback((e) => {
    const value = e.target.value;
    setRestaurantInput(value);
    fetchPlaceSuggestions(value);
  }, [fetchPlaceSuggestions]);

  const handlePlaceSelect = useCallback(async (place) => {
    setRestaurantInput(place.description);
    setPlaceSuggestions([]);
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(place.place_id)}`
      );
      const details = await response.json();
      setSelectedPlaceDetails(details);
      setAutoLocation(details.formattedAddress);
    } catch (error) {
      setErrorMessage("Failed to fetch place details.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleDishSelect = useCallback((dishName) => {
    setNewItemName(dishName);
    setDishSuggestions([]);
    fetchHashtagSuggestions(dishName);
  }, [fetchHashtagSuggestions]);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5 ? [...prev, tag] : prev
    );
  }, []);

  const handleAddManualHashtag = useCallback(() => {
    const trimmedTag = manualHashtag.trim().toLowerCase();
    if (!trimmedTag || selectedTags.includes(trimmedTag) || selectedTags.length >= 5) return;
    setSelectedTags((prev) => [...prev, trimmedTag]);
    setManualHashtag("");
    if (!suggestedHashtags.includes(trimmedTag)) {
      setSuggestedHashtags((prev) => [...prev, trimmedTag]);
    }
  }, [manualHashtag, selectedTags, suggestedHashtags]);

  const handleAddToListClick = useCallback(async (listId) => {
    if (!selectedItem || selectedItem.type === 'submission' || selectedItem.type === 'createNewList' || !selectedItem.id || !selectedItem.type) {
      setErrorMessage("Cannot add this item.");
      return;
    }
    const itemPayload = { item_type: selectedItem.type, item_id: selectedItem.id };
    setErrorMessage("");
    try {
      // Use addToList if fully implemented in store; otherwise, direct fetch
      if (typeof addToList === 'function') {
        await addToList(listId, itemPayload, false);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/lists/${listId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemPayload),
        });
        if (!response.ok) throw new Error('Failed to add item to list');
      }
      closeQuickAdd();
    } catch (error) {
      setErrorMessage(`Failed to add: ${error.message}`);
    }
  }, [selectedItem, addToList, closeQuickAdd]);

  const handleCreateNewList = useCallback(async () => {
    if (!newListName.trim()) {
      setErrorMessage("List name cannot be empty.");
      return;
    }
    const newListData = { name: newListName.trim(), isPublic: isPublic };
    setErrorMessage("");
    try {
      const savedList = await addToList(null, newListData, true);
      if (savedList?.id) {
        if (selectedItem && selectedItem.type !== 'createNewList' && selectedItem.type !== 'submission') {
          await handleAddToListClick(savedList.id);
        } else {
          closeQuickAdd();
        }
      } else {
        throw new Error("List creation failed");
      }
    } catch (error) {
      setErrorMessage(`Failed to create list: ${error.message}`);
    }
  }, [newListName, isPublic, addToList, closeQuickAdd, selectedItem, handleAddToListClick]);

  const handleSubmitNewItem = useCallback(async () => {
    if (!newItemName.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }
    const isDish = selectedItem?.subtype === "dish";
    if (isDish && !restaurantInput.trim()) {
      setErrorMessage("Restaurant name is required for dishes.");
      return;
    }
    const submissionData = {
      type: isDish ? "dish" : "restaurant",
      name: newItemName.trim(),
      location: isDish ? restaurantInput.trim() : null,
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      city: selectedPlaceDetails?.city || null,
      neighborhood: selectedPlaceDetails?.neighborhood || null,
    };
    setErrorMessage("");
    try {
      await addPendingSubmission(submissionData);
      closeQuickAdd();
    } catch (error) {
      setErrorMessage(`Failed to submit: ${error.message}`);
    }
  }, [newItemName, restaurantInput, selectedTags, selectedPlaceDetails, selectedItem?.subtype, addPendingSubmission, closeQuickAdd]);

  useEffect(() => {
    if (mode !== "submission" || !selectedPlaceDetails || !checkDuplicateRestaurant) return;
    const checkDupes = async () => {
      const duplicates = await checkDuplicateRestaurant(selectedPlaceDetails);
      if (duplicates.length > 0) {
        setDuplicateWarning(`Possible duplicate(s): ${duplicates.map(d => d.name).join(", ")}`);
      } else {
        setDuplicateWarning("");
      }
    };
    checkDupes();
  }, [selectedPlaceDetails, checkDuplicateRestaurant, mode]);

  const memoizedUserLists = useMemo(() => {
    return Array.isArray(userLists) ? userLists.filter(list => list && list.id != null) : [];
  }, [userLists]);

  if (!isOpen) return null;

  // --- RENDER FUNCTIONS ---
  const renderSubmissionMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {selectedItem?.subtype === "dish" ? "Dish Name" : "Restaurant Name"}
        </label>
        <input
          type="text"
          value={newItemName}
          onChange={handleItemNameChange}
          placeholder={selectedItem?.subtype === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza"}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
        />
        {isLoadingSuggestions && (
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <Loader2 className="animate-spin mr-2" size={16} /> Loading suggestions...
          </div>
        )}
        {selectedItem?.subtype === "dish" && dishSuggestions.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md">
            {dishSuggestions.map((dish, index) => (
              <li
                key={index}
                onClick={() => handleDishSelect(dish)}
                className="px-3 py-2 hover:bg-[#D1B399]/10 cursor-pointer text-sm text-gray-700"
              >
                {dish}
              </li>
            ))}
          </ul>
        )}
        {selectedItem?.subtype !== "dish" && placeSuggestions.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md">
            {placeSuggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handlePlaceSelect(place)}
                className="px-3 py-2 hover:bg-[#D1B399]/10 cursor-pointer text-sm text-gray-700"
              >
                {place.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedItem?.subtype === "dish" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
          <input
            type="text"
            value={restaurantInput}
            onChange={handleRestaurantInputChange}
            placeholder="e.g., Joe's Pizza"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
          />
          {placeSuggestions.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-md">
              {placeSuggestions.map((place, index) => (
                <li
                  key={index}
                  onClick={() => handlePlaceSelect(place)}
                  className="px-3 py-2 hover:bg-[#D1B399]/10 cursor-pointer text-sm text-gray-700"
                >
                  {place.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (max 5)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#D1B399] text-white rounded-full text-xs flex items-center"
            >
              #{tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualHashtag}
            onChange={(e) => setManualHashtag(e.target.value)}
            placeholder="Add custom tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
          />
          <Button
            onClick={handleAddManualHashtag}
            variant="primary"
            size="sm"
            className="bg-[#D1B399] text-white hover:bg-[#b89e89]"
            disabled={selectedTags.length >= 5 || !manualHashtag.trim()}
          >
            Add
          </Button>
        </div>
        {isLoadingHashtags ? (
          <div className="flex items-center text-gray-500 text-sm mt-2">
            <Loader2 className="animate-spin mr-2" size={16} /> Loading hashtag suggestions...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedHashtags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-2 py-1 text-sm rounded-full border ${
                  selectedTags.includes(tag)
                    ? "bg-[#D1B399] text-white border-[#D1B399]"
                    : "border-gray-300 text-gray-700 hover:bg-[#D1B399]/10"
                }`}
                disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
      {duplicateWarning && (
        <p className="text-yellow-600 text-sm">{duplicateWarning}</p>
      )}
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
      <Button
        onClick={handleSubmitNewItem}
        variant="primary"
        className="w-full bg-[#D1B399] text-white hover:bg-[#b89e89]"
      >
        Submit for Review
      </Button>
    </div>
  );

  const renderCreateNewListMode = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="e.g., My Favorite Dishes"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-[#D1B399] border-gray-300 rounded focus:ring-[#D1B399]"
        />
        <label className="ml-2 text-sm text-gray-700">Make this list public</label>
      </div>
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
      <Button
        onClick={handleCreateNewList}
        variant="primary"
        className="w-full bg-[#D1B399] text-white hover:bg-[#b89e89]"
      >
        Create List
      </Button>
    </div>
  );

  const renderAddToListMode = () => (
    <div className="space-y-4">
      <p className="text-gray-700">
        Add <span className="font-medium">{selectedItem?.name}</span> to a list:
      </p>
      {memoizedUserLists.length > 0 ? (
        <ul className="space-y-2">
          {memoizedUserLists.map((list) => (
            <li key={list.id} className="flex justify-between items-center">
              <span className="text-gray-700">{list.name}</span>
              <Button
                onClick={() => handleAddToListClick(list.id)}
                variant="tertiary"
                size="sm"
                className="text-[#D1B399] border-[#D1B399] hover:bg-[#D1B399]/10"
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No lists available. Create a new one below.</p>
      )}
      <Button
        onClick={() => setMode("createNewList")}
        variant="primary"
        className="w-full bg-[#D1B399] text-white hover:bg-[#b89e89]"
      >
        Create New List
      </Button>
      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
    </div>
  );

  const getModalTitle = () => {
    if (mode === "addToList") return "Add to List";
    if (mode === "createNewList") return "Create New List";
    if (mode === "submission") {
      return selectedItem?.subtype === "dish" ? "Submit New Dish" : "Submit New Restaurant";
    }
    return "Quick Add";
  };

  // --- Main Return ---
  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={getModalTitle()}>
      {mode === "addToList" && renderAddToListMode()}
      {mode === "createNewList" && renderCreateNewListMode()}
      {mode === "submission" && renderSubmissionMode()}
    </Modal>
  );
});

export default QuickAddPopup;