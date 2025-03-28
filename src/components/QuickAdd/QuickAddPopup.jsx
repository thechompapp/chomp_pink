import React from 'react';
import useAppStore from '../../hooks/useAppStore';

// A minimal version to get things working
const QuickAddPopup = ({ item, onClose }) => {
  const userLists = useAppStore((state) => state.userLists);
  const addToUserList = useAppStore((state) => state.addToUserList);

  const handleAddToList = (listId) => {
    addToUserList(listId, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Add {item?.name || 'Item'} to List
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          <div className="space-y-2">
            {userLists.map(list => (
              <button
                key={list.id}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => handleAddToList(list.id)}
              >
                <span className="text-gray-700">{list.name}</span>
                <span className="text-pink-500">+</span>
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <button
              className="w-full py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddPopup;