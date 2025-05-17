import React from 'react';
import PropTypes from 'prop-types';
import { Edit, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { useAdminTable } from '../../hooks/useAdminTable';

export const AdminTable = ({ tabKey, data = [], onRefetch, isLoading }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [relatedData, setRelatedData] = useState({
    restaurants: {},
    neighborhoods: {},
    cities: {}
  });

  // Helper function to extract data array from various response formats
  const extractDataArray = (response) => {
    if (Array.isArray(response)) {
      return response;
    } else if (Array.isArray(response?.data)) {
      return response.data;
    } else if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (typeof response === 'object' && response !== null) {
      // Try to extract any array property from the response
      const arrayProps = Object.keys(response).filter(key => Array.isArray(response[key]));
      if (arrayProps.length > 0) {
        return response[arrayProps[0]];
      }
    }
    return [];
  };

  // Helper function to create ID-to-name mapping - memoized for performance
  const createEntityMap = useMemo(() => {
    return (entities) => {
      if (!entities || !Array.isArray(entities)) return {};
      
      return entities.reduce((map, entity) => {
        if (entity && entity.id && entity.name) {
          map[entity.id] = entity.name;
        }
        return map;
      }, {});
    };
  }, []);

  // Define related data configuration - memoized to prevent recreation on each render
  const relatedDataConfig = useMemo(() => ({
    dishes: { resource: 'restaurants', mapKey: 'restaurants' },
    restaurants: { resource: 'neighborhoods', mapKey: 'neighborhoods' },
    neighborhoods: { resource: 'cities', mapKey: 'cities' }
  }), []);

  // Fetch related data when component mounts or tabKey changes
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        console.log(`[AdminTable] Fetching related data for ${tabKey} tab`);
        
        // Log data prop for debugging
        console.log(`[AdminTable] Current data for ${tabKey}:`, {
          length: data?.length || 0,
          sample: data?.length > 0 ? data[0] : null
        });
        
        // Get config for current tab
        const config = relatedDataConfig[tabKey];
        
        if (config) {
          // Fetch related data
          const relatedData = await adminService.getAdminData(config.resource);
          console.log(`[AdminTable] Fetched ${config.resource} data:`, {
            length: relatedData?.length || 0,
            sample: relatedData?.length > 0 ? relatedData[0] : null
          });
          
          // Create mapping
          const mapping = createEntityMap(relatedData);
          setRelatedData(prevMap => ({
            ...prevMap,
            [config.mapKey]: mapping
          }));
        }
      } catch (error) {
        console.error(`[AdminTable] Error fetching related data for ${tabKey}:`, error);
      }
    };
    
    fetchRelatedData();
  }, [tabKey, relatedDataConfig, createEntityMap, data]);

  // Handle sorting with improved type handling
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data || [];
    
    const sortValue = (item, key) => {
      const value = item[key];
      // Handle different data types appropriately
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.toLowerCase(); // Case-insensitive string comparison
      return value; // Numbers and other types
    };
    
    return [...data].sort((a, b) => {
      const valueA = sortValue(a, sortConfig.key);
      const valueB = sortValue(b, sortConfig.key);
      
      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
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

  // Render input field for editing - extracted for better organization
  const renderEditInput = (key, value) => (
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

  // Render cell based on field type and context
  const renderCell = (key, value, item) => {
    // If in edit mode, render input field
    if (editingId === item.id) {
      return renderEditInput(key, value);
    }

    const config = relationshipConfigs[tabKey];
    if (config && config.fields.includes(key)) {
      // Check if we have the name directly in the data
      if (config.directField && item[config.directField] && 
          (!config.invalidValue || item[config.directField] !== config.invalidValue) && 
          (!config.checkType || typeof item[config.directField] === 'string')) {
        return item[config.directField];
      }
      // Otherwise try to look it up from our mapping
      if (relatedData[config.mapKey][value]) {
        return relatedData[config.mapKey][value];
      }
      // If we can't find it in our mapping, just return the value
      return value;
    }
    
    // Format special field types
    
    // Format date strings
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    
    // Format hashtags - ensure they have # prefix
    if (tabKey === 'hashtags' && key === 'name' && value && typeof value === 'string') {
      return value.startsWith('#') ? value : `#${value}`;
    }
    
    // Format phone numbers
    if (key === 'phone' && value && typeof value === 'string') {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
      }
    }
    
    // Format websites
    if (key === 'website' && value && typeof value === 'string') {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return `https://${value}`;
      }
    }
    
    // Badge rendering for special status fields
    const badgeConfigs = [
      {
        condition: tabKey === 'users' && key === 'account_type' && value === 'admin',
        className: 'bg-blue-100 text-blue-800',
        text: 'Admin'
      },
      {
        condition: tabKey === 'users' && key === 'verified' && value === true,
        className: 'bg-green-100 text-green-800',
        text: 'Verified'
      }
    ];
    
    const badgeConfig = badgeConfigs.find(config => config.condition);
    if (badgeConfig) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeConfig.className}`}>
          {badgeConfig.text}
        </span>
      );
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
  let allKeys = [...new Set(data.flatMap(item => Object.keys(item)))];
  
  // Remove specific columns based on tab
  if (tabKey === 'restaurants') {
    allKeys = allKeys.filter(key => key !== 'price' && key !== 'city' && key !== 'neighborhood');
  } else if (tabKey === 'dishes') {
    allKeys = allKeys.filter(key => key !== 'price' && key !== 'restaurant_name' && key !== 'dish_id');
  } else if (tabKey === 'neighborhoods') {
    allKeys = allKeys.filter(key => key !== 'city_name' && key !== 'zipcode_ranges');
  } else if (tabKey === 'hashtags') {
    // Ensure hashtags are properly displayed
    data.forEach(item => {
      if (item.name && !item.name.startsWith('#')) {
        item.name = `#${item.name}`;
      }
    });
  }

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

// Define prop types for better documentation and validation
AdminTable.propTypes = {
  /** The current tab key/resource type being displayed */
  tabKey: PropTypes.string.isRequired,
  /** Array of data items to display in the table */
  data: PropTypes.array,
  /** Function to call when data needs to be refreshed */
  onRefetch: PropTypes.func.isRequired,
  /** Loading state indicator */
  isLoading: PropTypes.bool
};

export default AdminTable;
