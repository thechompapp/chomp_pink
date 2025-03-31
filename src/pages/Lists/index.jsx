import React from 'react';
import { Outlet } from 'react-router-dom';

const Lists = () => {
  return (
    <div className="mb-8">
      <Outlet /> {/* Render nested routes like MyLists */}
    </div>
  );
};

export default Lists;