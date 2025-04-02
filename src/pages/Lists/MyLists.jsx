// src/pages/Lists/MyLists.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import useAppStore from "@/hooks/useAppStore"; // Global import
import ListCard from "@/pages/Lists/ListCard.jsx"; // Global import
import { useQuickAdd } from "@/context/QuickAddContext.jsx"; // Global import
import Button from "@/components/Button"; // Global import

const MyLists = () => {
  console.log("[MyLists] Attempting to import ListCard from @/pages/Lists/ListCard.jsx");

  // Use individual selectors to avoid creating a new object
  const userLists = useAppStore(state => state.userLists);
  const fetchUserLists = useAppStore(state => state.fetchUserLists);
  const isLoadingUserLists = useAppStore(state => state.isLoadingUserLists);
  const userListsError = useAppStore(state => state.userListsError);
  const hasFetchedUserLists = useAppStore(state => state.hasFetchedUserLists);
  const clearUserListsError = useAppStore(state => state.clearUserListsError);

  const { openQuickAdd } = useQuickAdd();
  const [activeTab, setActiveTab] = useState("myLists");
  const hasFetchedRef = useRef(false); // Guard against multiple fetches

  const handleFetchUserLists = useCallback(() => {
    if (hasFetchedRef.current) {
      console.log("[MyLists] Fetch already in progress or completed");
      return;
    }

    if (!hasFetchedUserLists && !isLoadingUserLists) {
      console.log("[MyLists] Fetching lists.");
      hasFetchedRef.current = true;
      fetchUserLists();
    } else {
      console.log(`[MyLists] Skipping fetch. hasFetched: ${hasFetchedUserLists}, isLoading: ${isLoadingUserLists}`);
    }
  }, [fetchUserLists, hasFetchedUserLists, isLoadingUserLists]);

  useEffect(() => {
    handleFetchUserLists();
    return () => {
      hasFetchedRef.current = false; // Reset on unmount
    };
  }, [handleFetchUserLists]);

  const handleCreateNewList = useCallback(() => {
    openQuickAdd({ type: "createNewList" });
  }, [openQuickAdd]);

  const myLists = Array.isArray(userLists) ? userLists.filter((list) => list.created_by_user) : [];
  const followingLists = Array.isArray(userLists) ? userLists.filter((list) => list.is_following && !list.created_by_user) : [];

  const renderContent = () => {
    if (isLoadingUserLists && !hasFetchedUserLists) {
      return <div className="text-center py-10 text-gray-500">Loading your lists...</div>;
    }
    if (userListsError) {
      return (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">Error loading lists: {userListsError}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => fetchUserLists()} variant="primary" className="px-4 py-2">Retry</Button>
            {clearUserListsError && (
              <Button onClick={() => clearUserListsError()} variant="tertiary" className="px-4 py-2 border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/10">
                Clear Error
              </Button>
            )}
          </div>
        </div>
      );
    }

    const listsToDisplay = activeTab === "myLists" ? myLists : followingLists;
    const isEmpty = listsToDisplay.length === 0;
    const emptyStateMessage = activeTab === "myLists" 
      ? "You haven't created any lists yet." 
      : "You're not following any lists yet.";
    const emptyStateButtonText = activeTab === "myLists" 
      ? "Create Your First List" 
      : "Discover Lists to Follow";
    const emptyStateAction = activeTab === "myLists" 
      ? handleCreateNewList 
      : () => window.location.href = '/discover';

    return (
      <>
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab("myLists")} 
            className={`py-2 px-4 font-medium transition-colors duration-150 ${activeTab === "myLists" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent"}`} 
            aria-current={activeTab === "myLists"}
          >
            My Lists ({myLists.length})
          </button>
          <button 
            onClick={() => setActiveTab("following")} 
            className={`py-2 px-4 font-medium transition-colors duration-150 ${activeTab === "following" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent"}`} 
            aria-current={activeTab === "following"}
          >
            Following ({followingLists.length})
          </button>
        </div>
        <div>
          {isEmpty ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">{emptyStateMessage}</p>
              {emptyStateButtonText && (
                <Button onClick={emptyStateAction} variant="primary" className="px-4 py-2">
                  {emptyStateButtonText}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {listsToDisplay.map((list) => {
                if (!list || list.id === undefined || list.id === null) {
                  console.error("[MyLists] Invalid list data encountered during map:", list);
                  return null;
                }
                return (
                  <ListCard
                    key={`list-card-${list.id}`}
                    id={list.id}
                    name={list.name}
                    itemCount={list.item_count ?? (Array.isArray(list.items) ? list.items.length : 0)} // Fixed syntax
                    savedCount={list.saved_count ?? 0}
                    city={list.city}
                    tags={list.tags || []}
                    isFollowing={list.is_following}
                    createdByUser={list.created_by_user}
                    creatorHandle={list.creator_handle || "@user"}
                    isPublic={list.is_public}
                    canFollow={true}
                  />
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">My Lists</h1>
        <Button onClick={handleCreateNewList} variant="primary" className="px-4 py-2 w-full sm:w-auto">Create New List</Button>
      </div>
      {renderContent()}
    </div>
  );
};

export default MyLists;