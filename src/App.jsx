// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Trending from './pages/Trending';
import RestaurantDetail from './pages/RestaurantDetail';
import DishDetail from './pages/DishDetail';
import MyLists from './pages/Lists/MyLists';
import ListDetail from './pages/Lists/ListDetail';
import Search from './pages/Search';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import NightPlanner from './pages/NightPlanner';
import { QuickAddProvider } from './context/QuickAddContext';
import QuickAddPopup from './components/QuickAddPopup';
import FloatingQuickAdd from './components/FloatingQuickAdd';
import useAppStore from './hooks/useAppStore';

function App() {
  const fetchInitialData = useAppStore(state => state.fetchInitialData);
  
  useEffect(() => {
    // Load filter options on app start
    fetchInitialData();
  }, [fetchInitialData]);
  
  return (
    <Router>
      <QuickAddProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/dish/:id" element={<DishDetail />} />
          <Route path="/lists" element={<MyLists />} />
          <Route path="/list/:id" element={<ListDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/night-planner" element={<NightPlanner />} />
        </Routes>
        
        {/* Global Components */}
        <QuickAddPopup />
        <FloatingQuickAdd />
      </QuickAddProvider>
    </Router>
  );
}

export default App;