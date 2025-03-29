import React, { useState, useCallback, useEffect } from 'react';
import { X, Check, Plus, FolderPlus } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const QuickAddPopup = ({ item, onClose }) => {
  const userLists = useAppStore((state) => state.userLists);
  const addToUserList = useAppStore((state) => state.addToUserList);
  const createList = useAppStore((state) => state.createList);
  const [isAdding, setIsAdding] = useState(false);
  const [addedLists, setAddedLists] = useState([]);
  const [selectedLists, setSelectedLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    restaurant: item?.restaurant || '',
    tags: item?.tags || [],
    location: item?.location || '',
    city: item?.city || '',
    neighborhood: item?.neighborhood || '',
    type: item?.type || ''
  });

  useEffect(() => {
    setFormData({
      name: item?.name || '',
      restaurant: item?.restaurant || '',
      tags: item?.tags || [],
      location: item?.location || '',
      city: item?.city || '',
      neighborhood: item?.neighborhood || '',
      type: item?.type || ''
    });
  }, [item]);

  const handleSelectList = useCallback((listId) => {
    setSelectedLists(prev => prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]);
  }, []);

  const handleAddToLists = useCallback(() => {
    setIsAdding(true);
    const now = new Date();
    selectedLists.forEach(listId => {
      const itemWithDate = { ...formData, dateAdded: now.toISOString() };
      addToUserList(listId, itemWithDate);
    });
    setAddedLists(prev => [...prev, ...selectedLists]);
    setSelectedLists([]);
    setTimeout(() => setIsAdding(false), 1000);
  }, [selectedLists, formData, addToUserList]);

  const handleCreateNewList = useCallback(() => {
    if (newListName.trim()) {
      createList(newListName, isPublic);
      setShowNewList(false);
      setNewListName('');
      setIsPublic(false);
      onClose();
    }
  }, [newListName, isPublic, createList, onClose]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (item.type === 'restaurant' && name === 'name') {
        if (value.toLowerCase().includes('via carota')) {
          newData.location = '51 Grove Street, New York, NY 10014';
          newData.suggestedTags = ['italian', 'cozy', 'pasta', 'romantic', 'trendy'];
        } else if (value.toLowerCase().includes('shake shack')) {
          newData.location = '366 Columbus Ave, New York, NY 10024';
          newData.suggestedTags = ['burgers', 'fast-food', 'casual', 'american', 'fries'];
        } else {
          newData.location = '';
          newData.suggestedTags = [];
        }
      }
      if (item.type === 'dish' && name === 'name') {
        if (value.toLowerCase().includes('pizza')) {
          newData.suggestedTags = ['pizza', 'italian', 'cheesy', 'crust', 'toppings'];
        } else if (value.toLowerCase().includes('burger')) {
          newData.suggestedTags = ['burger', 'beef', 'fast-food', 'juicy', 'bun'];
        } else {
          newData.suggestedTags = [];
        }
      }
      return newData;
    });
  }, [item]);

  const handleTagClick = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  }, []);

  const renderForm = () => {
    if (item.type === 'restaurant') {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Via Carota"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none mb-2"
            autoFocus
          />
          {formData.location && (
            <p className="text-sm text-gray-600 mb-2">Location: {formData.location}</p>
          )}
        </>
      );
    } else if (item.type === 'dish') {
      return (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Cacio e Pepe"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none mb-2"
            autoFocus
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
          <input
            type="text"
            name="restaurant"
            value={formData.restaurant}
            onChange={handleInputChange}
            placeholder="e.g., Via Carota"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none mb-2"
          />
        </>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden border border-[#D1B399]" onClick={e => e.stopPropagation()}>
        {!showNewList ? (
          <>
            <div className="p-4 border-b border-[#D1B399]/30 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Add {formData.name || item.type} to Lists</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-[#D1B399] p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {renderForm()}
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              {formData.suggestedTags && formData.suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-2 py-1 text-sm rounded-full ${formData.tags.includes(tag) ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399] hover:text-white'} transition-colors`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(', ').filter(t => t) }))}
                placeholder="Add custom tags, separated by commas"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none mb-4"
              />
              {userLists.map(list => {
                const isAdded = addedLists.includes(list.id);
                const isSelected = selectedLists.includes(list.id);
                return (
                  <button
                    key={list.id}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between mb-2 ${isAdded ? 'bg-[#D1B399]/10 border border-[#D1B399]' : isSelected ? 'bg-gray-100 border border-[#D1B399]' : 'hover:bg-gray-50 border border-transparent'}`}
                    onClick={() => !isAdded && handleSelectList(list.id)}
                    disabled={isAdded}
                  >
                    <span className={`text-gray-700 font-medium ${isAdded ? 'text-[#D1B399]' : ''}`}>{list.name} {isAdded && '(Added)'}</span>
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${isAdded ? 'border-[#D1B399] bg-[#D1B399] text-white' : isSelected ? 'border-[#D1B399] bg-[#D1B399] text-white' : 'border-gray-300'}`}>{(isAdded || isSelected) && <Check size={12} />}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-[#D1B399]/30 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  className="flex-1 py-2 px-4 border border-[#D1B399] text-[#D1B399] rounded-lg hover:bg-[#D1B399] hover:text-white transition-colors font-medium flex items-center justify-center"
                  onClick={() => setShowNewList(true)}
                >
                  <FolderPlus size={18} className="mr-2" />New List
                </button>
                <button
                  className={`flex-1 py-2 px-4 border transition-colors font-medium flex items-center justify-center rounded-lg ${selectedLists.length === 0 ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400' : 'border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399] hover:text-white'}`}
                  onClick={handleAddToLists}
                  disabled={selectedLists.length === 0 || isAdding}
                >
                  {isAdding ? 'Added!' : <><Plus size={18} className="mr-2" />Add to Lists</>}
                </button>
              </div>
              {addedLists.length > 0 && (
                <button onClick={onClose} className="w-full mt-3 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">Done</button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-[#D1B399]/30 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Create New List</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-[#D1B399] p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="My Awesome List"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] outline-none mb-4"
                autoFocus
              />
              <div className="flex items-center">
                <label htmlFor="makePublic" className="text-sm text-gray-700 mr-3">Public</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="makePublic"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="toggle-checkbox absolute opacity-0 w-0 h-0"
                  />
                  <label
                    htmlFor="makePublic"
                    className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors"
                  >
                    <span className={`toggle-inner absolute block w-4 h-4 mt-1 ml-1 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${isPublic ? 'translate-x-4' : 'translate-x-0'}`}></span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#D1B399]/30 bg-gray-50">
              <button
                className={`w-full py-2 px-4 border border-[#D1B399] rounded-lg transition-colors font-medium ${!newListName.trim() ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-[#D1B399] hover:bg-[#D1B399] hover:text-white'}`}
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