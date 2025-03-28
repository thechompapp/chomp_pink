import React, { useState } from 'react';
import { X, Check, Plus, FolderPlus } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const QuickAddPopup = ({ item, onClose }) => {
  const userLists = useAppStore((state) => state.userLists);
  const addToUserList = useAppStore((state) => state.addToUserList);
  const [isAdding, setIsAdding] = useState(false);
  const [addedLists, setAddedLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleSelectList = (listId) => {
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter(id => id !== listId));
    } else {
      setSelectedLists([...selectedLists, listId]);
    }
  };

  const handleAddToLists = () => {
    setIsAdding(true);
    // Add to all selected lists
    selectedLists.forEach(listId => {
      addToUserList(listId, item);
    });
    
    // Store the lists we've added to
    setAddedLists([...addedLists, ...selectedLists]);
    
    // Clear selection after adding
    setSelectedLists([]);
    
    // Show success state but don't close
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  const handleCreateNewList = () => {
    if (newListName.trim()) {
      // In a real app, you would create a new list in your store here
      alert(`New list "${newListName}" would be created here`);
      setShowNewList(false);
      setNewListName('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden border border-[#D1B399]">
        {!showNewList ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#D1B399]/30 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Add {item?.name || 'Item'} to Lists
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#D1B399] p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* List selection */}
            <div className="p-4 max-h-60 overflow-y-auto">
              {userLists.map(list => {
                const isAdded = addedLists.includes(list.id);
                const isSelected = selectedLists.includes(list.id);
                
                return (
                  <button
                    key={list.id}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between mb-2 ${
                      isAdded 
                        ? 'bg-[#D1B399]/10 border border-[#D1B399]'
                        : isSelected
                          ? 'bg-gray-100 border border-[#D1B399]'
                          : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => !isAdded && handleSelectList(list.id)}
                    disabled={isAdded}
                  >
                    <span className={`text-gray-700 font-medium ${isAdded ? 'text-[#D1B399]' : ''}`}>
                      {list.name} {isAdded && '(Added)'}
                    </span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                      isAdded
                        ? 'border-[#D1B399] bg-[#D1B399] text-white'
                        : isSelected
                          ? 'border-[#D1B399] bg-[#D1B399] text-white'
                          : 'border-gray-300'
                    }`}>
                      {(isAdded || isSelected) && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Action buttons */}
            <div className="p-4 border-t border-[#D1B399]/30 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  className="flex-1 py-2 px-4 border border-[#D1B399] text-[#D1B399] rounded-lg hover:bg-[#D1B399] hover:text-white transition-colors font-medium flex items-center justify-center"
                  onClick={() => setShowNewList(true)}
                >
                  <FolderPlus size={18} className="mr-2" />
                  New List
                </button>
                
                <button
                  className={`flex-1 py-2 px-4 border transition-colors font-medium flex items-center justify-center rounded-lg ${
                    selectedLists.length === 0 
                      ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                      : 'border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399] hover:text-white'
                  }`}
                  onClick={handleAddToLists}
                  disabled={selectedLists.length === 0 || isAdding}
                >
                  {isAdding ? (
                    'Added!'
                  ) : (
                    <>
                      <Plus size={18} className="mr-2" />
                      Add to Lists
                    </>
                  )}
                </button>
              </div>
              
              {/* Close button - only shown if items have been added */}
              {addedLists.length > 0 && (
                <button
                  onClick={onClose}
                  className="w-full mt-3 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Done
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create new list view */}
            <div className="p-4 border-b border-[#D1B399]/30 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New List
              </h3>
              <button
                onClick={() => setShowNewList(false)}
                className="text-gray-400 hover:text-[#D1B399] p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="My Awesome List"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none"
                autoFocus
              />
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="makePublic"
                  className="rounded border-gray-300 text-[#D1B399] focus:ring-[#D1B399]"
                />
                <label htmlFor="makePublic" className="ml-2 text-sm text-gray-700">
                  Make this list public
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#D1B399]/30 bg-gray-50">
              <button
                className={`w-full py-2 px-4 border border-[#D1B399] rounded-lg transition-colors font-medium ${
                  !newListName.trim() 
                    ? 'opacity-50 cursor-not-allowed text-gray-400'
                    : 'text-[#D1B399] hover:bg-[#D1B399] hover:text-white'
                }`}
                onClick={handleCreateNewList}
                disabled={!newListName.trim()}
              >
                Create List
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickAddPopup;