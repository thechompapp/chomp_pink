import React, { useState, useEffect } from "react";
import useAppStore from "@/hooks/useAppStore";
import ListCard from "@/pages/Lists/ListCard";
import { useQuickAdd } from "@/context/QuickAddContext";
import Button from "@/components/Button";

const MyLists = () => {
  const { userLists, fetchUserLists } = useAppStore();
  const { openQuickAdd } = useQuickAdd();
  const [activeTab, setActiveTab] = useState("myLists");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLists = async () => {
      try {
        setIsLoading(true);
        await fetchUserLists();
      } catch (err) {
        setError("Failed to load lists. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadLists();
  }, [fetchUserLists]);

  const handleCreateNewList = () => {
    openQuickAdd({ type: "createNewList" });
  };

  const myLists = userLists.filter((list) => list.createdByUser);
  const followingLists = userLists.filter((list) => list.isFollowing && !list.createdByUser);

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => fetchUserLists()}
          variant="primary"
          className="px-4 py-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Lists</h1>
        <Button
          onClick={handleCreateNewList}
          variant="primary"
          className="px-4 py-2"
        >
          Create New List
        </Button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("myLists")}
          className={`py-2 px-4 font-medium ${
            activeTab === "myLists"
              ? "border-b-2 border-[#D1B399] text-[#D1B399]"
              : "text-gray-500 hover:text-[#D1B399]"
          }`}
        >
          My Lists ({myLists.length})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`py-2 px-4 font-medium ${
            activeTab === "following"
              ? "border-b-2 border-[#D1B399] text-[#D1B399]"
              : "text-gray-500 hover:text-[#D1B399]"
          }`}
        >
          Following ({followingLists.length})
        </button>
      </div>

      {activeTab === "myLists" && (
        <div>
          {myLists.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">You haven't created any lists yet.</p>
              <Button
                onClick={handleCreateNewList}
                variant="primary"
                className="px-4 py-2"
              >
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myLists.map((list) => (
                <ListCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  itemCount={list.items?.length || 0}
                  savedCount={list.savedCount || 0}
                  city={list.city}
                  tags={list.tags || []}
                  isFollowing={list.isFollowing || false}
                  createdByUser={list.createdByUser}
                  creatorHandle={list.creatorHandle || "@user"}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div>
          {followingLists.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">You're not following any lists yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {followingLists.map((list) => (
                <ListCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  itemCount={list.items?.length || 0}
                  savedCount={list.savedCount || 0}
                  city={list.city}
                  tags={list.tags || []}
                  isFollowing={list.isFollowing || false}
                  createdByUser={list.createdByUser}
                  creatorHandle={list.creatorHandle || "@user"}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLists;