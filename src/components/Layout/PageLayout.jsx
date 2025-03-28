import React from 'react';

const PageLayout = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full px-2 sm:px-4">
        <div className="max-w-6xl mx-auto py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;