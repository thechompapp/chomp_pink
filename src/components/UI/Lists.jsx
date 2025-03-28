import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SortAsc, SortDesc, CalendarDays, Utensils, Store } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import PageLayout from '../Layout/PageLayout';

const Lists = () => {
  const userLists = useAppStore((state) => state.userLists);
  const [sortMethod, setSortMethod] = useState('default');
  const [filterType, setFilterType] = useState('all'); // 'all', 'restaurants', 'dishes'

  // Initialize list metadata if needed
  const initializeListsMetadata = useAppStore((state) => state.initializeListsMetadata);
  
  useEffect(() => {
    // Ensure all lists have proper metadata
    initializeListsMetadata();
  }, [initializeListsMetadata]);

  const getSortedLists = () => {
    if (!userLists) return [];
    
    const listsToSort = [...userLists];
    
    // Apply type filter first
    const filteredLists = filterType === 'all' 
      ? listsToSort
      : listsToSort.filter(list => {
          // Check the first item to determine list type, default to 'all' if empty
          if (!list.items || list.items.length === 0) return true;
          const isRestaurantsList = !list.items[0].restaurant;
          return filterType === 'restaurants' ? isRestaurantsList : !isRestaurantsList;
        });
    
    // Then apply sorting
    switch (sortMethod) {
      case 'a-z':
        return filteredLists.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return filteredLists.sort((a, b) => b.name.localeCompare(a.name));
      case 'date':
        return filteredLists.sort((a, b) => new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0));
      case 'default':
      default:
        return filteredLists;
    }
  };

  const sortedLists = getSortedLists();

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">My Lists</h1>
        
        {/* Filter and sort controls - Enhanced for better mobile display */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
          {/* Type filter buttons - Better wrapping on mobile */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              All Lists
            </button>
            <button
              onClick={() => setFilterType('restaurants')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                filterType === 'restaurants'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              <Store size={16} className="mr-1" />
              <span className="whitespace-nowrap">Restaurants</span>
            </button>
            <button
              onClick={() => setFilterType('dishes')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                filterType === 'dishes'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              <Utensils size={16} className="mr-1" />
              <span className="whitespace-nowrap">Dishes</span>
            </button>
          </div>
          
          {/* Sort buttons - Better wrapping on mobile */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortMethod('a-z')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                sortMethod === 'a-z'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              <SortAsc size={16} className="mr-1" />
              A-Z
            </button>
            <button
              onClick={() => setSortMethod('z-a')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                sortMethod === 'z-a'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              <SortDesc size={16} className="mr-1" />
              Z-A
            </button>
            <button
              onClick={() => setSortMethod('date')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                sortMethod === 'date'
                  ? 'bg-[#D1B399] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
              }`}
            >
              <CalendarDays size={16} className="mr-1" />
              Date
            </button>
          </div>
        </div>

        {userLists.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D1B399]/20 p-6 sm:p-8 text-center">
            <p className="text-gray-500 mb-4">You have no lists yet.</p>
            <p className="text-sm text-gray-500">Start adding items from the home page or trending section!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sortedLists.map(list => {
              // Determine list type based on first item
              const listType = list.items && list.items.length > 0 && list.items[0].restaurant 
                ? 'dishes' 
                : 'restaurants';
              
              return (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="bg-white rounded-xl border border-[#D1B399]/20 p-4 sm:p-5 hover:border-[#D1B399] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{list.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      listType === 'restaurants' 
                        ? 'bg-pink-100 text-pink-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {listType === 'restaurants' ? 'Restaurants' : 'Dishes'}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                    <span className="mx-1">•</span>
                    {list.isPublic ? 'Public' : 'Private'}
                  </p>
                  
                  {/* Preview of first few items */}
                  {list.items.length > 0 ? (
                    <div className="space-y-1">
                      {list.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs sm:text-sm truncate text-gray-700">
                          {i + 1}. {item.name}
                        </div>
                      ))}
                      {list.items.length > 3 && (
                        <div className="text-xs sm:text-sm text-[#D1B399]">
                          +{list.items.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-400 italic">Empty list</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Lists;