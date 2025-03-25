import React, { useState } from 'react';
import { X } from 'lucide-react';
import QuickCreateForm from '../pages/QuickCreateForm';

const FloatingQuickAdd = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-30"
        aria-label="Quick Add"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="absolute top-2 right-2 z-50">
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>
            <QuickCreateForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickAdd;
