import React from 'react';
import { Link } from 'react-router-dom';

const QuickAddButton = () => {
  return (
    <Link 
      to="/quickadd" 
      className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      aria-label="Quick Add"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </Link>
  );
};

export default QuickAddButton;
