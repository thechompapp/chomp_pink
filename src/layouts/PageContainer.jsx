// src/layouts/PageContainer.jsx
import React from "react";
import Navbar from "@/layouts/Navbar"; // Absolute import
import FloatingQuickAdd from "@/components/FloatingQuickAdd"; // Absolute import
import ErrorBoundary from "@/components/ErrorBoundary"; // *** IMPORT ErrorBoundary ***
import { Outlet } from "react-router-dom";

const PageContainer = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Wrap the Outlet (which renders the page content) with ErrorBoundary */}
      <main className="flex-1">
        <ErrorBoundary> {/* *** WRAP Outlet *** */}
          <Outlet />
        </ErrorBoundary> {/* *** END WRAP *** */}
      </main>
      <FloatingQuickAdd />
    </div>
  );
};

export default PageContainer;