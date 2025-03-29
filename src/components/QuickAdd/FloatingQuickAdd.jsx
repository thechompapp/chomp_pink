import React, { useState } from 'react';
import { X, Plus, Utensils, Store, Map, Coffee } from 'lucide-react';
import QuickAddPopup from './QuickAddPopup';

const FloatingQuickAdd = () => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [createType, setCreateType] = useState('restaurant');
  const [formData, setFormData] = useState({ name: '', location: '', cuisine: '', tags: '' }); // Added for form

  const handleOpenQuickCreate = (type) => {
    setCreateType(type);
    setShowQuickCreate(true);
    setShowQuickMenu(false);
  };

  const handleCloseQuickCreate = () => {
    setShowQuickCreate(false);
    setFormData({ name: '', location: '', cuisine: '', tags: '' }); // Reset form
  };

  // Added form handling with autofill
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name' && createType === 'restaurant' && value === 'Via Carota') {
        newData.location = 'West Village, NYC'; // Mock autofill
        newData.cuisine = 'Italian'; // Mock suggestion
        newData.tags = 'italian, cozy'; // Mock hashtag suggestion
      }
      return newData;
    });
  };

  const quickAddOptions = [
    { id: 'restaurant', label: 'Restaurant', icon: <Store size={18} />, color: 'bg-[#D1B399]' }, // Updated color
    { id: 'dish', label: 'Dish', icon: <Utensils size={18} />, color: 'bg-[#D1B399]' },
    { id: 'place', label: 'Place', icon: <Map size={18} />, color: 'bg-[#D1B399]' },
    { id: 'list', label: 'List', icon: <Coffee size={18} />, color: 'bg-[#D1B399]' }
  ];

  return (
    <>
      {/* Updated CSS */}
      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#D1B399] shadow-lg flex items-center justify-center text-white hover:bg-[#c1a389] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-40"
        aria-label="Quick add"
      >
        {showQuickMenu ? <X size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
      </button>
      {showQuickMenu && (
        <div className="fixed bottom-24 right-6 flex flex-col space-y-3 items-end z-40 animate-fadeIn">
          {quickAddOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <span className="bg-white px-3 py-2 rounded-lg shadow-md text-gray-700 text-sm font-medium">{option.label}</span>
              <button
                onClick={() => handleOpenQuickCreate(option.id)}
                className={`h-12 w-12 rounded-full ${option.color} shadow-md flex items-center justify-center text-white hover:shadow-lg transform hover:scale-105 transition-all`}
              >
                {option.icon}
              </button>
            </div>
          ))}
        </div>
      )}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <div className="absolute top-2 right-2 z-10">
              <button onClick={handleCloseQuickCreate} className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Add New {createType.charAt(0).toUpperCase() + createType.slice(1)}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none"
                    placeholder={`Enter ${createType} name`}
                  />
                </div>
                {createType === 'restaurant' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none"
                        placeholder="Address or neighborhood"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                      <input
                        type="text"
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none"
                        placeholder="e.g. Italian, Thai, etc."
                      />
                    </div>
                  </>
                )}
                {createType === 'dish' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none"
                      placeholder="Where did you have this dish?"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-500 outline-none"
                    placeholder="Add tags separated by commas"
                  />
                </div>
                <button className="w-full py-2 px-4 bg-[#D1B399] text-white rounded-lg hover:bg-[#c1a389] transition-colors shadow-sm mt-4">Save</button> {/* Updated CSS */}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickAdd;