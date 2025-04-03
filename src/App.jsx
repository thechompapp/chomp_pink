import React from 'react'; // Make sure imports are present if needed
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QuickAddProvider } from './context/QuickAddContext';
import PageContainer from './layouts/PageContainer';
import Home from './pages/Home';
import Trending from './pages/Trending';
import Dashboard from './pages/Dashboard';
import Lists from './pages/Lists';
import MyLists from './pages/Lists/MyLists';
import ListDetail from './pages/Lists/ListDetail';
import RestaurantDetail from './pages/RestaurantDetail';
import DishDetail from './pages/DishDetail';
import AdminPanel from './pages/AdminPanel';
import QuickAddPopup from './components/QuickAddPopup';

// Define the App component function
const App = () => {
  // Inside the App component function in src/App.jsx

  console.log("--- App Component Mounting ---"); // Keep this log
  console.log("[App Render] Rendering main application structure.");

  return (
    <>
      <h1>App Component Rendered</h1>
      {/* Temporarily commented out everything else */}
      {
      <QuickAddProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PageContainer />}>
              <Route path="/" element={<Home />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/lists" element={<Lists />}>
                  <Route index element={<MyLists />} />
                  <Route path=":id" element={<ListDetail />} />
              </Route>
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/dish/:id" element={<DishDetail />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <QuickAddPopup />
        </BrowserRouter>
      </QuickAddProvider>
      }
    </>
  );
}; // End of App component function definition

export default App; // Make sure to export the component