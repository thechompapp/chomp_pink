// src/components/QuickAddPopup.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2 } from "lucide-react";
// Import specific stores needed
import useUserListStore from '@/stores/useUserListStore.js';
import { useQuickAdd } from "@/context/QuickAddContext.jsx";
import Modal from "@/components/UI/Modal.jsx";
import Button from "@/components/Button.jsx";

const QuickAddPopup = React.memo(() => {
  const { isOpen, selectedItem, closeQuickAdd } = useQuickAdd();

  // Select state and actions from useUserListStore
  const userLists = useUserListStore(state => state.userLists);
  const addToList = useUserListStore(state => state.addToList);
  const fetchUserLists = useUserListStore(state => state.fetchUserLists);
  // Get loading/error states specific to actions from the store
  const isLoadingLists = useUserListStore(state => state.isLoadingUser); // Loading user lists
  const isSubmittingList = useUserListStore(state => state.isAddingToList); // Loading state for the addToList action
  const addListErrorMsg = useUserListStore(state => state.addToListError); // Error state for addToList action
  const userListErrorMsg = useUserListStore(state => state.errorUser); // Error state for fetching user lists

  // Local state for the form inputs
  const [mode, setMode] = useState("addToList"); // 'addToList' or 'createNewList'
  const [newListName, setNewListName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  // Local error message state specifically for *this component's* logic (e.g., empty name input)
  const [localErrorMessage, setLocalErrorMessage] = useState("");

  const listsFetchInitiated = useRef(false);

  // Reset logic for local form state
  const resetForm = useCallback(() => {
    setMode("addToList");
    setNewListName("");
    setIsPublic(true);
    setLocalErrorMessage(""); // Clear local errors
    listsFetchInitiated.current = false;
  }, []);

  // Effect to set mode and fetch lists if needed
   useEffect(() => {
     let isMounted = true;
     if (!isOpen) { listsFetchInitiated.current = false; return; }

     resetForm(); // Reset local state first

     // Determine mode based on selectedItem
     if (selectedItem?.type === "createNewList") {
         setMode("createNewList");
         listsFetchInitiated.current = true; // Mark as handled, no fetch needed here
     } else if (selectedItem && selectedItem.id && selectedItem.type) {
        setMode("addToList");
        // Fetch user lists only if they aren't loaded and fetch hasn't been initiated
        if ((!userLists || userLists.length === 0) && !listsFetchInitiated.current && !isLoadingLists) {
            listsFetchInitiated.current = true;
            setLocalErrorMessage(''); // Clear local errors before fetch
            console.log('[QuickAddPopup useEffect] Triggering fetchUserLists...');
            fetchUserLists()
              .catch(err => {
                  if (isMounted) {
                      console.error("[QuickAddPopup useEffect] fetchUserLists failed:", err);
                  }
                  if(isMounted) listsFetchInitiated.current = false;
              });
        } else if (userLists && userLists.length > 0) {
            listsFetchInitiated.current = true; // Mark as initiated if lists already exist
        }
     } else if (isOpen) {
         setLocalErrorMessage("Invalid item selected for Quick Add.");
         setMode("addToList"); // Default mode
         listsFetchInitiated.current = true; // Mark as handled
     }

     return () => { isMounted = false; };
   }, [isOpen, selectedItem, resetForm, fetchUserLists, userLists, isLoadingLists]);


  // Handler to add item to an existing list
  const handleAddToListClick = useCallback(async (listId) => {
    if (!selectedItem || !selectedItem.id || !selectedItem.type || selectedItem.type === 'createNewList') {
      setLocalErrorMessage("No valid item selected to add.");
      return;
    }
    if (!listId) {
      setLocalErrorMessage("Invalid list selected.");
      return;
    }
    setLocalErrorMessage(""); // Clear local errors

    try {
      // Call the action from the store. Loading/error state is handled within the store.
      await addToList({ item: selectedItem, listId: listId, createNew: false });
      closeQuickAdd(); // Close modal on success
    } catch (error) {
      console.error("[QuickAddPopup handleAddToListClick] Error:", error);
      // Error state is set in the store via addListErrorMsg
    }
  }, [addToList, closeQuickAdd, selectedItem]);

  // Handler for creating a NEW list (and potentially adding the selected item)
  const handleCreateNewListAndAdd = useCallback(async () => {
    if (!newListName.trim()) {
      setLocalErrorMessage("List name cannot be empty.");
      return;
    }
    setLocalErrorMessage(""); // Clear local error

    // *** Construct the payload for the new list data ***
    // *** This needs to match what the addToList action expects for listData ***
    const listDataPayload = {
        name: newListName.trim(),
        is_public: isPublic,
        description: null, // Or add an input field for this
        city_name: null,   // Or derive from selectedItem if applicable?
        tags: []           // Or add an input field for this
    };

    console.log("[QuickAddPopup] Attempting to create list with payload:", listDataPayload);

    try {
        // Call the action from the store. Loading/error state is handled within the store.
        await addToList({
          // Pass the current selectedItem ONLY if it's not the 'createNewList' placeholder
          item: (selectedItem && selectedItem.type !== 'createNewList') ? selectedItem : null,
          listData: listDataPayload, // Pass the constructed payload for the new list
          createNew: true
        });
      console.log(`[QuickAddPopup] Successfully initiated creation/addition for list "${listDataPayload.name}"`);
      closeQuickAdd(); // Close modal on success
    } catch (error) {
       console.error("[QuickAddPopup handleCreateNewListAndAdd] Error:", error);
       // Error state is set in the store via addListErrorMsg
    }
  }, [newListName, isPublic, selectedItem, addToList, closeQuickAdd]);


  // --- RENDER LOGIC ---

  // Render "Create New List" Mode
  const renderCreateNewListMode = () => (
      <div className="space-y-4">
        <div>
          <label htmlFor="listNameInput" className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
          <input
            id="listNameInput"
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="e.g., My Favorite NYC Pizza Joints"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399]"
            disabled={isSubmittingList} // Use store's loading state
          />
        </div>
        {/* Visibility Toggle */}
        <div className="flex items-center">
           <label htmlFor="togglePublicList" className={`flex items-center mr-2 ${isSubmittingList ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
             <div className="relative">
                 <input
                    type="checkbox"
                    id="togglePublicList"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                    disabled={isSubmittingList} // Use store's loading state
                 />
                 <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                 <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
             </div>
           </label>
           <span className={`text-sm text-gray-700 select-none ${isSubmittingList ? 'opacity-50' : ''}`}>
             {isPublic ? 'Public List' : 'Private List'}
           </span>
        </div>
        {/* Display Local or Store Error Message */}
        {(localErrorMessage || addListErrorMsg) && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {localErrorMessage || addListErrorMsg}
            </p>
        )}
        {/* Submit Button */}
        <Button
            onClick={handleCreateNewListAndAdd}
            variant="primary"
            className="w-full"
            disabled={!newListName.trim() || isSubmittingList} // Use store's loading state
        >
          {isSubmittingList ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Create List"}
        </Button>
      </div>
  );

  // Render "Add to Existing List" Mode
  const renderAddToListMode = () => {
    // Filter lists owned by the user directly from the store state
    const userCreatedLists = Array.isArray(userLists) ? userLists.filter(list => list.created_by_user) : [];

    return (
      <div className="space-y-4">
        {/* Loading State for Fetching Lists */}
        {isLoadingLists ? (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="animate-spin h-5 w-5 mr-2 text-gray-500" />
                <span className="text-sm text-gray-500">Loading lists...</span>
            </div>
        // Check if an item is actually selected before showing lists
        ) : selectedItem && selectedItem.type !== 'createNewList' ? (
            // Display lists if available
            userCreatedLists.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {userCreatedLists.map((list) => (
                        <li key={list.id}>
                            <Button
                                variant="tertiary"
                                className="w-full justify-start text-left border-gray-300 hover:border-[#D1B399] hover:bg-[#D1B399]/10"
                                onClick={() => handleAddToListClick(list.id)}
                                // Disable button while adding to *any* list
                                disabled={isSubmittingList}
                            >
                                {/* Show loading indicator on the specific button being processed? More complex state needed */}
                                {list.name}
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                // Message if user has no created lists (and not loading/error)
                 !userListErrorMsg && <p className="text-sm text-gray-600 text-center py-4">No lists created yet.</p>
            )
        ) : (
            // Message if no item is selected (and not in create mode)
            !userListErrorMsg && <p className="text-sm text-gray-600 text-center py-4">Select an item to add it to a list.</p>
        )}

        {/* Display Fetching or Adding Errors */}
        {(userListErrorMsg || addListErrorMsg) && !isLoadingLists && (
             <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                 {userListErrorMsg || addListErrorMsg}
             </p>
         )}
         {/* Display Local Error (e.g., invalid item) */}
         {localErrorMessage && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {localErrorMessage}
              </p>
          )}

        {/* Button to switch to Create New List mode */}
        <Button
            variant="primary"
            className="w-full"
            onClick={() => setMode("createNewList")}
            // Disable button while any add action (fetching lists or submitting) is in progress
            disabled={isSubmittingList || isLoadingLists}
        >
             Create New List
        </Button>

      </div>
    );
  };

  // Determine Modal Title
  const getModalTitle = () => {
    if (mode === "addToList") {
        return selectedItem && selectedItem.type !== 'createNewList' && selectedItem.name
            ? `Add "${selectedItem.name}" to...`
            : "Add to List";
    }
    if (mode === "createNewList") return "Create New List";
    return "Quick Add"; // Default title
  };

  // Render the Modal
  return (
    <Modal
        isOpen={isOpen}
        // Prevent closing while a submission is in progress
        onClose={!isSubmittingList ? closeQuickAdd : undefined}
        title={getModalTitle()}
    >
      {mode === "addToList" && renderAddToListMode()}
      {mode === "createNewList" && renderCreateNewListMode()}
    </Modal>
  );
});

export default QuickAddPopup;