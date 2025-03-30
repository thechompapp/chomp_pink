import React, { useState } from "react";
import useAppStore from "@/hooks/useAppStore";
import ListCard from "@/pages/Lists/ListCard";
import { useQuickAdd } from "@/context/QuickAddContext";

const MyLists = () => {
  const [tab, setTab] = useState("created"); // "created" or "following"
  const userLists = useAppStore((state) => state.userLists || []);
  const { openQuickAdd } = useQuickAdd();

  const createdLists = userLists.filter((list) => list.createdByUser);
  const followingLists = userLists.filter((list) => list.isFollowing);

  const handleCreateNewList = () => {
    openQuickAdd({ type: "list" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Lists</h1>
          <button
            onClick={handleCreateNewList}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            Create New List
          </button>
        </div>

        {/* Toggle Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("created")}
            className={`px-4 py-2 font-medium ${
              tab === "created"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setTab("following")}
            className={`px-4 py-2 font-medium ${
              tab === "following"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            Following
          </button>
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tab === "created" &&
            (createdLists.length > 0 ? (
              createdLists.map((list) => (
                <ListCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  itemCount={list.items?.length || 0}
                  savedCount={list.savedCount || 0}
                  city={list.city}
                  tags={list.tags || []}
                  isFollowing={list.isFollowing}
                />
              ))
            ) : (
              <p className="text-gray-500">You haven't created any lists yet.</p>
            ))}
          {tab === "following" &&
            (followingLists.length > 0 ? (
              followingLists.map((list) => (
                <ListCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  itemCount={list.items?.length || 0}
                  savedCount={list.savedCount || 0}
                  city={list.city}
                  tags={list.tags || []}
                  isFollowing={list.isFollowing}
                />
              ))
            ) : (
              <p className="text-gray-500">You aren't following any lists yet.</p>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MyLists;