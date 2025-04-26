/* src/pages/Lists/index.jsx */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
// Corrected import: Use named import for listService
import { listService } from '@/services/listService';
import * as logger from '@/utils/logger'; // Assuming logger is used or might be added

const Lists = () => {
  const { isAuthenticated } = useAuthStore();

  // Use logger (if needed, otherwise remove import)
  logger.logDebug('[Lists] Component rendered, isAuthenticated:', isAuthenticated);

  const { data, isLoading, error } = useQuery({
    queryKey: ['userLists', { view: 'created' }], // Add view to queryKey for clarity
    // Call listService with the 'created' view specifically for this page
    queryFn: () => listService.getUserLists({ view: 'created' }),
    enabled: isAuthenticated, // Only fetch if logged in
    // Using data structure returned by updated service { data: [], pagination: {} }
    select: (response) => response?.data || [], // Select the lists array from the response data
    placeholderData: [], // Start with empty array placeholder
  });

  // Use logger (if needed)
  logger.logDebug('[Lists] Query state:', { isLoading, error, data });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        <p className="text-center text-black">Please log in to view your lists.</p>
        <Link to="/login" className="text-[#A78B71] hover:underline block text-center mt-4">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        {/* TODO: Add list skeletons here */}
        <p className="text-center text-black">Loading your lists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        <p className="text-center text-red-600">Error loading lists: {error.message}</p>
      </div>
    );
  }

  // Data is now directly the array of lists due to the 'select' function
  const lists = data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-black">My Lists</h2>
         <Link
            to="/lists/new"
            className="px-4 py-2 bg-[#A78B71] text-white rounded hover:bg-[#967969] transition-colors text-sm font-medium"
          >
            + Create New List
          </Link>
      </div>

      {lists.length === 0 ? (
        <div className="text-center border border-dashed border-gray-300 p-8 rounded-lg bg-gray-50">
          <p className="text-gray-600">You haven't created any lists yet.</p>
          <Link
             to="/lists/new"
             className="mt-4 inline-block px-4 py-2 bg-[#A78B71] text-white rounded hover:bg-[#967969] transition-colors text-sm font-medium"
           >
             Create Your First List
           </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {lists.map((list) => (
             // Using ListCard component for consistency is recommended if available and suitable
             // Or keep simpler display if preferred for this specific page
            <li key={list.id} className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
              <Link to={`/lists/${list.id}`} className="text-lg font-semibold text-[#A78B71] hover:underline block mb-1">
                {list.name}
              </Link>
              <div className="text-sm text-gray-500 flex space-x-4">
                 <span>Items: {list.item_count || 0}</span>
                 <span>Type: <span className="capitalize">{list.list_type}</span></span>
                 <span>{list.is_public ? 'Public' : 'Private'}</span>
              </div>
               {/* Optionally display tags */}
               {list.tags && list.tags.length > 0 && (
                 <div className="mt-2 flex flex-wrap gap-1">
                   {list.tags.slice(0, 5).map(tag => (
                     <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">#{tag}</span>
                   ))}
                   {list.tags.length > 5 && <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">...</span>}
                 </div>
               )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Lists;