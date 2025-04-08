/* src/pages/Profile/index.jsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, List, Heart } from 'lucide-react';
import Button from '@/components/Button'; // Use global alias
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import apiClient from '@/services/apiClient'; // Use global alias
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Import the new component
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Keep for auth check loading

// Fetcher function (keep as is)
const fetchUserProfile = async (userId) => {
  if (!userId) throw new Error('User ID is required');
  // Assuming API response is now { data: { ...profile stats... } }
  const response = await apiClient(`/api/users/${userId}/profile`, 'UserProfile Fetch');
  if (!response?.data) throw new Error("Invalid profile data received from server.");
  return response.data; // Return the data object directly
};

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoadingAuth = useAuthStore(state => state.isLoading); // Use auth loading state
  const queryClient = useQueryClient();

  // React Query setup
  const queryResult = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user?.id),
    enabled: !!user?.id && isAuthenticated, // Only fetch if user is logged in and ID known
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Refetch listener (Keep as is)
  useEffect(() => {
    const handleListFollowToggle = () => {
      console.log('[Profile] List follow toggled, invalidating userProfile query');
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    };
    window.addEventListener('listFollowToggled', handleListFollowToggle);
    return () => window.removeEventListener('listFollowToggled', handleListFollowToggle);
  }, [queryClient, user?.id]);

  // Handle auth loading state separately
  if (isLoadingAuth) {
     return <LoadingSpinner message="Loading user data..." />;
  }

  // Handle not authenticated state
  if (!isAuthenticated) {
    // Redirect or show login prompt
    // Using navigate hook is generally preferred over direct component return for redirection
    // useEffect(() => { navigate('/login'); }, [navigate]); // Example redirection
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

  // Render profile using QueryResultDisplay for API data
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center">
        <ArrowLeft size={16} className="mr-1" /> Back
      </Button>

        <QueryResultDisplay
            queryResult={queryResult}
            loadingMessage="Loading profile stats..."
            errorMessagePrefix="Could not load profile data"
            // Use default empty data message or customize if needed
            isDataEmpty={(data) => !data} // Check if data object exists
             ErrorChildren={
                <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                    Back to Home
                </Button>
            }
        >
            {(profileData) => (
                // Profile content rendering based on successful data fetch
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    {/* User Info Section */}
                    <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 mr-4">
                             {user?.username?.charAt(0).toUpperCase() || 'U'} {/* Use username from user object */}
                         </div>
                        <div>
                             <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                                 @{user?.username || 'Unknown'} {/* Use username */}
                                 {user?.account_type === 'contributor' && (
                                     <CheckCircle size={16} className="ml-2 text-green-500" title="Verified Contributor" />
                                 )}
                             </h1>
                             <p className="text-sm text-gray-600">
                                Email: {user?.email || 'N/A'} {/* Display email */}
                             </p>
                             <p className="text-sm text-gray-600 capitalize">
                                Account Type: {user?.account_type || 'User'} {/* Use correct account type */}
                             </p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex items-center gap-2"> <List size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Lists Created</span> </div>
                            <p className="text-lg font-bold text-gray-900 mt-1">{profileData.listsCreated ?? 0}</p> {/* Use nullish coalescing */}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                             <div className="flex items-center gap-2"> <List size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Lists Following</span> </div>
                             <p className="text-lg font-bold text-gray-900 mt-1">{profileData.listsFollowing ?? 0}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                             <div className="flex items-center gap-2"> <Heart size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Dishes Liked</span> </div> {/* Changed label */}
                             <p className="text-lg font-bold text-gray-900 mt-1">{profileData.dishesFollowing ?? 0}</p> {/* Kept key, changed label */}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                             <div className="flex items-center gap-2"> <Heart size={16} className="text-[#A78B71]" /> <span className="text-sm font-medium text-gray-800">Restaurants Liked</span> </div> {/* Changed label */}
                             <p className="text-lg font-bold text-gray-900 mt-1">{profileData.restaurantsFollowing ?? 0}</p> {/* Kept key, changed label */}
                        </div>
                    </div>
                </div>
            )}
        </QueryResultDisplay>
    </div>
  );
};

export default Profile;