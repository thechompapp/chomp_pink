// src/components/FollowButton.jsx
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { Heart, HeartOff, Loader2 } from 'lucide-react'; // Added Loader2
import Button from '@/components/Button';
// Use store directly, avoid apiClient here to keep logic centralized in store
// import apiClient from '@/utils/apiClient';
import useUserListStore from '@/stores/useUserListStore';
import useAuthStore from '@/stores/useAuthStore';

const FollowButton = ({ listId, isFollowing: initialIsFollowing = false, className = '' }) => {
  // Local state for immediate UI feedback
  // Initialize with prop but update from store if possible
  const storeFollowState = useUserListStore(state => {
       // Find the list in the store to get the most up-to-date follow status
       const list = state.allLists.find(l => l.id === listId);
       return list?.is_following; // Returns true, false, or undefined
   });

  // Use store state if available, otherwise fall back to initial prop
  const currentFollowState = typeof storeFollowState === 'boolean' ? storeFollowState : initialIsFollowing;
  // Local state for loading feedback during the API call
  const [isLoading, setIsLoading] = useState(false);
  // Local state for errors specific to this button action
  const [error, setError] = useState(null);

  // Get necessary store actions and auth state
  const { isAuthenticated } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated }));
  // Assume a store action exists to handle the API call and state update
  const toggleFollow = useUserListStore(state => state.updateFollowStatus); // Assuming this action handles API + state
   const storeError = useUserListStore(state => state.error); // Get error from store if needed
   const clearStoreError = useUserListStore(state => state.clearError); // Action to clear store error


   // Clear local error if store error changes (e.g., cleared elsewhere)
   useEffect(() => {
       if (error && !storeError) {
           setError(null);
       }
   }, [storeError, error]);


  // Handler for the follow/unfollow action
  const handleToggleFollow = useCallback(async () => {
    setError(null); // Clear local error on new attempt
    clearStoreError?.(); // Clear store error as well

    if (!isAuthenticated) {
      // TODO: Implement login prompt (e.g., open a modal via context or store)
      console.log("FollowButton: User not authenticated. Prompt login.");
      setError("Please log in to follow lists."); // Set local error
      return;
    }
    if (!listId) {
        console.error("FollowButton: listId is missing.");
        setError("Cannot follow list: ID missing.");
        return;
    }

    setIsLoading(true);

    try {
        // Call the store action which handles the API and updates state
        // We pass the *expected* new state to the action, the action confirms via API response
        // Or better: the action determines the current state and toggles it via API
        // Let's assume `toggleFollow` POSTs to the endpoint and the backend handles toggle logic.
        // The store action should then receive the *actual* new follow status from the API response.
        await apiClient(`/api/lists/${listId}/follow`, `Toggle Follow List ${listId}`, { method: 'POST' })
            .then(apiResponse => {
                 // Manually trigger store update with the definitive state from API response
                 toggleFollow(listId, apiResponse); // Pass the whole response object
            });

        // UI state (currentFollowState) will update automatically when the Zustand store state changes
        // No need for setLocalFollowState here if store updates correctly

    } catch (err) {
      console.error(`FollowButton: Error toggling follow for list ${listId}:`, err);
      // Error state might be set in the store action, or set locally here
       setError(err.message || 'Failed to update follow status');
      // No need to revert local state if we rely solely on store state for rendering
    } finally {
      setIsLoading(false);
    }
  }, [listId, isAuthenticated, toggleFollow, clearStoreError]); // Dependencies for the handler

  // Determine button text and icon based on the current follow state derived from store/props
  const buttonText = currentFollowState ? 'Unfollow' : 'Follow';
  const IconComponent = currentFollowState ? HeartOff : Heart;

  return (
    <>
      <Button
        // Determine variant based on follow state
        variant={currentFollowState ? "tertiary" : "primary"}
        size="sm"
        onClick={handleToggleFollow}
        disabled={isLoading || !listId} // Disable if loading or no listId
        className={`flex items-center justify-center gap-1 transition-opacity ${isLoading ? 'opacity-70' : ''} ${className}`}
        aria-label={currentFollowState ? `Unfollow list` : `Follow list`}
        aria-live="polite" // Announce changes for screen readers
      >
        {isLoading ? (
           <Loader2 size={16} className="animate-spin" />
        ) : (
           <IconComponent size={14} /> // Render dynamic icon
        )}
        <span>{isLoading ? '...' : buttonText}</span>
      </Button>
      {/* Display local error below button */}
      {error && (
        <p role="alert" className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </>
  );
};

export default FollowButton;