import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { SortAsc, SortDesc, CalendarDays, Utensils, Store } from 'lucide-react';
import useAppStore from '@/hooks/useAppStore';

const Lists = () => {
  return (
    <div className="mb-8">
      <Outlet /> {/* Render nested routes like MyLists */}
    </div>
  );
};

export default Lists;