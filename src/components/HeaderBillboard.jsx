// src/components/HeaderBillboard.jsx
import React from 'react';

const HeaderBillboard = () => {
  return (
    <div className="bg-[#A78B71] text-white rounded-lg p-4 mb-6 max-w-4xl mx-auto shadow-md">
      <h2 className="text-lg font-semibold mb-2">Sponsored Content</h2>
      <p className="text-sm">
        Discover the best dining experiences with our partners! Visit{' '}
        <a href="https://example.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-200">
          Example Partner
        </a>{' '}
        to learn more.
      </p>
    </div>
  );
};

export default HeaderBillboard;