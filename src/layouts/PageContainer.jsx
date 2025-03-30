import React from "react";
import Navbar from "@/layouts/Navbar"; // Absolute import
import FloatingQuickAdd from "@/components/FloatingQuickAdd"; // Absolute import

const PageContainer = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <FloatingQuickAdd />
    </div>
  );
};

export default PageContainer;