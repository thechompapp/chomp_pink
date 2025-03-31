// src/pages/Lists/MyLists.jsx
import React, { useState, useEffect } from "react";
import useAppStore from "@/hooks/useAppStore";
import ListCard from "@/pages/Lists/ListCard"; // Verify this path is correct in your project
import { useQuickAdd } from "@/context/QuickAddContext.jsx"; // Verify path
import Button from "@/components/Button"; // Verify path

const MyLists = () => {
  const {
    userLists, fetchUserLists, isLoadingUserLists, userListsError, hasFetchedUserLists
  } = useAppStore();
  const { openQuickAdd } = useQuickAdd();
  const [activeTab, setActiveTab] = useState("myLists");

  useEffect(() => {
    // Fetch only if data hasn't been successfully fetched yet and not currently loading
    if (!hasFetchedUserLists && !isLoadingUserLists) {
      console.log("[MyLists] useEffect: Fetching lists.");
      fetchUserLists();
    } else {
      console.log(`[MyLists] useEffect: Skipping fetch. hasFetched: ${hasFetchedUserLists}, isLoading: ${isLoadingUserLists}`);
    }
  }, [fetchUserLists, hasFetchedUserLists, isLoadingUserLists]);

  const handleCreateNewList = () => { openQuickAdd({ type: "createNewList" }); };

  // Filter lists (derived state)
  const myLists = Array.isArray(userLists) ? userLists.filter((list) => list.created_by_user) : [];
  const followingLists = Array.isArray(userLists) ? userLists.filter((list) => list.is_following && !list.created_by_user) : [];

  const renderContent = () => {
    // Handle Loading State
    if (isLoadingUserLists && !hasFetchedUserLists) { // Show loading only on initial fetch attempt
        return <div className="text-center py-10 text-gray-500">Loading your lists...</div>;
    }
    // Handle Error State
    if (userListsError) {
        return (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">Error loading lists: {userListsError}</p>
            <Button onClick={() => fetchUserLists()} variant="primary" className="px-4 py-2">Retry</Button>
          </div>
        );
    }

    // Determine lists to display based on tab
    const listsToDisplay = activeTab === "myLists" ? myLists : followingLists;
    const isEmpty = listsToDisplay.length === 0;
    const emptyStateMessage = activeTab === "myLists" ? "You haven't created any lists yet." : "You're not following any lists yet.";
    const emptyStateButtonText = activeTab === "myLists" ? "Create Your First List" : null;

    // Render Tabs and Lists
    return (
      <>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("myLists")} className={`py-2 px-4 font-medium transition-colors duration-150 ${ activeTab === "myLists" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent" }`} aria-current={activeTab === "myLists"}> My Lists ({myLists.length}) </button>
          <button onClick={() => setActiveTab("following")} className={`py-2 px-4 font-medium transition-colors duration-150 ${ activeTab === "following" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent" }`} aria-current={activeTab === "following"}> Following ({followingLists.length}) </button>
        </div>
        {/* Content */}
        <div>
          {isEmpty ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">{emptyStateMessage}</p>
              {emptyStateButtonText && (<Button onClick={handleCreateNewList} variant="primary" className="px-4 py-2">{emptyStateButtonText}</Button>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listsToDisplay.map((list) => {
                 if (!list || list.id === undefined || list.id === null) {
                     console.error("[MyLists] Invalid list data encountered during map:", list);
                     return null; // Skip rendering invalid item
                 }
                 return (
                   <ListCard
                     key={`list-card-${list.id}`}
                     id={list.id}
                     name={list.name}
                     itemCount={list.item_count ?? (Array.isArray(list.items) ? list.items.length : 0)}
                     savedCount={list.saved_count ?? 0}
                     city={list.city}
                     tags={list.tags || []}
                     isFollowing={list.is_following} // Pass prop for display
                     createdByUser={list.created_by_user}
                     creatorHandle={list.creator_handle || "@user"}
                     isPublic={list.is_public}
                     canFollow={true} // Enable follow action from this page
                   />
                 );
               })}
            </div>
          )}
        </div>
      </>
    );
  }; // End of renderContent

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">My Lists</h1>
        <Button onClick={handleCreateNewList} variant="primary" className="px-4 py-2 w-full sm:w-auto">Create New List</Button>
      </div>
      {renderContent()}
    </div>
  );
}; // End of MyLists component

export default MyLists; // Ensure default export is present