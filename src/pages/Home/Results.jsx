// src/pages/Home/Results.jsx
import React, { memo, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config';
// Corrected import paths for common components
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Keep existing fetcher function
const fetchAllTrendingData = async () => {
    console.log('[fetchAllTrendingData] Fetching all trending data...');
    const endpoints = {
        restaurants: `${API_BASE_URL}/api/trending/restaurants`,
        dishes: `${API_BASE_URL}/api/trending/dishes`,
        lists: `${API_BASE_URL}/api/trending/lists`,
    };
    try {
        const results = await Promise.all([
             fetch(endpoints.restaurants).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed for restaurants: ${res.status}`))),
             fetch(endpoints.dishes).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed for dishes: ${res.status}`))),
             fetch(endpoints.lists).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed for lists: ${res.status}`)))
        ]);
        const [restaurants, dishes, lists] = results;
        // Formatting logic remains the same
        const formattedRestaurants = (Array.isArray(restaurants) ? restaurants : []).map(r => ({...r, tags: Array.isArray(r.tags) ? r.tags : [] }));
        const formattedDishes = (Array.isArray(dishes) ? dishes : []).map(d => ({...d, tags: Array.isArray(d.tags) ? d.tags : [] }));
        const formattedLists = (Array.isArray(lists) ? lists : []).map(l => ({...l, tags: Array.isArray(l.tags) ? l.tags : [], is_following: l.is_following ?? false }));
        return { restaurants: formattedRestaurants, dishes: formattedDishes, lists: formattedLists };
    } catch (error) {
        console.error('[fetchAllTrendingData] Error fetching trending data:', error);
        // Rethrow a more specific message if possible, or the original
        throw new Error(error.message.includes('Failed for') ? error.message : 'Failed to load trending data');
    }
};


const Results = memo(() => {
  const cityId = useUIStateStore(state => state.cityId);

  // Keep existing React Query fetch
  const {
      data: trendingData, isLoading, isError, error, refetch
  } = useQuery({ queryKey: ['trendingData'], queryFn: fetchAllTrendingData });

  const [expandedSections, setExpandedSections] = useState({ dishes: false, restaurants: false, lists: false });

  // Keep filtering logic
  const filterByCity = useCallback((items) => {
        const safeItems = Array.isArray(items) ? items : [];
        if (!cityId) return safeItems;
        return safeItems.filter(item => item && typeof item.city_id !== 'undefined' && item.city_id === cityId);
   }, [cityId]);
  const filteredRestaurants = useMemo(() => filterByCity(trendingData?.restaurants), [trendingData?.restaurants, filterByCity]);
  const filteredDishes = useMemo(() => filterByCity(trendingData?.dishes), [trendingData?.dishes, filterByCity]);
  const filteredLists = useMemo(() => filterByCity(trendingData?.lists), [trendingData?.lists, filterByCity]);

  const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // Keep renderSection function
  const renderSection = (title, items, Component, sectionKey) => {
       const safeItems = Array.isArray(items) ? items : [];
       const isExpanded = expandedSections[sectionKey];
       const displayLimit = isExpanded ? 12 : 4;
       const displayItems = safeItems.slice(0, displayLimit);
       const canExpand = safeItems.length > 4;

       return (
         <div className="mb-6">
             <div className="flex justify-between items-center mb-3 flex-wrap">
                 <h2 className="text-lg font-semibold text-gray-800">{title} ({safeItems.length})</h2>
                 {canExpand && ( <button onClick={() => toggleSection(sectionKey)} className="text-xs text-[#A78B71] hover:text-[#D1B399] flex items-center font-medium py-1" aria-expanded={isExpanded}> {isExpanded ? 'Show Less' : 'Show More'} {isExpanded ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/> } </button> )}
             </div>
             {safeItems.length === 0 ? (
               <div className="text-center text-gray-500 py-4 text-sm border border-dashed border-gray-200 rounded-lg"> No {title.toLowerCase()} found {cityId ? 'for the selected city' : ''}. </div>
              ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                   {displayItems.map(item => {
                       if (!item || typeof item.id === 'undefined' || item.id === null) { return null; }
                       let props = {...item};
                       if (Component === DishCard) { props.restaurant = item.restaurant_name || item.restaurant; }
                       if (Component === ListCard) { props.is_following = item.is_following ?? false; }
                       return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                   })}
               </div>
              )}
         </div>
       );
   };

  // --- Updated Render Logic ---
  const hasAnyData = trendingData && ( (trendingData.restaurants?.length > 0) || (trendingData.dishes?.length > 0) || (trendingData.lists?.length > 0) );

  if (isLoading && !hasAnyData) {
        return <LoadingSpinner message="Loading trending data..." />;
   }
  if (isError && !hasAnyData) {
       return ( <ErrorMessage message={error?.message || 'Error loading trending data.'} onRetry={refetch} isLoadingRetry={isLoading} /> );
   }
   const noDataAfterLoad = !isLoading && !isError && !hasAnyData;
   if (noDataAfterLoad) { /* ... no data message ... */ }

   const noFilteredResults = filteredDishes.length === 0 && filteredRestaurants.length === 0 && filteredLists.length === 0;

  return (
    <div className="mt-4">
       {noFilteredResults && cityId && hasAnyData && ( <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4"> No trending items match the selected city filter. </div> )}

      {/* Render sections */}
      {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
      {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
      {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}

       {/* Background loading spinner */}
       {isLoading && hasAnyData && ( <LoadingSpinner size="sm" message="Updating..." className="pt-4" messageClassName="text-xs text-gray-400 ml-1" spinnerClassName="text-gray-400" /> )}
    </div>
  );
});

export default Results;