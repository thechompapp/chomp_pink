// src/pages/AdminPanel/SubmissionsTab.jsx
/* NEW FILE */
import React, { useMemo } from 'react';
import AdminTable from './AdminTable.jsx'; // Use relative path within AdminPanel folder

// Define columns specifically for the Submissions tab
// These keys should match the data properties fetched by getAdminData('submissions')
const submissionColumns = [
    // No select column needed here, AdminTable adds it if bulk actions are relevant
    { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' },
    { key: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' },
    { key: 'name', header: 'Name', sortable: true, editable: false },
    { key: 'user_handle', header: 'Submitted By', sortable: true, editable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> },
    // Include restaurant_name/id for dishes, make it linkable if possible
    {
        key: 'restaurant_name', // Or potentially restaurant_id if name isn't always fetched
        header: 'Restaurant (Dishes)',
        sortable: true, // Sort by name likely
        editable: false,
        render: (name, row) => {
            if (row.type === 'dish') {
                // Link if restaurant_id is available and valid
                const restaurantId = Number(row.restaurant_id);
                if (!isNaN(restaurantId) && restaurantId > 0) {
                    // Link to the public restaurant detail page
                    return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{name || `ID: ${restaurantId}`}</a>;
                }
                // Otherwise, just display the name or ID
                return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>);
            }
            return <span className="text-gray-400 italic">-</span>; // Not applicable for restaurant submissions
        }
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        editable: false,
        render: (status) => ( // Custom render for status badge
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                status === 'approved' ? 'bg-green-100 text-green-800' :
                status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800' // Default to pending style
            }`}>
                {status}
            </span>
        )
     },
    {
        key: 'created_at',
        header: 'Submitted',
        sortable: true,
        editable: false,
        render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' // Basic date formatting
    },
    // Actions cell handles approve/reject
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
];

// The SubmissionsTab component receives props from AdminPanel/index.jsx
const SubmissionsTab = ({
    data,           // The array of submission data fetched by the parent
    isLoading,      // Loading state for the data from the parent
    sort,           // Current sort string (e.g., "created_at_desc") from parent
    onSortChange,   // Function to handle sort changes passed from parent
    onDataMutated,  // Function to trigger refetch after approve/reject passed from parent
    cities,         // Pass down cities if needed by AdminTable/EditableCell (unlikely here)
    citiesLoading,
    citiesError
}) => {

    // Memoize columns to prevent unnecessary re-renders of AdminTable
    const columns = useMemo(() => submissionColumns, []);

    console.log("[SubmissionsTab] Rendering AdminTable for submissions.");

    return (
        <AdminTable
            data={data || []}               // Pass down submission data
            type="submissions"              // Set type explicitly
            columns={columns}               // Pass submission-specific columns
            isLoading={isLoading}           // Pass down loading state
            sort={sort}                     // Pass current sort state
            onSortChange={onSortChange}     // Pass sort handler
            onDataMutated={onDataMutated}   // Pass mutation handler (for approve/reject)
            // Disable adding/editing directly on the submissions table
            // Pass down other props AdminTable might need, even if not directly used by submissions
            cities={cities || []}
            citiesLoading={citiesLoading}
            citiesError={citiesError}
            // Add other props like pagination handlers if AdminTable manages them internally
        />
    );
};

export default SubmissionsTab;