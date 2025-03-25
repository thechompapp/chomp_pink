import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MyLists from './pages/MyLists';
import ListDetail from './pages/ListDetail';
import CreateList from './pages/CreateList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MyLists />} />
        <Route path="/mylists" element={<MyLists />} />
        <Route path="/list/:id" element={<ListDetail />} />
        <Route path="/createlist" element={<CreateList />} />
      </Routes>
    </Router>
  );
}

export default App;
