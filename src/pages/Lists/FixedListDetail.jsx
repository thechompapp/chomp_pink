// src/pages/Lists/FixedListDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Heart, HeartOff, Loader2, UtensilsCrossed, MapPin, Clock, ChevronDown } from 'lucide-react';
import { listService } from '@/services/listService';
import Button from '@/components/UI/Button';
import PageContainer from '@/layouts/PageContainer';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import { formatRelativeDate } from '@/utils/formatting';
import useAuthStore from '@/stores/useAuthStore';
import FollowButton from '@/components/FollowButton';

function FixedListDetail() {
  const { listId } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  
  // Force DB data by removing mock flags
  useEffect(() => {
    localStorage.removeItem('use_mock_data');
    localStorage.removeItem('list_follow_changes');
  }, []);
  
  // Fetch list data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: () => listService.getListDetails(listId),
    refetchOnWindowFocus: true
  });
  
  // Extract list and items
  const list = data?.list || {};
  const items = data?.items || [];
  
  // Determine if user can edit
  const canEdit = isAuthenticated && user && list?.user_id === user.id;
  const canFollow = isAuthenticated && user && list?.user_id !== user.id;
  
  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <PageContainer>
        <ErrorMessage message="Failed to load list details" />
      </PageContainer>
    );
  }
  
  return (
    <div className="bg-gradient-to-b from-orange-700 via-orange-600 to-amber-600 min-h-screen">
      {/* Food-themed Header Banner */}
      <div className="bg-gradient-to-b from-orange-700 to-orange-800 pt-20 pb-10 px-6 md:px-12 lg:px-20">
        <div className="flex items-center mb-6">
          <button
            onClick={() => window.history.back()}
            className="mr-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="bg-orange-600 p-5 rounded-md shadow-lg mr-6">
            <UtensilsCrossed className="h-12 w-12 text-white" />
          </div>
          
          <div className="flex-1">
            <div className="text-xs uppercase font-semibold text-orange-200 mb-1">Food Collection</div>
            <h1 className="text-4xl font-extrabold text-white mb-2">{list.name || 'Untitled List'}</h1>
            <div className="text-orange-200 text-sm flex items-center space-x-1">
              <span className="font-semibold">{list.creator_handle || 'Foodie'}</span>
              <span>•</span>
              <span>{items.length} dish{items.length !== 1 ? 'es' : ''}</span>
              {list.updated_at && (
                <>
                  <span>•</span>
                  <span>Updated {formatRelativeDate(list.updated_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Description and Tags */}
        {list.description && (
          <p className="text-amber-100 mb-4 max-w-2xl">{list.description}</p>
        )}
        
        <div className="flex items-center mt-6 space-x-4">
          {canFollow && (
            <FollowButton 
              listId={list.id} 
              isFollowing={list.is_following} 
              className="shadow-lg"
            />
          )}
          
          <div className="flex flex-wrap gap-2">
            {list.tags && list.tags.map(tag => (
              <span key={tag} className="bg-amber-700/50 text-amber-100 px-3 py-1 rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
            {list.city && (
              <span className="bg-red-700/50 text-red-100 px-3 py-1 rounded-full text-xs font-medium">
                {list.city}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Spotify-like Playlist Contents */}
      <div className="bg-gray-900 py-6 px-6 md:px-12 lg:px-20 min-h-screen">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-gray-400 text-sm font-medium py-3 px-4 border-b border-gray-800 mb-2">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">TITLE</div>
          <div className="col-span-4">LOCATION</div>
          <div className="col-span-2 text-right">ADDED</div>
        </div>
        
        {/* Item List */}
        {items.length > 0 ? (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div 
                key={item.list_item_id || `item-${index}`}
                className="grid grid-cols-12 py-3 px-4 rounded-md items-center text-gray-300 hover:bg-gray-800/50 group"
              >
                <div className="col-span-1 text-center text-gray-500 group-hover:text-white">{index + 1}</div>
                <div className="col-span-5">
                  <Link
                    to={item.restaurant_id ? `/restaurants/${item.restaurant_id}` : (item.dish_id ? `/dishes/${item.dish_id}` : '#')}
                    className="text-gray-200 font-medium hover:underline group-hover:text-white"
                  >
                    {item.restaurant_name || item.dish_name || 'Unknown Item'}
                  </Link>
                  {item.note && (
                    <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-400">{item.note}</p>
                  )}
                </div>
                <div className="col-span-4 text-gray-500 text-sm truncate group-hover:text-gray-400">
                  {item.restaurant_address || 'No location data'}
                </div>
                <div className="col-span-2 text-right text-gray-500 text-sm group-hover:text-gray-400">
                  {item.added_at ? formatRelativeDate(item.added_at) : 'Recently'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">This playlist is empty</p>
            <p className="mt-2">Items added to this list will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FixedListDetail;
