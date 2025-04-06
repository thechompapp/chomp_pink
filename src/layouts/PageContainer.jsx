// src/layouts/PageContainer.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const PageContainer = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      {/* Ensure padding exists on the main content area */}
      <main className="flex-grow w-full p-4 md:p-6"> {/* Added responsive padding */}
        <Outlet />
      </main>
    </div>
  );
};

export default PageContainer;