// src/App.jsx
import React from 'react';
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
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
// *** IMPORT Register Page ***
import Register from './pages/Register';

const App = () => {
  // ... (keep console logs and potential loadUser effect) ...

  return (
    <QuickAddProvider>
      <BrowserRouter>
        <QuickAddPopup />
        <Routes>
          {/* Routes within the main PageContainer */}
          <Route element={<PageContainer />}>
              {/* ... existing routes within PageContainer ... */}
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/trending" element={<ErrorBoundary><Trending /></ErrorBoundary>} />
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/lists" element={<ErrorBoundary><Lists /></ErrorBoundary>}>
                  <Route index element={<MyLists />} />
                  <Route path=":id" element={<ListDetail />} />
              </Route>
              <Route path="/restaurant/:id" element={<ErrorBoundary><RestaurantDetail /></ErrorBoundary>} />
              <Route path="/dish/:id" element={<ErrorBoundary><DishDetail /></ErrorBoundary>} />
              <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Routes OUTSIDE PageContainer */}
          <Route path="/login" element={<Login />} />
          {/* *** ADD Register Route *** */}
          <Route path="/register" element={<Register />} />

          {/* Optional top-level fallback */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </BrowserRouter>
    </QuickAddProvider>
  );
};

export default App;