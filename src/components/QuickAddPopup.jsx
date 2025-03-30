import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import { useQuickAdd } from "@/context/QuickAddContext";
import Modal from "@/components/UI/Modal";

const QuickAddPopup = React.memo(() => {
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();
  const { userLists, addToList, addPendingSubmission } = useAppStore();

  const [mode, setMode] = useState("addToList"); // "addToList", "createNewList", "submission"
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [autoLocation, setAutoLocation] = useState("");

  const suggestedHashtags = [
    "pizza", "burger", "sushi", "vegan", "italian", "mexican", "seafood", "dessert",
    "brunch", "coffee", "cocktails", "bbq", "asian", "fast-food", "fine-dining"
  ];

  const mockLocationApi = useCallback((name) => {
    const mockLocations = {
      "Joe's Pizza": "Greenwich Village, New York",
      "Shake Shack": "Midtown, New York",
      "Katz's Deli": "Lower East Side, New York",
      "In-N-Out": "Hollywood, Los Angeles",
      "Pizzeria Mozza": "West Hollywood, Los Angeles",
    };
    return mockLocations[name] || "Unknown Location";
  }, []);

  useEffect(() => {
    if (isOpen && selectedItem?.type === "submission") {
      setMode("submission");
      setNewItemName("");
      setSelectedTags([]);
      setAutoLocation("");
    } else if (isOpen && selectedItem) {
      setMode("addToList");
    }
  }, [isOpen, selectedItem]);

  useEffect(() => {
    if (mode === "submission" && newItemName) {
      setAutoLocation(mockLocationApi(newItemName));
    }
  }, [newItemName, mode, mockLocationApi]);

  const handleAddToList = useCallback((listId) => {
    if (selectedItem) {
      addToList(listId, selectedItem);
      closeQuickAdd();
    }
  }, [selectedItem, addToList, closeQuickAdd]);

  const handleCreateNewList = useCallback(() => {
    if (newListName && selectedItem) {
      const newListId = Date.now();
      addToList(newListId, { name: newListName, items: [selectedItem], isPublic }, true);
      closeQuickAdd();
    }
  }, [newListName, selectedItem, addToList, closeQuickAdd, isPublic]);

  const handleSubmitNewItem = useCallback(() => {
    if (newItemName) {
      const newItem = {
        name: newItemName,
        location: autoLocation,
        tags: selectedTags,
        type: selectedTags.includes("pizza") || selectedTags.includes("burger") ? "dish" : "restaurant", // Simplified type inference
      };
      addPendingSubmission(newItem);
      closeQuickAdd();
    }
  }, [newItemName, autoLocation, selectedTags, addPendingSubmission, closeQuickAdd]);

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredLists = useMemo(() => {
    return userLists.filter((list) =>
      selectedItem?.type === "restaurant" ? !list.items.some((item) => item.restaurant) : list.items.some((item) => item.restaurant)
    );
  }, [userLists, selectedItem]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={closeQuickAdd} title={mode === "submission" ? "Add New Item" : "Quick Add"}>
      {mode === "addToList" && selectedItem && (
        <div>
          <p className="text-gray-600 mb-4">Add <strong>{selectedItem.name}</strong> to a list:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {filteredLists.map((list) => (
              <div
                key={list.id}
                className="border border-gray-200 hover:border-primary rounded-lg p-3 flex justify-between items-center cursor-pointer"
                onClick={() => handleAddToList(list.id)}
              >
                <span>{list.name}</span>
                <span className="text-primary">Add</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setMode("createNewList")}
            className="w-full py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white"
          >
            Create New List
          </button>
        </div>
      )}

      {mode === "createNewList" && (
        <div>
          <input
            type="text"
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
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
          <button
            onClick={handleCreateNewList}
            className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
            disabled={!newListName}
          >
            Create and Add
          </button>
        </div>
      )}

      {mode === "submission" && (
        <div>
          <input
            type="text"
            placeholder="Restaurant or Dish Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          />
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Location (Autofilled):</label>
            <span className="text-gray-600">{autoLocation || "Enter a name to autofill"}</span>
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
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-primary hover:text-white"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmitNewItem}
            className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
            disabled={!newItemName}
          >
            Submit for Review
          </button>
        </div>
      )}
    </Modal>
  );
});

export default QuickAddPopup;