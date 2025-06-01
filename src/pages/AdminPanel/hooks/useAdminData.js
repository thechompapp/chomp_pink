/**
 * useAdminData Hook
 * 
 * Custom hook for fetching and managing admin data.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataProcessor from '../utils/adminDataProcessor';
import { toast } from 'react-hot-toast';

/**
 * Tab configuration for admin panel
 * @type {Object}
 */
export const TAB_CONFIG = {
  submissions: { label: 'Submissions', key: 'submissions' },
  restaurants: { label: 'Restaurants', key: 'restaurants' },
  dishes: { label: 'Dishes', key: 'dishes' },
  users: { label: 'Users', key: 'users' },
  locations: { label: 'Locations', key: 'locations' },
  hashtags: { label: 'Hashtags', key: 'hashtags' },
  restaurant_chains: { label: 'Restaurant Chains', key: 'restaurant_chains' },
  lists: { label: 'Lists', key: 'lists' }
};

/**
 * Custom hook for fetching and managing admin data
 * @returns {Object} Admin data state and functions
 */
const useAdminData = () => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get all endpoint names from TAB_CONFIG
  const endpoints = Object.keys(TAB_CONFIG);
  
  // Use React Query to fetch and cache admin data
  const { 
    data: adminData, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ['adminData'],
    queryFn: () => DataProcessor.fetchAllAdminData(endpoints),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching admin data:', err);
      toast.error(`Error loading admin data: ${err.message || 'Unknown error'}`);
    }
  });
  
  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);
  
  // Handle data refresh
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (err) {
      toast.error(`Error refreshing data: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  
  // Get active tab data
  const activeTabData = adminData?.[activeTab] || [];
  
  return {
    adminData,
    activeTab,
    activeTabData,
    isLoading,
    isRefreshing,
    isError,
    error,
    handleTabChange,
    handleRefresh,
    TAB_CONFIG: TAB_CONFIG
  };
};

export default useAdminData;
