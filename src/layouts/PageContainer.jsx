// src/layouts/PageContainer.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const PageContainer = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <main className="flex-grow w-full p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PageContainer;