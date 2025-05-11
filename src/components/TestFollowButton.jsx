/* src/components/TestFollowButton.jsx */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Star } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';

/**
 * A testing component for follow button functionality
 * Completely bypasses React Query and other complex systems
 * Uses direct DOM manipulation and localStorage for maximum reliability
 */
const TestFollowButton = ({ 
  listId, 
  initialFollowState = false,
  size = 'md',
  showIcon = true,
  className = '',
  onToggle
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Generate a unique ID for this button instance
  const buttonId = `test-follow-btn-${listId}`;
  
  const addLog = (message) => {
    setLogs(prev => [message, ...prev].slice(0, 10));
  };
  
  // Helper to check localStorage follow state
  const getLocalStorageFollowState = () => {
    try {
      const key = `follow_state_${listId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data).isFollowing : false;
    } catch (e) {
      addLog(`Error checking follow state: ${e.message}`);
      return false;
    }
  };
  
  // Helper to update localStorage follow state
  const updateLocalStorageFollowState = (newState) => {
    try {
      const key = `follow_state_${listId}`;
      localStorage.setItem(key, JSON.stringify({
        isFollowing: newState,
        updatedAt: new Date().toISOString()
      }));
      
      // Trigger storage event for components listening
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify({ isFollowing: newState })
      }));
    } catch (e) {
      addLog(`Error updating follow state: ${e.message}`);
    }
  };
  
  // Initialize follow state from either props or localStorage
  useEffect(() => {
    if (initialFollowState !== undefined) {
      setIsFollowing(initialFollowState);
    } else {
      setIsFollowing(getLocalStorageFollowState());
    }
  }, [initialFollowState]);
  
  // Size style variations
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm font-medium'
  };
  
  const handleToggleFollow = async (e) => {
    // Stop event propagation
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Only proceed if authenticated
    if (!isAuthenticated) {
      addLog('User not authenticated, redirecting to login');
      return;
    }
    
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      addLog(`Toggle follow for list ${listId}, current status: ${isFollowing}`);
      
      // Update UI optimistically
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      
      // Update localStorage
      updateLocalStorageFollowState(newFollowState);
      
      // Make API call
      const response = await listService.toggleFollowList(listId);
      addLog(`API response: ${JSON.stringify(response).substring(0, 100)}`);
      
      // Notify parent component
      if (onToggle) {
        onToggle(newFollowState);
      }
      
      // Broadcast event for other components
      window.dispatchEvent(new CustomEvent('listFollowChanged', { 
        detail: { listId, following: newFollowState } 
      }));
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
      setIsFollowing(isFollowing); // Revert on error
    } finally {
      setIsProcessing(false);
    }
  };

  // Dynamic classes based on follow state
  const stateClasses = isFollowing 
    ? 'bg-black text-white' 
    : 'bg-white text-black border-black';
  
  return (
    <div className="fixed top-20 right-0 w-64 p-4 bg-white border-l border-b border-black shadow-lg z-[9999]">
      <h3 className="font-bold text-sm mb-2">Test Follow Button</h3>
      
      <div className="mb-4">
        <button
          id={buttonId}
          onClick={handleToggleFollow}
          className={`
            relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium
            rounded-md border ${stateClasses} ${className}
          `}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              {showIcon && (
                <Star 
                  size={14} 
                  className={`mr-2 ${isFollowing ? 'fill-white' : ''}`} 
                />
              )}
              {isFollowing ? 'Following' : 'Follow'}
            </>
          )}
        </button>
      </div>
      
      <div>
        <h4 className="text-xs font-bold mb-1">Debug Logs:</h4>
        <div className="text-xs border border-gray-200 p-2 h-24 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1 pb-1 border-b border-gray-100">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

TestFollowButton.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialFollowState: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  className: PropTypes.string,
  onToggle: PropTypes.func
};

export default TestFollowButton;
