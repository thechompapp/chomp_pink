import React, { useState } from 'react';
import { X } from 'lucide-react';
import QuickCreateForm from './QuickCreateForm';

const FloatingQuickAdd = () => {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [createType, setCreateType] = useState('restaurant');

  const handleOpenQuickCreate = (type) => {
    setCreateType(type);
    setShowQuickCreate(true);
  };

  const handleCloseQuickCreate = () => {
    setShowQuickCreate(false);
  };

  return (
    <>
      <button
        onClick={() => handleOpenQuickCreate('restaurant')}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shadow-lg flex items-center justify-center text-white hover:from-pink-600 hover:to-orange-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {showQuickCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md">
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={handleCloseQuickCreate}
                className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <QuickCreateForm onClose={handleCloseQuickCreate} initialType={createType} />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickAdd;
