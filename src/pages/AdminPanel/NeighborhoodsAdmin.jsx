// src/pages/AdminPanel/NeighborhoodsAdmin.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// --- Corrected Imports using Alias and Extensions ---
import { adminService } from '@/services/adminService.ts';
import AdminTable from '@/pages/AdminPanel/AdminTable.jsx'; // Correct path points to pages/AdminPanel
import Button from '@/components/UI/Button.jsx';
import Modal from '@/components/UI/Modal.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog.jsx';
// --- End Corrected Imports ---

const NeighborhoodsAdmin = () => {
    const queryClient = useQueryClient();

    // --- State for Modals and Forms ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingNeighborhood, setEditingNeighborhood] = useState(null);
    const [deletingNeighborhoodId, setDeletingNeighborhoodId] = useState(null);
    const [formError, setFormError] = useState('');
    const [deleteError, setDeleteError] = useState(''); // Specific error for delete confirmation

    // --- State for Table Interaction ---
    const [currentPage, setCurrentPage] = useState(1);
    const [currentLimit, setCurrentLimit] = useState(20); // Consistent default
    const [currentSortBy, setCurrentSortBy] = useState('neighborhoods.name'); // Default sort
    const [currentSortOrder, setCurrentSortOrder] = useState('ASC'); // Default sort order
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentCityFilter, setCurrentCityFilter] = useState('');


    // --- React Query: Fetching Neighborhoods ---
    const queryKey = useMemo(() => ['adminNeighborhoods', currentPage, currentLimit, currentSortBy, currentSortOrder, currentSearch, currentCityFilter], [currentPage, currentLimit, currentSortBy, currentSortOrder, currentSearch, currentCityFilter]);

    const { data: neighborhoodsData, isLoading, isError, error: queryError, isFetching } = useQuery({
        queryKey: queryKey,
        queryFn: () => adminService.getAdminNeighborhoods({
            page: currentPage,
            limit: currentLimit,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
            search: currentSearch || undefined, // Pass undefined if empty
            cityId: currentCityFilter ? parseInt(currentCityFilter, 10) : undefined, // Ensure number or undefined
        }),
        keepPreviousData: true,
        placeholderData: { data: [], pagination: { total: 0, page: 1, limit: currentLimit, totalPages: 0 } } // Provide initial structure
    });

    // --- React Query: Fetching Cities for Dropdown ---
    const { data: cities, isLoading: isLoadingCities, error: citiesError } = useQuery({
        queryKey: ['adminCitiesSimple'],
        queryFn: adminService.getAdminCitiesSimple,
        staleTime: 5 * 60 * 1000, // Cache cities for 5 minutes
        placeholderData: [], // Start with empty array
    });

    // --- React Query: Mutations ---
    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminNeighborhoods'] }); // Invalidate the main list
            closeFormModal(); // Close modal on success
        },
        onError: (err, variables, context) => {
            console.error("Mutation failed:", err);
            const message = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
            const constraintError = err?.response?.data?.errors?.find(e => e.msg?.includes('already exists'));
            setFormError(constraintError?.msg || message); // Display error in the form modal
        },
    };

    const createMutation = useMutation({
        mutationFn: adminService.createAdminNeighborhood,
        ...mutationOptions,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => adminService.updateAdminNeighborhood(id, data),
        ...mutationOptions,
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteAdminNeighborhood,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminNeighborhoods'] });
            closeConfirmModal();
            // Optional: reset to page 1 if the last item on a page was deleted
            if (neighborhoodsData?.data?.length === 1 && currentPage > 1) {
                setCurrentPage(prev => Math.max(1, prev - 1)); // Go back one page if last item deleted
            }
        },
        onError: (err) => {
            console.error("Delete failed:", err);
            const message = err?.response?.data?.message || err?.message || 'Failed to delete neighborhood. It might be linked to other data.';
            // Set error specific to the delete confirmation modal
            setDeleteError(message);
            // Keep the confirmation modal open to show the error
            // closeConfirmModal(); // Don't close immediately on error
        },
    });

    // --- Modal Control Handlers ---
    const openAddModal = useCallback(() => {
        setEditingNeighborhood(null);
        setFormError(''); // Clear previous errors
        setIsFormModalOpen(true);
    }, []);

    const openEditModal = useCallback((neighborhood) => {
        if (neighborhood && typeof neighborhood === 'object' && neighborhood.id) {
            setEditingNeighborhood({ // Ensure all expected fields are present, even if null
                ...neighborhood,
                name: neighborhood.name || '',
                city_id: neighborhood.city_id || '', // Use empty string if null/undefined for form control
            });
            setFormError(''); // Clear previous errors
            setIsFormModalOpen(true);
        } else {
            console.error("Attempted to edit invalid neighborhood data:", neighborhood);
            setFormError("Failed to load neighborhood data for editing."); // Show user-friendly error
        }
    }, []);

    const openConfirmModal = useCallback((id) => {
        if (typeof id === 'number' && id > 0) {
            setDeletingNeighborhoodId(id);
            setDeleteError(''); // Clear previous delete errors
            setIsConfirmModalOpen(true);
        } else {
            console.error("Attempted to delete with invalid ID:", id);
        }
    }, []);

    const closeFormModal = useCallback(() => {
        setIsFormModalOpen(false);
        // Delay clearing state slightly for animation
        setTimeout(() => {
            setEditingNeighborhood(null);
            setFormError('');
        }, 300);
    }, []);

    const closeConfirmModal = useCallback(() => {
        setIsConfirmModalOpen(false);
        setTimeout(() => {
            setDeletingNeighborhoodId(null);
            setDeleteError(''); // Clear error when modal closes naturally
        }, 300);
    }, []);

    // --- Form Submission Handler ---
    const handleFormSubmit = useCallback(async (event) => {
        event.preventDefault();
        setFormError(''); // Clear previous form error
        const formData = new FormData(event.target);
        const nameValue = formData.get('name')?.toString().trim();
        const cityIdValue = formData.get('city_id')?.toString();
        const cityIdNum = cityIdValue ? parseInt(cityIdValue, 10) : null;

        if (!nameValue || !cityIdNum || isNaN(cityIdNum) || cityIdNum <= 0) {
            setFormError('Valid Neighborhood Name and City selection are required.');
            return;
        }

        const data = { name: nameValue, city_id: cityIdNum };

        try {
            if (editingNeighborhood?.id) {
                // Only mutate if data has changed (basic check)
                if (data.name !== editingNeighborhood.name || data.city_id !== editingNeighborhood.city_id) {
                    await updateMutation.mutateAsync({ id: editingNeighborhood.id, data });
                } else {
                    closeFormModal(); // No changes, just close
                }
            } else {
                await createMutation.mutateAsync(data);
            }
            // onSuccess callback in mutationOptions handles closing modal and invalidation
        } catch (error) {
            // Error handling is done in mutationOptions' onError
            console.log("Submit error caught in component handler (likely handled by mutation onError)", error);
        }
    }, [editingNeighborhood, createMutation, updateMutation, closeFormModal]); // Added closeFormModal

    // --- Delete Confirmation Handler ---
    const handleDeleteConfirm = useCallback(async () => {
        if (deletingNeighborhoodId) {
            setDeleteError(''); // Clear previous errors before trying again
            try {
                await deleteMutation.mutateAsync(deletingNeighborhoodId);
                // onSuccess callback handles closing and invalidation
            } catch (error) {
                // Error state is set in mutation onError
                console.log("Delete confirm error caught (handled by mutation onError)", error);
            }
        }
    }, [deletingNeighborhoodId, deleteMutation]);

    // --- Table Column Configuration ---
    const columns = useMemo(() => [
        { Header: 'ID', accessor: 'id', sortable: true, sortKey: 'neighborhoods.id' },
        { Header: 'Neighborhood Name', accessor: 'name', sortable: true, sortKey: 'neighborhoods.name' },
        { Header: 'City', accessor: 'city_name', sortable: true, sortKey: 'cities.name' },
        { Header: 'Created At', accessor: 'created_at', sortable: true, sortKey: 'neighborhoods.created_at', Cell: ({ value }) => value ? new Date(value).toLocaleDateString() : '-' },
        {
            Header: 'Actions',
            id: 'actions',
            Cell: ({ row }) => ( // Destructure row directly from props passed by AdminTable's render
                <div className="flex space-x-2">
                    <Button size="sm" variant="tertiary" onClick={() => openEditModal(row.original)}>Edit</Button> {/* Assuming row.original holds the data */}
                    <Button size="sm" variant="tertiary" className="!border-red-500 !text-red-600 hover:!bg-red-50" onClick={() => openConfirmModal(row.original.id)}>Delete</Button> {/* Assuming row.original holds the data */}
                </div>
            ),
        },
    ], [openEditModal, openConfirmModal]); // Keep stable dependencies

    // --- Table State Change Handlers (using useCallback for stability) ---
    const handlePageChange = useCallback((newPage) => setCurrentPage(newPage), []);
    const handleLimitChange = useCallback((newLimit) => { setCurrentLimit(newLimit); setCurrentPage(1); }, []);
    const handleSortChange = useCallback((newSortBy, newSortOrder) => { setCurrentSortBy(newSortBy); setCurrentSortOrder(newSortOrder); setCurrentPage(1); }, []);
    const handleSearchChange = useCallback((event) => { setCurrentSearch(event.target.value); setCurrentPage(1); }, []);
    const handleCityFilterChange = useCallback((event) => { setCurrentCityFilter(event.target.value); setCurrentPage(1); }, []);


    // --- Render Logic ---
    // Main loading state
    if (isLoading && !neighborhoodsData) return <LoadingSpinner message="Loading neighborhoods..." />;

    // Main query error state
    if (isError && !isLoading) return <ErrorMessage message={queryError?.message || 'Failed to load neighborhoods.'} />;


    return (
        <div className="space-y-6">
            {/* Removed duplicate H2 title */}
            {/* <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Manage Neighborhoods</h2> */}

            {/* Table Filters/Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                 {/* Add Button */}
                <Button variant="primary" onClick={openAddModal} className="w-full sm:w-auto flex-shrink-0">Add Neighborhood</Button>

                {/* Search Input */}
                <div className="flex-grow w-full sm:w-auto">
                     <label htmlFor="neighborhoodSearch" className="sr-only">Search Neighborhoods</label>
                     <Input
                        id="neighborhoodSearch"
                        type="search"
                        placeholder="Search Name or City..."
                        value={currentSearch}
                        onChange={handleSearchChange}
                        className="w-full" // Ensure input takes available width
                     />
                 </div>

                 {/* City Filter Dropdown */}
                <div className="min-w-[150px] flex-grow sm:flex-grow-0 w-full sm:w-auto">
                     <label htmlFor="cityFilter" className="sr-only">Filter by City</label>
                     <Select
                         id="cityFilter"
                         value={currentCityFilter}
                         onChange={handleCityFilterChange}
                         disabled={isLoadingCities} // Disable while cities are loading
                         className="w-full" // Ensure select takes available width
                     >
                         <option value="">All Cities</option>
                         {/* Handle loading/error state for cities */}
                         {isLoadingCities && <option disabled>Loading cities...</option>}
                         {citiesError && <option disabled>Error loading cities</option>}
                         {!isLoadingCities && !citiesError && cities?.map(city => (
                             <option key={city.id} value={city.id}>{city.name}</option>
                         ))}
                     </Select>
                 </div>
            </div>

            {/* Reusable AdminTable */}
            {/* Pass isFetching for subtle loading indication */}
            {/* Ensure AdminTable component exists and accepts these props */}
            <AdminTable
                columns={columns}
                data={neighborhoodsData?.data ?? []}
                pagination={neighborhoodsData?.pagination}
                isLoading={isFetching} // Use isFetching for background loading indicator
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onSortChange={handleSortChange}
                currentSortBy={currentSortBy}
                currentSortOrder={currentSortOrder}
                type="neighborhoods" // Explicitly pass the type
                onDataMutated={handleDataMutation} // Pass callback for refetching (if AdminTable handles mutations)
            />

            {/* Add/Edit Modal */}
            <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editingNeighborhood ? `Edit: ${editingNeighborhood.name}` : 'Add New Neighborhood'}>
                 {/* Pass isLoading prop to disable form during submission */}
                 {/* Use ErrorMessage component for form errors */}
                <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
                    {formError && <ErrorMessage message={formError} className="mb-4 text-center" onRetry={() => setFormError('')} />}
                    <Input
                        label="Neighborhood Name"
                        name="name"
                        id="neighborhoodName" // Ensure unique ID
                        defaultValue={editingNeighborhood?.name || ''}
                        required
                        maxLength={100}
                        disabled={createMutation.isPending || updateMutation.isPending} // Disable during mutation
                        aria-describedby={formError ? 'form-error-desc' : undefined}
                    />
                    <Select
                        label="City"
                        name="city_id"
                        id="neighborhoodCity" // Ensure unique ID
                        defaultValue={editingNeighborhood?.city_id || ''} // Use defaultValue for Select
                        required
                        disabled={isLoadingCities || createMutation.isPending || updateMutation.isPending} // Also disable during mutation
                        aria-describedby={formError ? 'form-error-desc' : undefined}
                    >
                        <option value="" disabled>Select a city...</option>
                        {isLoadingCities && <option disabled>Loading...</option>}
                        {!isLoadingCities && Array.isArray(cities) && cities.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                    </Select>

                    {/* Provide accessibility description for errors */}
                    {formError && <p id="form-error-desc" className="sr-only">{formError}</p>}

                    <div className="flex justify-end space-x-3 mt-6">
                        <Button type="button" variant="tertiary" onClick={closeFormModal} disabled={createMutation.isPending || updateMutation.isPending}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="primary"
                            // Disable while any mutation is pending
                            isLoading={createMutation.isPending || updateMutation.isPending} // Use isLoading prop on Button
                            disabled={createMutation.isPending || updateMutation.isPending || isLoadingCities}
                        >
                            {editingNeighborhood ? 'Save Changes' : 'Add Neighborhood'}
                        </Button>
                    </div>
                </form>
            </Modal>

             {/* Confirmation Dialog for Delete */}
             {/* Use ConfirmationDialog component */}
            <ConfirmationDialog
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmModal}
                onConfirm={handleDeleteConfirm}
                title="Confirm Deletion"
                isLoading={deleteMutation.isPending} // Pass loading state
            >
                {/* Display specific delete error inside the dialog */}
                {deleteError && <ErrorMessage message={deleteError} className="mb-3 text-center" onRetry={() => setDeleteError('')} />}
                Are you sure you want to delete this neighborhood? This action cannot be undone.
                {/* Optional: Show name */}
                {deletingNeighborhoodId && neighborhoodsData?.data?.find(n => n.id === deletingNeighborhoodId)?.name && (
                     <span className="font-semibold block mt-1"> "{neighborhoodsData.data.find(n => n.id === deletingNeighborhoodId)?.name}"</span>
                 )}
            </ConfirmationDialog>

        </div>
    );
};

export default NeighborhoodsAdmin;