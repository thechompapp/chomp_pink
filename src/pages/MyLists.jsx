import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import QuickCreateForm from '../components/QuickCreateForm';

// Reusable Draggable List Item Component
const DraggableListItem = ({ list, index, moveItem, isReorderMode }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'LIST_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => isReorderMode,
  });

  const [, drop] = useDrop({
    accept: 'LIST_ITEM',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <li
      ref={(node) => drag(drop(node))}
      className={`border rounded-lg p-4 shadow-sm ${
        isReorderMode ? 'cursor-move' : 'hover:shadow-md hover:border-pink-200'
      } transition ${isDragging ? 'opacity-50 border-pink-300 bg-pink-50' : ''}`}
    >
      <Link to={`/list/${list.id}`} className={`block ${isReorderMode ? 'pointer-events-none' : ''}`}>
        <div className="flex items-center">
          {isReorderMode && (
            <div className="mr-3 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl text-pink-600 font-medium hover:text-pink-800">{list.title}</h3>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>by {list.author}</span>
              <span>{list.followers} followers</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

// Reusable Tab Button Component
const TabButton = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium ${
      isActive
        ? 'bg-pink-500 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
    }`}
  >
    {children}
  </button>
);

const MyLists = () => {
  const [activeTab, setActiveTab] = useState('created');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const [createdLists, setCreatedLists] = useState([
    { id: 101, title: "My Favorite Pasta Spots", items: 5, isPublic: true },
    { id: 102, title: "Best Date Night Places", items: 8, isPublic: true },
    { id: 103, title: "Quick Lunch Options", items: 12, isPublic: false },
  ]);

  const followingLists = [
    { id: 201, title: "Best Italian in NYC", author: "@pastafan", followers: 423 },
    { id: 202, title: "Affordable Hidden Gems", author: "@foodhunter", followers: 654 },
    { id: 203, title: "Must-Try Desserts", author: "@sweettooth", followers: 521 },
  ];

  const moveItem = useCallback((fromIndex, toIndex) => {
    const updatedLists = [...createdLists];
    const [movedItem] = updatedLists.splice(fromIndex, 1);
    updatedLists.splice(toIndex, 0, movedItem);
    setCreatedLists(updatedLists);
  }, [createdLists]);

  const handleToggleReorder = useCallback(() => {
    setIsReorderMode((prev) => !prev);
  }, []);

  const openQuickCreate = useCallback(() => {
    setShowQuickCreate(true);
  }, []);

  const closeQuickCreate = useCallback(() => {
    setShowQuickCreate(false);
  }, []);

  const handleSort = useCallback((order) => {
    setSortOrder(order);
    if (order === 'default') return;

    const sortedLists = [...createdLists];
    sortedLists.sort((a, b) =>
      order === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    );
    setCreatedLists(sortedLists);
  }, [createdLists]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* App Header */}
        <div className="flex justify-between items-center py-4 mb-4">
          <div className="text-2xl font-bold text-pink-500">chomp</div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
            <Link to="/trending" className="text-gray-700 hover:text-gray-900">Trending</Link>
            <Link to="/mylists" className="text-gray-700 hover:text-gray-900 font-medium">My Lists</Link>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700">
              <span>U</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Lists</h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <TabButton isActive={activeTab === 'created'} onClick={() => setActiveTab('created')}>
              Created
            </TabButton>
            <TabButton isActive={activeTab === 'following'} onClick={() => setActiveTab('following')}>
              Following
            </TabButton>
          </div>
        </div>

        {activeTab === 'created' && (
          <>
            <ul className="divide-y divide-gray-200">
              {createdLists.map((list, index) => (
                <DraggableListItem
                  key={list.id}
                  list={list}
                  index={index}
                  moveItem={moveItem}
                  isReorderMode={isReorderMode}
                />
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleToggleReorder}
                className={`py-1 px-3 text-xs font-medium rounded-md ${
                  isReorderMode ? 'bg-pink-500 text-white' : 'border border-pink-500 text-pink-500'
                }`}
              >
                {isReorderMode ? 'Done' : 'Reorder'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'following' && (
          <div className="text-center py-8 text-gray-500">
            You're not following any lists yet. Explore trending lists to find some to follow!
          </div>
        )}

        {/* Universal Quick Add Button */}
        <button
          onClick={openQuickCreate}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          aria-label="Quick Add"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {showQuickCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="relative w-full max-w-md my-8">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={closeQuickCreate}
                  className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>
              <QuickCreateForm onClose={closeQuickCreate} initialType="list" />
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default MyLists;
