/* src/pages/Lists/index.jsx */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ListCard from './ListCard';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';
import { Loader2 } from 'lucide-react';

// Lists component for My Lists page
const Lists = () => {
  const [activeTab, setActiveTab] = useState('created');
  const [createdLists, setCreatedLists] = useState([]);
  const [followedLists, setFollowedLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuthStore();

  // Helper to check if a list is being followed
  const isListFollowed = (listId) => {
    try {
      const key = `follow_state_${listId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data).isFollowing : false;
    } catch (e) {
      console.error('Error checking follow state:', e);
      return false;
    }
  };

  // Fetch lists from API
  const fetchLists = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[Lists] Fetching lists from API...');
      
      // Get all lists
      const listsResponse = await listService.getUserLists({ view: 'all' });
      console.log('[Lists] API response:', listsResponse);
      
      if (listsResponse?.data) {
        // Filter for created lists
        const created = listsResponse.data.filter(list => 
          list.user_id === user?.id || list.created_by_user === true
        );
        setCreatedLists(created);
        
        // Filter for followed lists
        const followed = listsResponse.data.filter(list => {
          // Check both API flag and localStorage
          return (list.is_following === true || isListFollowed(list.id)) && 
                 list.user_id !== user?.id && 
                 !list.created_by_user;
        });
        setFollowedLists(followed);
        
        console.log('[Lists] Created lists count:', created.length);
        console.log('[Lists] Followed lists count:', followed.length);
      }
      
      setError(null);
    } catch (err) {
      console.error('[Lists] Error fetching lists:', err);
      setError('Failed to load your lists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLists();
  }, [isAuthenticated, user]);
  
  // Listen for list follow changes
  useEffect(() => {
    const handleFollowChange = () => {
      console.log('[Lists] Follow state changed, refreshing lists...');
      fetchLists();
    };
    
    window.addEventListener('listFollowChanged', handleFollowChange);
    return () => window.removeEventListener('listFollowChanged', handleFollowChange);
  }, []);
  
  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('follow_state_')) {
        console.log('[Lists] LocalStorage follow state changed, refreshing lists...');
        fetchLists();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        <p className="text-center text-black">Please log in to view your lists.</p>
        <Link to="/login" className="text-blue-600 hover:underline block text-center mt-4">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        <div className="flex justify-center">
          <Loader2 className="animate-spin" size={24} />
          <span className="ml-2">Loading your lists...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
        <p className="text-center text-red-500">{error}</p>
        <button 
          className="mx-auto mt-4 block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          onClick={fetchLists}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get the current lists to display based on active tab
  const currentLists = activeTab === 'created' ? createdLists : followedLists;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-black">My Lists</h2>
      
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('created')}
            className={`pb-2 px-4 ${activeTab === 'created' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-600'}`}
          >
            Lists I Created
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`pb-2 px-4 ${activeTab === 'following' ? 'text-black border-b-2 border-black font-medium' : 'text-gray-600'}`}
          >
            Lists I'm Following
          </button>
        </div>
      </div>
      
      {currentLists.length === 0 ? (
        <div className="text-center text-black mb-8">
          <p className="mb-4">
            {activeTab === 'created' 
              ? "You haven't created any lists yet." 
              : "You aren't following any lists yet."}
          </p>
          {activeTab === 'created' && (
            <Link 
              to="/create-list" 
              className="inline-block bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition"
            >
              Create a List
            </Link>
          )}
          {activeTab === 'following' && (
            <Link 
              to="/explore" 
              className="inline-block bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition"
            >
              Explore Lists
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentLists.map(list => (
            <ListCard 
              key={list.id} 
              list={list}
              onDetailsClick={() => {
                // Use ListDetailContext to open modal
                window.location.href = `/list/${list.id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Lists;
