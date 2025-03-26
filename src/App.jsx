import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Trending from './pages/Trending';
import MyLists from './pages/MyLists';
import CreateList from './pages/CreateList';
import ListDetail from './pages/ListDetail';
import RestaurantDetail from './pages/RestaurantDetail';
import DishDetail from './pages/DishDetail';
import QuickCreateForm from './pages/QuickCreateForm';
import NightPlanner from './pages/NightPlanner';


function App() {
  return (
    <div className="app-container min-h-screen bg-gray-100 text-gray-900">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/mylists" element={<MyLists />} />
          <Route path="/createlist" element={<CreateList />} />
          <Route path="/list/:id" element={<ListDetail />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/dish/:id" element={<DishDetail />} />
          <Route path="/quickadd" element={<QuickCreateForm />} />
          <Route path="/nightplanner" element={<NightPlanner />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
