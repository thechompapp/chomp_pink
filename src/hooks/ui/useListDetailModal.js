// src/hooks/useListDetailModal.js
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useListDetail } from '@/context/ListDetailContext';
import { logDebug } from '@/utils/logger';

/**
 * Custom hook to handle list detail opening with fallbacks
 * This ensures consistent behavior when switching between direct navigation
 * and modal approaches
 */
export default function useListDetailModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openListDetail } = useListDetail();
  
  const handleListClick = useCallback((listId, event) => {
    // If the event exists, prevent default navigation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!listId) {
      logDebug('[useListDetailModal] No list ID provided');
      return;
    }

    try {
      // Always try to open modal first
      openListDetail(listId);
      logDebug(`[useListDetailModal] Opening modal for list ${listId}`);
    } catch (error) {
      // Fallback to direct navigation if modal context isn't available
      logDebug(`[useListDetailModal] Falling back to navigation for list ${listId}`, error);
      navigate(`/lists/${listId}`, { 
        state: { from: location.pathname } 
      });
    }
  }, [navigate, location, openListDetail]);

  return { handleListClick };
}
