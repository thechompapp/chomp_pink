import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import QuickCreateForm from '../components/QuickCreateForm';

// Draggable list item component
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
      className={`border rounded-lg p-4 shadow-sm 
        ${isReorderMode ? 'cursor-move' : 'hover:shadow-md hover:border-pink-200'} 
        transition ${isDragging ? 'opacity-50 border-pink-300 bg-pink-50' : ''}`}
    >
      <Link to={`/list/${list.id}`} className={`block ${isReorderMode ? 'pointer-events-none' : ''}`}>
        <div className="flex items-center">
          {isReorderMode && (
            <div className="mr-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl text-pink-600 font-medium hover:text-pink-800">{list.title}</h3>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{list.items} items</span>
              <span>{list.isPublic ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

const MyLists = () => {
  const [activeTab, setActiveTab] = useState('created');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  
  // Example lists data
  const [createdLists, setCreatedLists] = useState([
    { id: 101, title: "My Favorite Pasta Spots", items: 5, isPublic: true },
    { id: 102, title: "Best Date Night Places", items: 8, isPublic: true },
    { id: 103, title: "Quick Lunch Options", items: 12, isPublic: false }
  ]);

  const followingLists = [
    { id: 201, title: "Best Italian in NYC", author: "@pastafan", followers: 423 },
    { id: 202, title: "Affordable Hidden Gems", author: "@foodhunter", followers: 654 },
    { id: 203, title: "Must-Try Desserts", author: "@sweettooth", followers: 521 }
  ];

  const moveItem = (fromIndex, toIndex) => {
    const updatedLists = [...createdLists];
    const [movedItem] = updatedLists.splice(fromIndex, 1);
    updatedLists.splice(toIndex, 0, movedItem);
    setCreatedLists(updatedLists);
  };

  const handleToggleReorder = () => {
    setIsReorderMode(!isReorderMode);
  };
  
  const openQuickCreate = () => {
    setShowQuickCreate(true);
  };

  const closeQuickCreate = () => {
    setShowQuickCreate(false);
  };

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
            <button
              onClick={() => setActiveTab('created')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeTab === 'created'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeTab === 'following'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Following
            </button>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {activeTab === 'created' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Lists You've Created</h2>
                {createdLists.length > 1 && (
                  <button 
                    onClick={handleToggleReorder}
                    className={`py-1.5 px-3 text-sm font-medium rounded-full 
                      ${isReorderMode 
                        ? 'bg-pink-500 text-white' 
                        : 'text-pink-500 border border-pink-500 hover:bg-pink-50'}`}
                  >
                    {isReorderMode ? 'Done Reordering' : 'Reorder Lists'}
                  </button>
                )}
              </div>
              
              <div className="text-center mb-6">
                <button 
                  onClick={openQuickCreate}
                  className="inline-flex items-center text-pink-500 hover:text-pink-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New List
                </button>
              </div>
              
              <ul className="space-y-4">
                {createdLists.map((list, index) => (
                  <DraggableListItem 
                    key={list.id}
                    list={list}
                    index={index}
                    moveItem={moveItem}
                    isReorderMode={isReorderMode}
                  />
                ))}
                
                {createdLists.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    You haven't created any lists yet. Create your first list to get started!
                  </div>
                )}
              </ul>
            </>
          )}
          
          {activeTab === 'following' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Lists You're Following</h2>
              
              <ul className="space-y-4">
                {followingLists.map(list => (
                  <li key={list.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md hover:border-pink-200 transition">
                    <Link to={`/list/${list.id}`} className="block">
                      <h3 className="text-xl text-pink-600 font-medium hover:text-pink-800">{list.title}</h3>
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>by {list.author}</span>
                        <span>{list.followers} followers</span>
                      </div>
                    </Link>
                  </li>
                ))}
                
                {followingLists.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    You're not following any lists yet. Explore trending lists to find some to follow!
                  </div>
                )}
              </ul>
            </>
          )}
        </div>
        
        {/* Universal Quick Add Button */}
        <button
          onClick={openQuickCreate}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shadow-lg flex items-center justify-center text-white hover:from-pink-600 hover:to-orange-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        {/* Quick Create Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-md">
              <div className="absolute top-2 right-2 z-10">
                <button 
                  onClick={closeQuickCreate}
                  className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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