// src/pages/AdminPanel/index.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient.js';
import Button from '@/components/Button';
import Modal from '@/components/UI/Modal';
import { ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle, Trash2, AlertTriangle, Edit, BarChart } from 'lucide-react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';

// --- Constants ---
const ALLOWED_ADMIN_TABS = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'analytics'];
const ALLOWED_MUTATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags'];
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags'];
const updatableFields = {
    restaurants: ['name', 'city_name', 'neighborhood_name', 'address', 'google_place_id', 'latitude', 'longitude', 'city_id', 'neighborhood_id'],
    dishes: ['name', 'restaurant_id'],
    lists: ['name', 'description', 'list_type', 'is_public', 'tags'],
    hashtags: ['name', 'category'],
};
const fieldTypes = {
    name: 'text', city_name: 'text', neighborhood_name: 'text', address: 'textarea', google_place_id: 'text',
    latitude: 'number', longitude: 'number', city_id: 'number', neighborhood_id: 'number',
    restaurant_id: 'number', description: 'textarea', list_type: 'select', is_public: 'checkbox',
    tags: 'tags', category: 'text',
};
const listTypeOptions = ['mixed', 'restaurant', 'dish'];
const defaultSort = {
  restaurants: 'name_asc', dishes: 'name_asc', lists: 'name_asc',
  hashtags: 'name_asc', submissions: 'created_at_desc',
};

// --- Fetcher Functions ---
const fetchAdminData = async (type, sort) => {
  if (!type || type === 'analytics') return [];
  console.log(`[AdminPanel Fetcher] Fetching admin data for type: ${type}, sort: ${sort}`);
  const endpoint = `/api/admin/${type}?sort=${sort}`;
  try {
    const data = await apiClient(endpoint, `Admin Fetch ${type}`);
    console.log(`[AdminPanel Fetcher] Received data for ${type}:`, data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
     console.error(`[AdminPanel Fetcher] Error fetching ${type}:`, error);
     throw new Error(error.message || `Failed to load ${type}`);
  }
};
const fetchPendingSubmissions = async () => {
    console.log('[AdminPanel Fetcher] Fetching pending submissions...');
    try {
        const data = await apiClient("/api/admin/submissions?status=pending", 'Admin Fetch Pending Submissions');
        console.log(`[AdminPanel Fetcher] Received submissions data:`, data);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[AdminPanel Fetcher] Error fetching pending submissions:', error);
        throw new Error(error.message || 'Failed to load pending submissions');
    }
};

// --- Component ---
const AdminPanel = React.memo(() => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('submissions');
  const [sort, setSort] = useState(defaultSort[activeTab] || 'name_asc');
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [tagInput, setTagInput] = useState('');

  // React Query setup
  const { data: items = [], isLoading: isLoadingItems, isError: isFetchItemsError, error: fetchItemsError, refetch: refetchItems } = useQuery({
        queryKey: ['adminData', activeTab, sort],
        queryFn: activeTab === 'submissions'
                   ? fetchPendingSubmissions
                   : () => fetchAdminData(activeTab, sort),
        enabled: !!activeTab && activeTab !== 'analytics',
        staleTime: 1 * 60 * 1000,
        refetchOnWindowFocus: true,
        placeholderData: [],
  });

  // Logging for items data
  console.log(`[AdminPanel Render] Active Tab: ${activeTab}, Items Data:`, items);
  useEffect(() => {
      console.log(`[AdminPanel Effect] Active Tab: ${activeTab}, Items Data Updated:`, items);
  }, [items, activeTab]);

  // Action Handlers
  const clearActionState = useCallback(() => {
        setProcessingId(null);
        setActionType(null);
        setActionError(null);
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setShowEditModal(false);
        setItemToEdit(null);
        setEditFormData({});
        setTagInput(''); // Clear tag input on close
   }, []);
  const handleApprove = useCallback(async (id) => { /* ... (same as before) ... */ }, [queryClient, processingId]);
  const handleReject = useCallback(async (id) => { /* ... (same as before) ... */ }, [queryClient, processingId]);
  const handleDeleteClick = useCallback((item) => { /* ... (same as before) ... */ }, [activeTab]);
  const handleConfirmDelete = useCallback(async () => { /* ... (same as before) ... */ }, [itemToDelete, queryClient, sort, processingId]);
  const handleEditClick = useCallback((item) => { /* ... (same as before) ... */ }, [activeTab]);
  const handleSaveChanges = useCallback(async (e) => { /* ... (same as before) ... */ }, [itemToEdit, editFormData, processingId, queryClient, sort, activeTab]);
  const handleEditFormChange = useCallback((e) => { /* ... (same as before) ... */ }, []);
  const handleTagInputChange = (e) => setTagInput(e.target.value);
  const handleAddTag = useCallback(() => { /* ... (same as before) ... */ }, [tagInput, editFormData.tags]);
  const handleRemoveTag = useCallback((tagToRemove) => { /* ... (same as before) ... */ }, []);
  const handleTagInputKeyDown = useCallback((e) => { /* ... (same as before) ... */ }, [handleAddTag]);

  // Other Handlers
  const handleTabChange = useCallback((tab) => { /* ... (same as before) ... */ }, [clearActionState]);
  const handleSort = useCallback(() => { /* ... (same as before) ... */ }, [sort, activeTab, clearActionState]);


  // --- Render Logic ---
  const displayError = actionError || (activeTab !== 'analytics' ? fetchItemsError?.message : null);

  // Render Edit Form Fields (unchanged)
  const renderEditFormFields = useCallback(() => { /* ... (same as before) ... */ }, [itemToEdit, editFormData, activeTab, tagInput, handleEditFormChange, handleTagInputChange, handleTagInputKeyDown, handleAddTag, handleRemoveTag, processingId, actionType]);

  // Memoized list rendering (unchanged)
  const renderItems = useMemo(() => { /* ... (same as before) ... */ }, [items, activeTab, processingId, actionType, handleApprove, handleReject, handleDeleteClick, handleEditClick]);


  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h1>

      {/* Tabs (unchanged) */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
          {ALLOWED_ADMIN_TABS.map(tabName => ( <Button key={tabName} /* ... */ > /* ... */ </Button> ))}
      </div>

      {/* Content Area Header (unchanged) */}
      <div className="flex justify-between items-center mb-4"> /* ... */ </div>

      {/* *** CORRECTED Line 136 *** */}
      {/* Display List-Level Fetch Error (only when modals aren't blocking) */}
      {displayError && !showEditModal && !showDeleteConfirm && (
         <ErrorMessage message={displayError} containerClassName="mb-4" onRetry={fetchItemsError?.message ? refetchItems : undefined} isLoadingRetry={isLoadingItems} />
       )}
       {/* *** End Correction *** */}

       {/* --- Main Content Area (unchanged) --- */}
       {activeTab === 'analytics' ? (
           <AdminAnalyticsSummary />
       ) : isLoadingItems ? (
           <LoadingSpinner size="lg" message={`Loading ${activeTab}...`} />
       ) : isFetchItemsError && !displayError ? (
           // Render error message if fetch failed and no action error is displayed
           <ErrorMessage message={fetchItemsError.message || `Failed to load ${activeTab}`} onRetry={refetchItems} isLoadingRetry={isLoadingItems} />
       ) : !items || items.length === 0 ? (
           <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed">No {activeTab} found{activeTab === 'submissions' ? ' with status "pending"' : ''}.</p>
       ) : (
           <ul className="space-y-3">{renderItems}</ul>
       )}
       {/* End Main Content Area --- */}


      {/* Delete Confirmation Modal (unchanged) */}
      <Modal isOpen={showDeleteConfirm} /* ... */ >{ /* ... */ }</Modal>

      {/* Edit Modal (unchanged) */}
      <Modal isOpen={showEditModal} /* ... */ >{ /* ... */ }</Modal>

    </div>
  );
});

export default AdminPanel;