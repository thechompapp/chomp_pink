// src/layouts/PageContainer.jsx
import React from "react";
import Navbar from "@/layouts/Navbar"; // Absolute import
import FloatingQuickAdd from "@/components/FloatingQuickAdd"; // Absolute import
import { Outlet } from "react-router-dom"; // *** IMPORT Outlet ***

// Removed the 'children' prop as it's not used with Outlet
const PageContainer = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Render the matched child route component using Outlet */}
      <main className="flex-1">
        <Outlet /> {/* *** USE Outlet HERE *** */}
      </main>
      <FloatingQuickAdd />
    </div>
  );
};

export default PageContainer;