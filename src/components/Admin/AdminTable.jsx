import { useState, useMemo } from 'react';
import { Edit, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminTable = ({ tabKey, data = [], onRefetch, isLoading }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save logic
      console.log('Saving:', editData);
      await onRefetch();
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // TODO: Implement delete logic
        console.log('Deleting:', id);
        await onRefetch();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const renderCell = (key, value, item) => {
    if (editingId === item.id) {
      return (
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={editData[key] || ''}
          onChange={(e) => setEditData(prev => ({
            ...prev,
            [key]: e.target.value
          }))}
          className="w-full px-2 py-1 border rounded"
        />
      );
    }
    
    // Format date strings
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    
    // Handle nested objects
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value || '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No data available
      </div>
    );
  }

  // Get all unique keys from the data for table headers
  const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {allKeys.map((key) => (
              <th
                key={key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => requestSort(key)}
              >
                <div className="flex items-center">
                  {key.replace(/_/g, ' ')}
                  {sortConfig.key === key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? (
                        <ChevronUp className="h-4 w-4 inline" />
                      ) : (
                        <ChevronDown className="h-4 w-4 inline" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {allKeys.map((key) => (
                <td key={`${item.id}-${key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderCell(key, item[key], item)}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === item.id ? (
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-900"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditData({});
                      }}
                      className="text-gray-600 hover:text-gray-900"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
