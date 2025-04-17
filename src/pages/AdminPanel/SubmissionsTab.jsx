/* src/pages/AdminPanel/SubmissionsTab.jsx */
import React, { useMemo } from 'react';
import AdminTable from './AdminTable.jsx'; // Use relative path within AdminPanel folder
import { CheckCircle, XCircle, Clock, Store, Utensils } from 'lucide-react'; // Import icons if needed

const submissionColumns = [
    // No select column needed here, AdminTable adds it if bulk actions are relevant
    { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' },
    { key: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' },
    { key: 'name', header: 'Name', sortable: true, editable: false },
    {
        key: 'location', // Use 'location' field from submission data
        header: 'Address / Location',
        sortable: true, // Sortable by address string
        editable: false,
        className: 'text-xs max-w-xs truncate', // Style for display
        render: (val) => val || <span className="text-gray-400 italic">N/A</span>
    },
    {
        key: 'city',
        header: 'City',
        sortable: true,
        editable: false,
        render: (val) => val || <span className="text-gray-400 italic">N/A</span>
    },
    {
        key: 'neighborhood',
        header: 'Neighborhood',
        sortable: true,
        editable: false,
        render: (val) => val || <span className="text-gray-400 italic">N/A</span>
    },
    {
        key: 'user_handle',
        header: 'Submitted By',
        sortable: true,
        editable: false,
        render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span>
    },
    {
        key: 'restaurant_name', // Or potentially restaurant_id if name isn't always fetched
        header: 'Restaurant (Dishes)',
        sortable: true, // Sort by name likely
        editable: false,
        render: (name, row) => {
            if (row.type === 'dish') {
                const restaurantId = Number(row.restaurant_id);
                if (!isNaN(restaurantId) && restaurantId > 0) {
                    return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{name || `ID: ${restaurantId}`}</a>;
                }
                return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>);
            }
            return <span className="text-gray-400 italic">-</span>;
        }
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        editable: false,
        render: (status) => (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${
                status === 'approved' ? 'bg-green-100 text-green-800' :
                status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
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
        render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-24 text-right' },
];

const SubmissionsTab = ({
    data,
    isLoading,
    sort,
    onSortChange,
    onDataMutated,
    cities,
    citiesLoading,
    citiesError
}) => {

    const columns = useMemo(() => submissionColumns, []);

    // *** ADDED LOGGING ***
    console.log("[SubmissionsTab] Rendering with columns:", columns);
    // *********************

    return (
        <AdminTable
            data={data || []}
            type="submissions"
            columns={columns} // Pass updated columns
            isLoading={isLoading}
            sort={sort}
            onSortChange={onSortChange}
            onDataMutated={onDataMutated}
            cities={cities || []}
            citiesLoading={citiesLoading}
            citiesError={citiesError}
        />
    );
};

export default SubmissionsTab;