import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Home from './components/UI/Home';
import RestaurantDetail from './components/UI/RestaurantDetail';
import Lists from './components/UI/Lists';
import Dashboard from './components/UI/Dashboard';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/settings/pending" element={<Dashboard />} />
            <Route path="*" element={<div className="text-center py-10 text-gray-500">404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;