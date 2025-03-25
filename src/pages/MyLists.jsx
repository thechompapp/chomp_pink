import React from 'react';
import { Link } from 'react-router-dom';

const MyLists = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">My Lists</h1>
      
      <div className="flex justify-center mb-6">
        <button className="bg-gray-200 px-4 py-2 mx-1 rounded">Created</button>
        <button className="bg-gray-200 px-4 py-2 mx-1 rounded">Following</button>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Lists You've Created</h2>
        <p className="text-gray-600 mb-2">(Use arrows to reorder)</p>
        
        <div className="text-center mb-6">
          <Link to="/createlist" className="text-blue-600 hover:text-blue-800">+ New List</Link>
        </div>
        
        <ul className="space-y-4">
          <li className="border rounded-lg p-4 shadow-sm">
            <Link to="/list/1" className="text-xl text-blue-600 font-medium">My Favorite Pasta Spots</Link>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>5 items</span>
              <span>Public</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MyLists;
