// src/pages/AdminPanel/index.jsx
// UPDATE: Refactored to use React Query for fetching data based on tab/sort
import React, { useState } from "react"; // Removed useEffect
import { useQuery, useQueryClient } from '@tanstack/react-query'; // *** IMPORT React Query hooks ***
import { API_BASE_URL } from "@/config";
import Button from "@/components/Button";
import { ChevronDown, ChevronUp, Edit, Trash, Loader2, AlertTriangle } from "lucide-react"; // Added Loader2, AlertTriangle

// Default sort order for each type (matches backend)
const defaultSort = {
    restaurants: 'name_asc', dishes: 'name_asc', lists: 'name_asc',
    // Add defaults for other types if they become available
};

// *** Define Fetcher Function ***
const fetchAdminData = async (type, sort) => {
    // Basic validation
    if (!type) throw new Error("Data type is required for fetching admin data.");
    const validSort = sort || defaultSort[type] || 'name_asc'; // Use provided sort or default
    console.log(`[fetchAdminData] Fetching type: ${type}, sort: ${validSort}`);
    const url = `${API_BASE_URL}/api/admin/${type}?sort=${validSort}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch ${type} (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchAdminData] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
             console.error(`[fetchAdminData] Invalid data format received for ${type}:`, data);
             throw new Error(`Invalid data format for ${type}.`);
        }
        console.log(`[fetchAdminData] Successfully fetched ${data.length} items for ${type}.`);
        // Format data if needed (e.g., ensure tags are arrays)
        return data.map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
        }));
    } catch (err) {
        console.error(`[fetchAdminData] Error fetching ${type}:`, err);
        throw new Error(err.message || `Could not load ${type} data.`); // Rethrow error
    }
};


const AdminPanel = () => {
  const queryClient = useQueryClient(); // Get query client instance

  // Local state for UI control (keep these)
  const [activeTab, setActiveTab] = useState("restaurants"); // Default tab
  const [sort, setSort] = useState(defaultSort[activeTab]); // Initialize sort based on default tab
  const [editingItem, setEditingItem] = useState(null);
  const [actionError, setActionError] = useState(null); // Separate state for mutation errors

  // --- Fetch Data using React Query ---
  // Query key includes activeTab and sort, so it refetches when they change
  const {
      data: items = [], // Default to empty array
      isLoading,
      isError,
      error,
      refetch
  } = useQuery({
      queryKey: ['adminData', activeTab, sort], // Dynamic query key
      queryFn: () => fetchAdminData(activeTab, sort), // Fetcher uses current tab and sort
      enabled: !!activeTab, // Only run if activeTab is set
      // Optional config
      // staleTime: 1000 * 60 * 1, // 1 minute
  });
  // --- End React Query Fetch ---

  // Handle tab change - also resets sort to default for the new tab
  const handleTabChange = (newTab) => {
      setActiveTab(newTab);
      setSort(defaultSort[newTab] || 'name_asc'); // Reset sort for new tab
      setEditingItem(null); // Clear editing state when changing tabs
      setActionError(null); // Clear action errors
  };

  // Handle sort change
  const handleSort = (column) => {
    // Determine new sort direction (toggle asc/desc)
    const currentDirection = sort.endsWith('_asc') ? 'asc' : 'desc';
    const currentColumn = sort.split('_')[0];
    const newDirection = (column === currentColumn && currentDirection === 'asc') ? 'desc' : 'asc';
    const newSort = `${column}_${newDirection}`;
    setSort(newSort);
    setEditingItem(null); // Clear editing state when changing sort
    setActionError(null); // Clear action errors
  };

  // Edit/Save/Delete Handlers (Mutations)
  const handleEdit = (item, type) => {
      // Ensure type matches current tab to prevent state mismatch
      if (type !== activeTab) return;
      setEditingItem({ ...item, type }); // Store type with item being edited
      setActionError(null);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    // Use the 'type' stored in editingItem
    const { id, type, ...updates } = editingItem;
    if (!id || !type) return; // Basic validation

    setActionError(null); // Clear previous action errors
    // TODO: Add a local loading state for the save action if needed

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates), // Send only the updates
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update ${type} (${response.status})`);
      }
      // const updatedItem = await response.json(); // Not strictly needed if invalidating
      console.log(`[AdminPanel] Successfully saved ${type} ID: ${id}`);
      setEditingItem(null); // Exit edit mode
      // *** Invalidate the query cache to refetch the list ***
      queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
    } catch (err) {
      console.error(`Admin PUT /${type}/${id} error:`, err);
      setActionError(`Error updating ${type}: ${err.message}`);
      // Do not exit edit mode on error
    } finally {
        // TODO: Reset local save loading state
    }
  };

  const handleDelete = async (id, type) => {
      // Ensure type matches current tab
      if (type !== activeTab) return;
      if (!confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)) return;

      setActionError(null);
      // TODO: Add a local loading state for the delete action if needed

      try {
          const response = await fetch(`${API_BASE_URL}/api/admin/${type}/${id}`, {
              method: 'DELETE',
          });
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Failed to delete ${type} (${response.status})`);
          }
          console.log(`[AdminPanel] Successfully deleted ${type} ID: ${id}`);
          // *** Invalidate the query cache to refetch the list ***
          queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
      } catch (err) {
          console.error(`Admin DELETE /${type}/${id} error:`, err);
          setActionError(`Error deleting ${type}: ${err.message}`);
      } finally {
          // TODO: Reset local delete loading state
      }
  };

  // --- Render Table Logic (Uses items from useQuery) ---
  const renderTable = (currentItems, type) => {
     // Ensure currentItems is an array
     const safeItems = Array.isArray(currentItems) ? currentItems : [];

     // Basic check for columns based on type (can be expanded)
     const columns = {
        restaurants: ['name', 'neighborhood_name', 'city_name', 'adds', 'created_at'],
        dishes: ['name', 'restaurant_name', 'adds', 'price', 'created_at'], // Assuming restaurant_name is added by fetcher
        lists: ['name', 'item_count', 'saved_count', 'created_at'], // Assuming item_count is added by fetcher
     };
     const displayColumns = columns[type] || ['name', 'created_at']; // Default columns

      return (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                {displayColumns.map(col => (
                  <th key={col} className="px-3 py-2 border-b text-left font-medium text-gray-600">
                    {/* Header Title */}
                    {col.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {/* Sort Button */}
                    {/* Enable sort only for supported columns (adapt based on backend) */}
                    {['name', 'created_at', 'adds', 'saved_count'].includes(col) && (
                        <button
                            onClick={() => handleSort(col)}
                            className="ml-1 p-0.5 rounded hover:bg-gray-200 align-middle"
                            title={`Sort by ${col}`}
                        >
                            {sort.startsWith(col) ? (sort.endsWith('_asc') ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronDown size={14} className="opacity-30"/>}
                        </button>
                    )}
                  </th>
                ))}
                <th className="px-3 py-2 border-b text-left font-medium text-gray-600">Tags</th>
                <th className="px-3 py-2 border-b text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* Render standard columns */}
                  {displayColumns.map(col => (
                     <td key={col} className="px-3 py-2 border-b">
                       {editingItem?.id === item.id ? (
                         // Basic input for editing (can be enhanced with specific types)
                         <input
                           type={col === 'adds' || col === 'saved_count' ? 'number' : 'text'}
                           value={editingItem[col] ?? ''}
                           onChange={(e) => setEditingItem({ ...editingItem, [col]: e.target.value })}
                           className="border rounded px-2 py-1 w-full text-sm"
                         />
                       ) : (
                         // Display formatted value
                         col === 'created_at' ? new Date(item[col]).toLocaleDateString() : item[col] ?? 'N/A'
                       )}
                     </td>
                  ))}
                  {/* Render Tags */}
                  <td className="px-3 py-2 border-b">
                    {editingItem?.id === item.id ? (
                      <input
                        type="text"
                        value={(editingItem.tags || []).join(", ")}
                        onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean) })}
                        className="border rounded px-2 py-1 w-full text-sm"
                        placeholder="tag1, tag2, ..."
                      />
                    ) : (
                      (item.tags?.join(", ")) || "None"
                    )}
                  </td>
                  {/* Render Actions */}
                  <td className="px-3 py-2 border-b">
                    <div className="flex items-center gap-1">
                      {editingItem?.id === item.id ? (
                        <>
                          <Button onClick={handleSave} variant="primary" size="sm" className="!text-xs !px-1.5 !py-0.5">Save</Button>
                          <Button onClick={() => setEditingItem(null)} variant="tertiary" size="sm" className="!text-xs !px-1.5 !py-0.5">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(item, type)} variant="tertiary" size="sm" className="!p-1" title="Edit"> <Edit size={14} /> </Button>
                          <Button onClick={() => handleDelete(item.id, type)} variant="tertiary" size="sm" className="!p-1 text-red-500 hover:bg-red-50" title="Delete"> <Trash size={14} /> </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

      {/* Tabs (use handleTabChange) */}
      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => handleTabChange("restaurants")} className={`py-2 px-4 font-medium ${activeTab === "restaurants" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399]"}`}> Restaurants </button>
        <button onClick={() => handleTabChange("dishes")} className={`py-2 px-4 font-medium ${activeTab === "dishes" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399]"}`}> Dishes </button>
        <button onClick={() => handleTabChange("lists")} className={`py-2 px-4 font-medium ${activeTab === "lists" ? "border-b-2 border-[#D1B399] text-[#D1B399]" : "text-gray-500 hover:text-[#D1B399]"}`}> Lists </button>
        {/* Add other tabs here if needed */}
      </div>

      {/* Display Action Error */}
      {actionError && (
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{actionError}</span>
             <button onClick={() => setActionError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
           </div>
         )}

      {/* Loading State */}
      {isLoading && <div className="text-center py-10 text-gray-500 flex justify-center items-center"><Loader2 className="animate-spin h-6 w-6 mr-2"/> Loading {activeTab}...</div>}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="text-center py-10 px-4 max-w-lg mx-auto">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-500 mb-4">{error?.message || `Error loading ${activeTab}`}</p>
          <Button onClick={() => refetch()} variant="primary" size="sm" disabled={isLoading}> Retry </Button>
        </div>
      )}

      {/* Render Table */}
      {!isLoading && !isError && renderTable(items, activeTab)}
    </div>
  );
};

export default AdminPanel;