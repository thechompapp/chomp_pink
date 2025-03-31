import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import { useQuickAdd } from "@/context/QuickAddContext";
import Modal from "@/components/UI/Modal";
import Button from "@/components/Button";
import { API_BASE_URL } from "@/config";

const QuickAddPopup = React.memo(() => {
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();
  const { userLists, addToList, addPendingSubmission, checkDuplicateRestaurant } = useAppStore();

  const [mode, setMode] = useState("addToList");
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [autoLocation, setAutoLocation] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [useMockLocation, setUseMockLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([
    "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert",
    "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining"
  ]);
  const [manualHashtag, setManualHashtag] = useState("");

  const mockLocationApi = useCallback((name) => {
    const mockLocations = {
      "Joe's Pizza": "Greenwich Village, New York",
      "Shake Shack": "Midtown, New York",
      "Katz's Deli": "Lower East Side, New York",
      "In-N-Out": "Hollywood, Los Angeles",
      "Pizzeria Mozza": "West Hollywood, Los Angeles",
      "Il Buco": "NoHo, New York",
    };
    return mockLocations[name] || "Unknown Location";
  }, []);

  useEffect(() => {
    if (mode === "submission" && newItemName) {
      if (selectedItem?.subtype === "dish") {
        // Fetch dish suggestions for autofill
        const fetchDishSuggestions = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/common-dishes?input=${encodeURIComponent(newItemName)}`);
            if (!response.ok) {
              throw new Error('Failed to fetch dish suggestions');
            }
            const data = await response.json();
            setDishSuggestions(data);
          } catch (error) {
            console.error('Error fetching dish suggestions:', error);
            setDishSuggestions([]);
          }
        };
        fetchDishSuggestions();
      } else {
        // Fetch place suggestions for restaurants
        const fetchPlaceSuggestions = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(newItemName)}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (response.ok) {
              setPlaceSuggestions(data);
              setErrorMessage("");
              console.log("Place suggestions fetched:", data);
            } else {
              console.error("Failed to fetch place suggestions:", data.error, data.message);
              setPlaceSuggestions([]);
              setAutoLocation(mockLocationApi(newItemName));
              const [neighborhood, city] = mockLocationApi(newItemName).split(", ");
              setSelectedPlace({ city: city || "Unknown", neighborhood: neighborhood || "Unknown" });
              setUseMockLocation(true);
              setErrorMessage("Failed to fetch place suggestions: " + (data.message || "Unknown error"));
            }
          } catch (error) {
            console.error("Error fetching place suggestions:", error);
            setPlaceSuggestions([]);
            setAutoLocation(mockLocationApi(newItemName));
            const [neighborhood, city] = mockLocationApi(newItemName).split(", ");
            setSelectedPlace({ city: city || "Unknown", neighborhood: neighborhood || "Unknown" });
            setUseMockLocation(true);
            setErrorMessage("Unable to connect to location services. Using default location.");
          }
        };
        fetchPlaceSuggestions();
      }
    } else {
      setPlaceSuggestions([]);
      setDishSuggestions([]);
      setErrorMessage("");
    }
  }, [newItemName, mode, selectedItem, mockLocationApi]);

  useEffect(() => {
    if (mode === "submission" && newItemName && selectedPlace && selectedItem?.subtype === "restaurant") {
      const newItem = {
        name: newItemName,
        city: selectedPlace.city,
        neighborhood: selectedPlace.neighborhood,
      };
      const isDuplicate = checkDuplicateRestaurant(newItem);
      if (isDuplicate) {
        setDuplicateWarning(`A restaurant named "${newItemName}" already exists in ${selectedPlace.neighborhood}, ${selectedPlace.city}. Please choose a different name or location.`);
      } else {
        setDuplicateWarning("");
      }
    }
  }, [newItemName, selectedPlace, checkDuplicateRestaurant, mode, selectedItem]);

  useEffect(() => {
    // Dynamically update suggested hashtags based on selected tags
    const fetchDynamicHashtags = async () => {
      if (selectedTags.length === 0) {
        setSuggestedHashtags([
          "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert",
          "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining"
        ]);
        return;
      }

      try {
        const lastTag = selectedTags[selectedTags.length - 1];
        const response = await fetch(`${API_BASE_URL}/api/filters?category=Specific Foods&relatedTag=${encodeURIComponent(lastTag)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dynamic hashtags');
        }
        const data = await response.json();
        setSuggestedHashtags(data);
      } catch (error) {
        console.error('Error fetching dynamic hashtags:', error);
        setSuggestedHashtags([
          "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert",
          "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining"
        ]);
      }
    };
    if (mode === "submission") {
      fetchDynamicHashtags();
    }
  }, [selectedTags, mode]);

  const handlePlaceSelect = async (placeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/places/details?placeId=${encodeURIComponent(placeId)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (response.ok) {
        setAutoLocation(data.formattedAddress || "Unknown Location");
        setSelectedPlace({ city: data.city, neighborhood: data.neighborhood });
        setPlaceSuggestions([]);
        setErrorMessage("");
        console.log("Place details fetched:", data);
      } else {
        console.error("Failed to fetch place details:", data.error, data.message);
        setAutoLocation(mockLocationApi(newItemName));
        const [neighborhood, city] = mockLocationApi(newItemName).split(", ");
        setSelectedPlace({ city: city || "Unknown", neighborhood: neighborhood || "Unknown" });
        setErrorMessage("Failed to fetch place details: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      setAutoLocation(mockLocationApi(newItemName));
      const [neighborhood, city] = mockLocationApi(newItemName).split(", ");
      setSelectedPlace({ city: city || "Unknown", neighborhood: neighborhood || "Unknown" });
      setErrorMessage("Unable to connect to location services. Using default location.");
    }
  };

  const handleDishSelect = (dishName) => {
    setNewItemName(dishName);
    setDishSuggestions([]);
  };

  const handleAddManualHashtag = () => {
    if (manualHashtag && !selectedTags.includes(manualHashtag)) {
      setSelectedTags([...selectedTags, manualHashtag]);
      setManualHashtag("");
    }
  };

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    console.log("QuickAddPopup: Toggled tag:", tag);
  }, []);

  useEffect(() => {
    console.log("QuickAddPopup: useEffect triggered, isOpen =", isOpen, "selectedItem =", selectedItem);
    if (isOpen && selectedItem?.type === "submission") {
      setMode("submission");
      setNewItemName("");
      setSelectedTags([]);
      setAutoLocation("");
      setSelectedPlace(null);
      setPlaceSuggestions([]);
      setDishSuggestions([]);
      setErrorMessage("");
      setDuplicateWarning("");
      console.log("QuickAddPopup: Mode set to submission");
    } else if (isOpen && selectedItem?.type === "createNewList") {
      setMode("createNewList");
      setNewListName("");
      setIsPublic(true);
      console.log("QuickAddPopup: Mode set to createNewList");
    } else if (isOpen && selectedItem) {
      setMode("addToList");
      console.log("QuickAddPopup: Mode set to addToList");
    }
  }, [isOpen, selectedItem]);

  const handleAddToList = useCallback((listId) => {
    if (selectedItem) {
      addToList(listId, selectedItem);
      closeQuickAdd();
      console.log("QuickAddPopup: Added to list, listId =", listId);
    }
  }, [selectedItem, addToList, closeQuickAdd]);

  const handleCreateNewList = useCallback(() => {
    if (newListName) {
      const newListId = Date.now();
      const newList = {
        name: newListName,
        items: [],
        isPublic,
        createdByUser: true,
        creatorHandle: "@currentUser", // Replace with actual user handle
        savedCount: 0,
        isFollowing: false,
      };
      addToList(newListId, newList, true);
      closeQuickAdd();
      console.log("QuickAddPopup: Created new list, name =", newListName, "id =", newListId);
    }
  }, [newListName, isPublic, addToList, closeQuickAdd]);

  const handleSubmitNewItem = useCallback(async () => {
    if (newItemName && !duplicateWarning) {
      const newItem = {
        id: Date.now(),
        name: newItemName,
        location: selectedItem?.subtype === "dish" ? autoLocation : autoLocation,
        tags: selectedTags,
        type: selectedItem?.subtype || "restaurant",
        city: selectedItem?.subtype === "dish" ? "" : selectedPlace?.city || "",
        neighborhood: selectedItem?.subtype === "dish" ? "" : selectedPlace?.neighborhood || "",
      };
      await addPendingSubmission(newItem);
      closeQuickAdd();
      console.log("QuickAddPopup: Submitted new item:", newItem);
    }
  }, [newItemName, autoLocation, selectedTags, selectedPlace, addPendingSubmission, closeQuickAdd, duplicateWarning, selectedItem]);

  const filteredLists = useMemo(() => {
    if (!selectedItem || !selectedItem.type) {
      return userLists;
    }
    return userLists.filter((list) => {
      if (!list.items) return true;
      return selectedItem.type === "restaurant"
        ? !list.items.some((item) => item.restaurant)
        : list.items.some((item) => item.restaurant);
    });
  }, [userLists, selectedItem]);

  if (!isOpen) {
    console.log("QuickAddPopup: Not rendering, isOpen is false");
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={mode === "submission" ? `Add New ${selectedItem?.subtype === "dish" ? "Dish" : "Restaurant"}` : mode === "createNewList" ? "Create New List" : "Quick Add"}>
      {mode === "addToList" && selectedItem && (
        <div>
          <p className="text-gray-600 mb-4">Add <strong>{selectedItem.name}</strong> to a list:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {filteredLists.map((list) => (
              <div
                key={list.id}
                className="border border-gray-200 hover:border-[#D1B399] rounded-lg p-3 flex justify-between items-center cursor-pointer"
                onClick={() => handleAddToList(list.id)}
              >
                <span>{list.name}</span>
                <span className="text-[#D1B399]">Add</span>
              </div>
            ))}
          </div>
          <Button
            variant="tertiary"
            className="w-full"
            onClick={() => setMode("createNewList")}
          >
            Create New List
          </Button>
        </div>
      )}

      {mode === "createNewList" && (
        <div>
          <input
            type="text"
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
          />
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={() => setIsPublic(!isPublic)}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-gray-700">Make this list public</label>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleCreateNewList}
            disabled={!newListName}
          >
            Create List
          </Button>
        </div>
      )}

      {mode === "submission" && (
        <div>
          {errorMessage && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}
          {duplicateWarning && (
            <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded-lg">
              {duplicateWarning}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              placeholder={selectedItem?.subtype === "dish" ? "Dish Name" : "Restaurant Name"}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
            />
            {selectedItem?.subtype === "dish" && dishSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {dishSuggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() => handleDishSelect(suggestion)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            {selectedItem?.subtype !== "dish" && placeSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {placeSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => {
                      setNewItemName(suggestion.description);
                      handlePlaceSelect(suggestion.place_id);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">
              {selectedItem?.subtype === "dish" ? "Restaurant (Optional):" : "Location (Autofilled):"}
            </label>
            <input
              type="text"
              value={autoLocation}
              onChange={(e) => setAutoLocation(e.target.value)}
              placeholder={selectedItem?.subtype === "dish" ? "Enter restaurant name" : "Enter a name to autofill"}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Suggested Tags:</label>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-[#D1B399] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-[#D1B399] hover:text-white"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Add Custom Tag:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualHashtag}
                onChange={(e) => setManualHashtag(e.target.value)}
                placeholder="Enter custom tag"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
              />
              <Button
                onClick={handleAddManualHashtag}
                variant="primary"
                className="px-4 py-2"
                disabled={!manualHashtag}
              >
                Add
              </Button>
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSubmitNewItem}
            disabled={!newItemName || !!duplicateWarning}
          >
            Submit for Review
          </Button>
        </div>
      )}
    </Modal>
  );
});

export default QuickAddPopup;