/* src/pages/Profile/index.jsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, List, Heart } from 'lucide-react';
import Button from '@/components/UI/Button';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { getDefaultApiClient } from '@/services/http';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import NotificationPreferences from '@/components/NotificationPreferences';

// Fetcher function for current user profile
const fetchUserProfile = async () => {
  // Get the API client instance
  const apiClient = getDefaultApiClient();
  
  try {
    // Get current user profile from auth endpoint (no /api prefix needed)
    const response = await apiClient.get('/auth/me');
    
    // Check if response has the expected structure
    if (!response?.data || !response.data.success) {
      const message = response?.data?.error || response?.data?.message || "Invalid profile data received from server.";
      const error = new Error(message);
      error.status = response?.status ?? 500;
      throw error;
    }
    
    // Create a profile structure with user data and mock stats for now
    const userData = response.data.data;
    const profileData = {
      user: userData,
      stats: {
        listsCreated: 0,      // Mock data until we have real stats
        listsFollowing: 0,    // Mock data until we have real stats  
        dishesFollowing: 0,   // Mock data until we have real stats
        restaurantsFollowing: 0 // Mock data until we have real stats
      }
    };
    
    // Return the combined profile data
    return profileData;
  } catch (error) {
    // Handle API errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message || `Server error: ${status}`;
      const newError = new Error(message);
      newError.status = status;
      throw newError;
    } else if (error.request) {
      // Network error
      throw new Error('Network error: Unable to connect to server');
    } else {
      // Other error
      throw error;
    }
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query to fetch profile data
  const queryResult = useQuery({
    queryKey: ['userProfile', user?.id], // Use user ID from auth context
    queryFn: fetchUserProfile,
    // Only enable if user is authenticated
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refetch listener (for list follow toggles)
  useEffect(() => {
    const handleListFollowToggle = () => {
      if (user?.id) {
        console.log('[Profile] List follow toggled, invalidating userProfile query');
        queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] });
      }
    };
    window.addEventListener('listFollowToggled', handleListFollowToggle);
    return () => window.removeEventListener('listFollowToggled', handleListFollowToggle);
  }, [queryClient, user?.id]);

  // Handle auth loading state - ProtectedRoute handles authentication
  if (isLoadingAuth || !user?.id) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner message="Loading user data..." /></div>;
  }

  // Render profile using QueryResultDisplay
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} className="mr-1" /> Back
      </Button>

      <QueryResultDisplay
        queryResult={queryResult}
        loadingMessage="Loading profile stats..."
        errorMessagePrefix="Could not load profile data"
        isDataEmpty={(profileData) => !profileData || !profileData.user}
        ErrorChildren={<Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>}
      >
        {(profileData) => {
          const displayUser = profileData.user || {};
          const displayStats = profileData.stats || {};
          return (
            <div className="space-y-8">
              {/* User Profile Section */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                {/* User Info */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 mr-4">
                    {displayUser.username?.charAt(0).toUpperCase() || displayUser.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                      @{displayUser.username || displayUser.email?.split('@')[0] || 'Unknown'}
                      {(displayUser.account_type === 'contributor' || displayUser.role === 'contributor') && (
                        <CheckCircle size={16} className="ml-2 text-green-500" title="Verified Contributor" />
                      )}
                      {(displayUser.account_type === 'superuser' || displayUser.role === 'admin' || displayUser.role === 'superuser') && (
                        <CheckCircle size={16} className="ml-2 text-blue-500" title="Admin" />
                      )}
                    </h1>
                    <p className="text-sm text-gray-600">Email: {displayUser.email || 'N/A'}</p>
                    <p className="text-sm text-gray-600 capitalize">Account Type: {displayUser.account_type || displayUser.role || 'User'}</p>
                    {displayUser.created_at && (
                      <p className="text-sm text-gray-600">Member since: {new Date(displayUser.created_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-[#A78B71]" />
                      <span className="text-sm font-medium text-gray-800">Lists Created</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.listsCreated ?? 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <List size={16} className="text-[#A78B71]" />
                      <span className="text-sm font-medium text-gray-800">Lists Following</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.listsFollowing ?? 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-[#A78B71]" />
                      <span className="text-sm font-medium text-gray-800">Dishes Liked</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.dishesFollowing ?? 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-[#A78B71]" />
                      <span className="text-sm font-medium text-gray-800">Restaurants Liked</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.restaurantsFollowing ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Notification Preferences Section */}
              <NotificationPreferences userId={user.id} />
            </div>
          );
        }}
      </QueryResultDisplay>
    </div>
  );
};

export default Profile;