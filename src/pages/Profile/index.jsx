/* src/pages/Profile/index.jsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, List, Heart } from 'lucide-react';
import Button from '@/components/UI/Button';
import useAuthStore from '@/stores/useAuthStore';
import { apiClient } from '@/services/http';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

// Fetcher function
const fetchUserProfile = async (userId) => {
  if (!userId) throw new Error('User ID is required for profile fetch');
  // Assume apiClient returns { success: boolean, data: { user: User, stats: Stats } } or similar
  const response = await apiClient(`/api/users/${userId}/profile`, 'UserProfile Fetch');
  if (!response?.success || !response.data || !response.data.user || !response.data.stats) {
      const status = response?.status ?? 500;
      const message = response?.error || "Invalid profile data received from server.";
      const error = new Error(message);
      error.status = status; // Attach status if available
      throw error;
  }
  // Return the nested data containing user and stats
  return response.data;
};

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoadingAuth = useAuthStore(state => state.isLoading);
  const queryClient = useQueryClient();

  // Ensure userId is valid number before enabling query
  const currentUserId = user?.id ? Number(user.id) : null;

  const queryResult = useQuery({
    queryKey: ['userProfile', currentUserId], // Use validated ID
    queryFn: () => fetchUserProfile(currentUserId),
    // ** FIXED: Enable query only if authenticated AND userId is a valid number **
    enabled: isAuthenticated && typeof currentUserId === 'number' && currentUserId > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Refetch listener (remains the same)
  useEffect(() => {
    const handleListFollowToggle = () => {
        if(currentUserId) { // Only invalidate if we have a user ID
            console.log('[Profile] List follow toggled, invalidating userProfile query');
            queryClient.invalidateQueries({ queryKey: ['userProfile', currentUserId] });
        }
    };
    window.addEventListener('listFollowToggled', handleListFollowToggle);
    return () => window.removeEventListener('listFollowToggled', handleListFollowToggle);
  }, [queryClient, currentUserId]); // Dependency on potentially changing userId

  // Handle auth loading state
  if (isLoadingAuth) {
     return <div className="flex items-center justify-center h-screen"><LoadingSpinner message="Loading user data..." /></div>;
  }

  // Handle not authenticated state
  if (!isAuthenticated || !currentUserId) { // Also check if currentUserId is valid
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
            // Check profileData.user as well
            isDataEmpty={(profileData) => !profileData || !profileData.user}
            ErrorChildren={ <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2"> Back to Home </Button> }
        >
            {(profileData) => { // profileData contains { user, stats }
                const displayUser = profileData.user || {}; // Fallback to empty object
                const displayStats = profileData.stats || {}; // Fallback to empty object
                return (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        {/* User Info */}
                        <div className="flex items-center mb-6">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 mr-4">
                                 {displayUser.username?.charAt(0).toUpperCase() || '?'}
                             </div>
                            <div>
                                 <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                                     @{displayUser.username || 'Unknown'}
                                     {displayUser.account_type === 'contributor' && ( <CheckCircle size={16} className="ml-2 text-green-500" title="Verified Contributor" /> )}
                                     {displayUser.account_type === 'superuser' && ( <CheckCircle size={16} className="ml-2 text-blue-500" title="Admin" /> )}
                                 </h1>
                                 <p className="text-sm text-gray-600"> Email: {displayUser.email || 'N/A'} </p>
                                 <p className="text-sm text-gray-600 capitalize"> Account Type: {displayUser.account_type || 'User'} </p>
                            </div>
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div className="flex items-center gap-2"> <List size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Lists Created</span> </div>
                                <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.listsCreated ?? 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                 <div className="flex items-center gap-2"> <List size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Lists Following</span> </div>
                                 <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.listsFollowing ?? 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                 <div className="flex items-center gap-2"> <Heart size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Dishes Liked</span> </div>
                                 <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.dishesFollowing ?? 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                 <div className="flex items-center gap-2"> <Heart size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Restaurants Liked</span> </div>
                                 <p className="text-lg font-bold text-gray-900 mt-1">{displayStats.restaurantsFollowing ?? 0}</p>
                            </div>
                        </div>
                    </div>
                 );
             }}
        </QueryResultDisplay>
    </div>
  );
};

export default Profile;