// src/components/FloatingQuickAdd.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Utensils, Store, List, X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore.js";
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Button from "@/components/Button.jsx";
import { API_BASE_URL, GOOGLE_PLACES_API_KEY } from "@/config.js";

const FloatingQuickAdd = () => {
  const { openQuickAdd } = useQuickAdd();
  const cuisines = useAppStore((state) => state.cuisines || []);

  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState(null); // null, "dish", "restaurant"
  const [newItemName, setNewItemName] = useState("");
  const [restaurantInput, setRestaurantInput] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);

  const debounceTimeoutRef = useRef(null);

  const handleOpenPopup = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setIsOpen(false);
    setFormType(null);
    setNewItemName("");
    setRestaurantInput("");
    setHashtagInput("");
    setSuggestedHashtags([]);
    setSelectedTags([]);
    setPlaceSuggestions([]);
    setDishSuggestions([]);
    setIsLoadingSuggestions(false);
    setSelectedPlaceDetails(null);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  }, []);

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
        console.error("Failed to fetch place suggestions:", error);
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
        console.error("Failed to fetch dish suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
  }, []);

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
    }
  }, [formType, fetchDishSuggestions]);

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
    } catch (error) {
      console.error("Failed to fetch place details:", error);
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

  const handleOpenDishForm = useCallback(() => {
    setFormType("dish");
  }, []);

  const handleOpenRestaurantForm = useCallback(() => {
    setFormType("restaurant");
  }, []);

  const handleSubmitDish = useCallback(() => {
    openQuickAdd({
      type: "submission",
      subtype: "dish",
      name: new

ItemName,
      restaurant: restaurantInput,
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      city: selectedPlaceDetails?.city || null,
      neighborhood: selectedPlaceDetails?.neighborhood || null,
    });
    handleClosePopup();
  }, [openQuickAdd, newItemName, restaurantInput, selectedTags, selectedPlaceDetails, handleClosePopup]);

  const handleSubmitRestaurant = useCallback(() => {
    openQuickAdd({
      type: "submission",
      subtype: "restaurant",
      name: newItemName,
      tags: selectedTags,
      place_id: selectedPlaceDetails?.placeId || null,
      city: selectedPlaceDetails?.city || null,
      neighborhood: selectedPlaceDetails?.neighborhood || null,
    });
    handleClosePopup();
  }, [openQuickAdd, newItemName, selectedTags, selectedPlaceDetails, handleClosePopup]);

  const handleCreateNewList = useCallback(() => {
    openQuickAdd({ type: "createNewList" });
    handleClosePopup();
  }, [openQuickAdd, handleClosePopup]);

  useEffect(() => {
    if (isOpen && (formType === "dish" || formType === "restaurant")) {
      fetchHashtagSuggestions("");
    }
  }, [isOpen, formType, fetchHashtagSuggestions]);

  return (
    <>
      <button
        onClick={handleOpenPopup}
        className="fixed bottom-6 right-6 bg-[#D1B399] text-white rounded-full p-3 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-[#D1B399] w-12 h-12 flex items-center justify-center"
      >
        <Plus size={24} />
      </button>
      {isOpen && !formType && (
        <div className="fixed bottom-24 right-6 flex flex-col items-center space-y-2 z-50">
          <button
            onClick={handleOpenDishForm}
            className="bg-[#D1B399] text-white rounded-full p-2 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-[#D1B399] w-10 h-10 flex items-center justify-center"
          >
            <Utensils size={20} />
          </button>
          <button
            onClick={handleOpenRestaurantForm}
            className="bg-[#D1B399] text-white rounded-full p-2 shadow-lg hover:bg-[#b89e89] focus:outline-none focus:ring-2 focus:ring-[#D1B399] w-10 h-10 flex items-center justify-center"
          >
            <Store size={20} />
          </button>
          <button
            onClick={handleCreateNewList}
            className="bg-white text-[#D1B399] border border-[#D1B399] rounded-full p-2 shadow-lg hover:bg-[#D1B399]/10 focus:outline-none focus:ring-2 focus:ring-[#D1B399] w-10 h-10 flex items-center justify-center"
          >
            <List size={20} />
          </button>
        </div>
      )}
      {isOpen && (formType === "dish" || formType === "restaurant") && (
        <div className="fixed bottom-20 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              {formType === "dish" ? "Add Dish" : "Add Restaurant"}
            </h3>
            <button onClick={handleClosePopup} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formType === "dish" ? "Dish Name" : "Restaurant Name"}
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={handleItemNameChange}
                placeholder={formType === "dish" ? "e.g., Margherita Pizza" : "e.g., Joe's Pizza"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
              />
              {isLoadingSuggestions && (
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <X className="animate-spin mr-2" size={16} /> Loading suggestions...
                </div>
              )}
              {formType === "dish" && dishSuggestions.length > 0 && (
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
            </div>
            {formType === "dish" && (
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
              <input
                type="text"
                value={hashtagInput}
                onChange={handleHashtagInputChange}
                placeholder="Type to add tags (e.g., italian)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D1B399]"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedHashtags.map((tag) => (
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
            </div>
            <Button
              onClick={formType === "dish" ? handleSubmitDish : handleSubmitRestaurant}
              variant="primary"
              className="w-full bg-[#D1B399] text-white hover:bg-[#b89e89]"
            >
              {formType === "dish" ? "Add Dish" : "Add Restaurant"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickAdd;