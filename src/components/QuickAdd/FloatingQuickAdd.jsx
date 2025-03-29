import React, { useState } from 'react';
import { X, Plus, Utensils, Store, Map, Coffee } from 'lucide-react';
import QuickAddPopup from './QuickAddPopup';

const FloatingQuickAdd = () => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [createType, setCreateType] = useState('restaurant');

  const handleOpenQuickCreate = (type) => {
    setCreateType(type);
    setShowQuickCreate(true);
    setShowQuickMenu(false);
  };

  const handleCloseQuickCreate = () => {
    setShowQuickCreate(false);
  };

  const quickAddOptions = [
    { id: 'restaurant', label: 'Restaurant', icon: <Store size={18} />, color: 'bg-[#D1B399]' },
    { id: 'dish', label: 'Dish', icon: <Utensils size={18} />, color: 'bg-[#D1B399]' },
    { id: 'place', label: 'Place', icon: <Map size={18} />, color: 'bg-[#D1B399]' },
    { id: 'list', label: 'List', icon: <Coffee size={18} />, color: 'bg-[#D1B399]' }
  ];

  return (
    <>
      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#D1B399] shadow-lg flex items-center justify-center text-white hover:bg-[#c1a389] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] z-40"
        aria-label="Quick add"
      >
        {showQuickMenu ? <X size={24} /> : <Plus size={24} />}
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
        <QuickAddPopup 
          createType={createType}
          onClose={handleCloseQuickCreate}
        />
      )}
    </>
  );
};

export default FloatingQuickAdd;