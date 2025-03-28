import React from 'react';
import Navbar from './Navbar';

const PageContainer = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 w-full"> {/* Remove any margin/padding */}
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
