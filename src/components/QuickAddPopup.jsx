// src/components/QuickAddPopup.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useQuickAdd } from '../context/QuickAddContext';
import useAppStore from '../hooks/useAppStore';

const QuickAddPopup = () => {
  const { isOpen, closeQuickAdd, item } = useQuickAdd();
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedListId, setSelectedListId] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  // Use store selectors
  const myLists = useAppStore(state => state.myLists);
  const fetchMyLists = useAppStore(state => state.fetchMyLists);
  const addItemToList = useAppStore(state => state.addItemToList);
  const createList = useAppStore(state => state.createList);
  const isLoading = useAppStore(state => state.isLoading);
  
  useEffect(() => {
    if (isOpen) {
      // Fetch lists when popup opens
      fetchMyLists();
      setActiveTab('existing');
      setSelectedListId('');
      setNewListName('');
      setNewListDescription('');
      setIsPrivate(false);
      setSuccessMessage('');
      setError('');
    }
  }, [isOpen, fetchMyLists]);
  
  // Reset state when item changes
  useEffect(() => {
    setSelectedListId('');
    setSuccessMessage('');
    setError('');
  }, [item]);
  
  const handleAddToExistingList = async (e) => {
    e.preventDefault();
    
    if (!selectedListId) {
      setError('Please select a list');
      return;
    }
    
    try {
      const updatedList = await addItemToList(parseInt(selectedListId), item);
      if (updatedList) {
        setSuccessMessage(`Added to list successfully!`);
        setTimeout(() => {
          closeQuickAdd();
        }, 1500);
      }
    } catch (err) {
      setError('Failed to add item to list. Please try again.');
    }
  };
  
  const handleCreateNewList = async (e) => {
    e.preventDefault();
    
    if (!newListName.trim()) {
      setError('Please enter a list name');
      return;
    }
    
    try {
      const listData = {
        name: newListName.trim(),
        description: newListDescription.trim(),
        is_private: isPrivate,
        items: item ? [item] : []
      };
      
      const newList = await createList(listData);
      if (newList) {
        setSuccessMessage('List created successfully!');
        setTimeout(() => {
          closeQuickAdd();
        }, 1500);
      }
    } catch (err) {
      setError('Failed to create list. Please try again.');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-lg relative overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={closeQuickAdd}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        
        {/* Title */}
        <h2 className="text-xl font-bold mb-4 pr-6">
          {item ? `Add "${item.name}" to a List` : 'Create a New List'}
        </h2>
        
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
            <div className="loader">Loading...</div>
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded flex items-center">
            <Check size={16} className="mr-2" />
            {successMessage}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        {/* Tabs - Only show if we have an item to add */}
        {item && (
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('existing')}
              className={`py-2 px-4 ${
                activeTab === 'existing'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Existing List
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`py-2 px-4 ${
                activeTab === 'new'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              New List
            </button>
          </div>
        )}
        
        {/* Add to Existing List Form */}
        {(activeTab === 'existing' && item) && (
          <form onSubmit={handleAddToExistingList}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a List
              </label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="">-- Select a List --</option>
                {myLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !selectedListId}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              Add to List
            </button>
          </form>
        )}
        
        {/* Create New List Form */}
        {(activeTab === 'new' || !item) && (
          <form onSubmit={handleCreateNewList}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="My Awesome List"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md h-20"
                placeholder="A short description of your list"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Private List</span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !newListName.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
            >
              <Plus size={16} className="mr-2" />
              Create {item ? '& Add Item' : 'New List'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickAddPopup;