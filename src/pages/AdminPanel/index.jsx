// src/pages/AdminPanel/index.jsx
import React, { useState, useCallback, useMemo } from 'react'; // Added useMemo
import { useQuery, useQueryClient } from '@tanstack/react-query';
// Import services
import { submissionService } from '@/services/submissionService';
import apiClient from '@/services/apiClient.js'; // Keep for fetching general types for now
import Button from '@/components/Button';
import { ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from 'lucide-react'; // Added action icons
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Fetcher for non-submission types (restaurants, dishes, etc.)
// Keeps using apiClient directly for flexibility, but could be refactored to services
const fetchAdminData = async (type, sort) => {
  console.log(`[AdminPanel] Fetching data for type: ${type}, sort: ${sort}`);
  const endpoint = `/api/admin/${type}?sort=${sort}`; // Assuming backend route exists
  try {
    const data = await apiClient(endpoint, `Admin Fetch ${type}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
     console.error(`[AdminPanel] Error fetching ${type}:`, error);
     // Re-throw for useQuery
     throw new Error(error.message || `Failed to load ${type}`);
  }
};

// Separate fetcher for submissions using the service
const fetchPendingSubmissions = async () => {
    console.log('[AdminPanel] Fetching pending submissions via service...');
    // Use the specific service function
    const data = await submissionService.getPendingSubmissions();
    // Service already ensures array format and handles basic errors
    console.log(`[AdminPanel] Received ${data.length} pending submissions.`);
    return data;
};


const AdminPanel = React.memo(() => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('submissions'); // Default to submissions
  // Sort state might need to adapt based on activeTab's available columns
  const [sort, setSort] = useState('created_at_desc'); // Default sort for submissions
  const [processingId, setProcessingId] = useState(null); // For loading state on actions
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [actionError, setActionError] = useState(null); // Local error for actions

  // React Query setup - conditionally use different fetchers
  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    // Query key depends on the active tab
    queryKey: ['adminData', activeTab, sort],
    // Query function depends on the active tab
    queryFn: activeTab === 'submissions'
               ? () => fetchPendingSubmissions() // Use submission service fetcher
               : () => fetchAdminData(activeTab, sort), // Use general fetcher for others
    enabled: !!activeTab, // Only run if a tab is selected
    staleTime: 1 * 60 * 1000, // 1 minute stale time
    refetchOnWindowFocus: true,
  });

  // Submission Actions (using submissionService via store or directly)
  const handleApprove = useCallback(async (id) => {
     if (processingId) return;
     setProcessingId(id);
     setActionType('approve');
     setActionError(null);
    try {
      await submissionService.approveSubmission(id);
      console.log(`[AdminPanel] Submission ${id} approved via service.`);
      // Invalidate the submissions query cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
      // Optionally invalidate other caches (like trending) if approval affects them
       queryClient.invalidateQueries({ queryKey: ['trendingData'] });
    } catch (err) {
      console.error(`[AdminPanel] Error approving submission ${id}:`, err);
       setActionError(err.message || 'Failed to approve.');
    } finally {
        setProcessingId(null);
        setActionType(null);
    }
  }, [queryClient, processingId]); // Include processingId

  const handleReject = useCallback(async (id) => {
      if (processingId) return;
      setProcessingId(id);
      setActionType('reject');
      setActionError(null);
    try {
      await submissionService.rejectSubmission(id);
       console.log(`[AdminPanel] Submission ${id} rejected via service.`);
      queryClient.invalidateQueries({ queryKey: ['adminData', 'submissions'] });
    } catch (err) {
      console.error(`[AdminPanel] Error rejecting submission ${id}:`, err);
       setActionError(err.message || 'Failed to reject.');
    } finally {
        setProcessingId(null);
        setActionType(null);
    }
  }, [queryClient, processingId]); // Include processingId

  // Tab Change Handler
  const handleTabChange = useCallback((tab) => {
      setActiveTab(tab);
      // Reset sort when changing tabs to a reasonable default for that type
      if (tab === 'submissions') setSort('created_at_desc');
      else if (tab === 'restaurants') setSort('name_asc');
      else if (tab === 'dishes') setSort('name_asc');
      // Add other defaults as needed
      else setSort('name_asc'); // Generic default
       setActionError(null); // Clear errors on tab change
  }, []);

  // Sort Handler
  const handleSort = useCallback(() => {
      // Example: Toggle direction for the current sort column
      const currentDirection = sort.endsWith('_desc') ? 'desc' : 'asc';
      const column = sort.replace(/_(asc|desc)$/, '');
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      setSort(`${column}_${newDirection}`);
      setActionError(null); // Clear errors on sort change
  }, [sort]);

  // --- Render Logic ---
  const displayError = actionError || error?.message;

   const renderSubmissionsTable = useMemo(() => {
       if (!Array.isArray(items)) return null; // Should not happen with defaults
       return items.map((item) => {
           const isProcessingThis = processingId === item.id;
           const isApproving = isProcessingThis && actionType === 'approve';
           const isRejecting = isProcessingThis && actionType === 'reject';
           return (
               <li key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-white border border-gray-200 rounded-md gap-3">
                   <div className="flex-grow min-w-0"> {/* Allow content to shrink/wrap */}
                       <h3 className="text-base font-medium text-gray-900 break-words">{item.name}</h3>
                       <p className="text-sm text-gray-500 capitalize">Type: {item.type}</p>
                       <p className="text-sm text-gray-500 truncate">
                           Location: {item.location || `${item.neighborhood || ''}${item.neighborhood && item.city ? ', ' : ''}${item.city || ''}` || 'N/A'}
                       </p>
                       {Array.isArray(item.tags) && item.tags.length > 0 && (
                           <p className="text-xs text-gray-500 mt-1 truncate">
                               Tags: {item.tags.join(', ')}
                           </p>
                       )}
                        {item.place_id && <p className="text-xs text-gray-400 mt-1">Place ID: {item.place_id}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                           Submitted: {new Date(item.created_at).toLocaleString()}
                       </p>
                   </div>
                   <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                       <Button
                            variant="primary" size="sm"
                            onClick={() => handleApprove(item.id)}
                            disabled={isProcessingThis}
                            className="flex items-center justify-center w-[100px]" // Fixed width
                        >
                           {isApproving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle size={16} className="mr-1" />}
                           {isApproving ? '...' : 'Approve'}
                       </Button>
                       <Button
                            variant="tertiary" size="sm"
                            onClick={() => handleReject(item.id)}
                            disabled={isProcessingThis}
                            className="text-red-600 hover:bg-red-50 flex items-center justify-center w-[90px]" // Fixed width
                        >
                           {isRejecting ? <Loader2 className="animate-spin h-4 w-4" /> : <XCircle size={16} className="mr-1" />}
                           {isRejecting ? '...' : 'Reject'}
                       </Button>
                   </div>
               </li>
           );
       });
   }, [items, processingId, actionType, handleApprove, handleReject]); // Memoize submission list rendering


   const renderGenericTable = useMemo(() => {
        if (!Array.isArray(items)) return null;
        // Basic renderer for other types - customize as needed
        return items.map((item) => (
             <li key={item.id} className="p-4 bg-white border border-gray-200 rounded-md">
                 <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                 {/* Add more details based on type */}
                 {item.city_name && <p className="text-sm text-gray-500">{item.city_name}{item.neighborhood_name ? `, ${item.neighborhood_name}` : ''}</p>}
                 {item.category && <p className="text-sm text-gray-500">Category: {item.category}</p>}
                 {/* Add Edit/Delete buttons if implementing PUT/DELETE */}
             </li>
         ));
    }, [items]); // Memoize generic list rendering


  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h1>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        <Button onClick={() => handleTabChange('submissions')} variant={activeTab === 'submissions' ? 'primary' : 'tertiary'} size="sm">Submissions</Button>
        <Button onClick={() => handleTabChange('restaurants')} variant={activeTab === 'restaurants' ? 'primary' : 'tertiary'} size="sm">Restaurants</Button>
        <Button onClick={() => handleTabChange('dishes')} variant={activeTab === 'dishes' ? 'primary' : 'tertiary'} size="sm">Dishes</Button>
        <Button onClick={() => handleTabChange('lists')} variant={activeTab === 'lists' ? 'primary' : 'tertiary'} size="sm">Lists</Button>
        <Button onClick={() => handleTabChange('hashtags')} variant={activeTab === 'hashtags' ? 'primary' : 'tertiary'} size="sm">Hashtags</Button>
      </div>

      {/* Content Area Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeTab}</h2>
         {/* Show sort only if not loading and items exist */}
         {!isLoading && items.length > 0 && (
             <Button variant="tertiary" size="sm" onClick={handleSort} className="flex items-center gap-1 text-xs">
                 Sort {sort.endsWith('_desc') ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
             </Button>
          )}
      </div>

      {/* Display Action Error */}
      {displayError && (
         <ErrorMessage message={displayError} containerClassName="mb-4" />
       )}

      {/* Content Area */}
      {isLoading ? (
        <LoadingSpinner size="lg" message={`Loading ${activeTab}...`} />
      ) : isError && !displayError ? ( // Show fetch error only if no action error
        <ErrorMessage message={error?.message || `Failed to load ${activeTab}`} onRetry={refetch} isLoadingRetry={isLoading} />
      ) : !items || items.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No {activeTab} available.</p>
      ) : (
        <ul className="space-y-4">
           {/* Render specific table for submissions, generic for others */}
           {activeTab === 'submissions' ? renderSubmissionsTable : renderGenericTable}
        </ul>
      )}
    </div>
  );
});

export default AdminPanel;