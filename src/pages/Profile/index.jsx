// src/pages/Profile/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, List, Heart } from 'lucide-react';
import Button from '@/components/Button';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

const fetchUserProfile = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  return await apiClient(`/api/users/${userId}/profile`, 'UserProfile Fetch');
};

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user?.id),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">Please log in to view your profile.</p>
          <Button onClick={() => navigate('/login')} variant="secondary" size="sm">Log In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error?.message || 'Failed to load profile data.'}
          onRetry={refetch}
          isLoadingRetry={isLoading}
        >
          <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>
        </ErrorMessage>
      </div>
    );
  }

  const profileData = data || {
    listsCreated: 0,
    listsFollowing: 0,
    dishesFollowing: 0,
    restaurantsFollowing: 0,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back
      </Button>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 mr-4">
            {user?.handle?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              @{user?.handle || 'Unknown'}
              {user?.account_type === 'contributor' && (
                <CheckCircle size={16} className="ml-2 text-green-500" title="Verified Contributor" />
              )}
            </h1>
            <p className="text-sm text-gray-600">
              Account Type: {user?.account_type === 'contributor' ? 'Contributor' : 'User'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#A78B71]" />
              <span className="text-sm font-medium text-gray-800">Lists Created</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{profileData.listsCreated}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2">
              <List size={16} className="text-[#A78B71]" />
              <span className="text-sm font-medium text-gray-800">Lists Following</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{profileData.listsFollowing}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#A78B71]" />
              <span className="text-sm font-medium text-gray-800">Dishes Following</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{profileData.dishesFollowing}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#A78B71]" />
              <span className="text-sm font-medium text-gray-800">Restaurants Following</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{profileData.restaurantsFollowing}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;