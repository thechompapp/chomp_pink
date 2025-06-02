// src/pages/AdminPanel/columnConfig.jsx
import React from 'react';

// Column configurations for different resource types
export const COLUMN_CONFIG = {
  cleanup: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'entityType', header: 'Entity Type', isEditable: false, isSortable: true },
    { accessor: 'entityId', header: 'Entity ID', isEditable: false, isSortable: true },
    { accessor: 'field', header: 'Field', isEditable: false, isSortable: true },
    { accessor: 'currentValue', header: 'Current Value', isEditable: false, isSortable: false,
      render(value) {
        if (value === null || value === undefined) return <span className="text-muted italic">null</span>;
        if (typeof value === 'object') return <span className="text-muted italic">Object</span>;
        return String(value);
      }
    },
    { accessor: 'proposedValue', header: 'Proposed Value', isEditable: false, isSortable: false,
      render(value) {
        if (value === null || value === undefined) return <span className="text-muted italic">null</span>;
        if (typeof value === 'object') return <span className="text-muted italic">Object</span>;
        return String(value);
      }
    },
    { accessor: 'actions', header: 'Actions', isEditable: false, isSortable: false,
      render(_, row) {
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
              Approve
            </Button>
            <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white">
              Reject
            </Button>
          </div>
        );
      }
    },
  ],
  restaurants: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'cuisine', header: 'Cuisine', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'address', header: 'Address', isEditable: true, isSortable: false },
    { accessor: 'phone', header: 'Phone', isEditable: true, isSortable: false },
    { accessor: 'website', header: 'Website', isEditable: true, isSortable: false },
    { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'neighborhood_name', header: 'Neighborhood', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  dishes: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
    { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_id', header: 'Restaurant ID', isEditable: true, isSortable: true, valueType: 'number' },
    { accessor: 'adds', header: 'Adds', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  users: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'username', header: 'Username', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'email', header: 'Email', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'full_name', header: 'Full Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'role', header: 'Role', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'account_type', header: 'Account Type', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  cities: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'state', header: 'State', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'country', header: 'Country', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  neighborhoods: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'city_id', header: 'City ID', isEditable: true, isSortable: true, valueType: 'number' },
    { accessor: 'zip_code', header: 'ZIP Code', isEditable: true, isSortable: true },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  hashtags: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'category', header: 'Category', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'usage_count', header: 'Usage Count', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  restaurant_chains: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'website', header: 'Website', isEditable: true, isSortable: false },
    { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
    { accessor: 'restaurant_count', header: 'Restaurants', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  chains: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_count', header: 'Restaurant Count', isEditable: false, isSortable: true },
  ],
  submissions: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'type', header: 'Type', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'status', header: 'Status', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'submitted_by_username', header: 'Submitted By', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'dish_name', header: 'Dish', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'created_at', header: 'Submitted', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
  lists: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'name', header: 'List Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
    { accessor: 'list_type', header: 'Type', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'creator_handle', header: 'Creator', isEditable: false, isSortable: true, isFilterable: true },
    { accessor: 'item_count', header: 'Items', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'saved_count', header: 'Saves', isEditable: false, isSortable: true, valueType: 'number' },
    { accessor: 'is_public', header: 'Public', isEditable: true, isSortable: true, valueType: 'boolean' },
    { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
    { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
  ],
};

export const getColumnConfig = (resourceType) => {
  const configs = {
    restaurants: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'cuisine', header: 'Cuisine', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'address', header: 'Address', isEditable: true, isSortable: false },
      { accessor: 'phone', header: 'Phone', isEditable: true, isSortable: false },
      { accessor: 'website', header: 'Website', isEditable: true, isSortable: false },
      { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'neighborhood_name', header: 'Neighborhood', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    dishes: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
      { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'restaurant_id', header: 'Restaurant ID', isEditable: true, isSortable: true, valueType: 'number' },
      { accessor: 'adds', header: 'Adds', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    users: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'username', header: 'Username', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'email', header: 'Email', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'full_name', header: 'Full Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'role', header: 'Role', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'account_type', header: 'Account Type', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    cities: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'state', header: 'State', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'country', header: 'Country', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    neighborhoods: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'city_id', header: 'City ID', isEditable: true, isSortable: true, valueType: 'number' },
      { accessor: 'zip_code', header: 'ZIP Code', isEditable: true, isSortable: true },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    hashtags: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'category', header: 'Category', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'usage_count', header: 'Usage Count', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    restaurant_chains: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'website', header: 'Website', isEditable: true, isSortable: false },
      { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
      { accessor: 'restaurant_count', header: 'Restaurants', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    submissions: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'type', header: 'Type', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'status', header: 'Status', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'submitted_by_username', header: 'Submitted By', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'restaurant_name', header: 'Restaurant', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'dish_name', header: 'Dish', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'created_at', header: 'Submitted', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ],
    
    lists: [
      { accessor: 'id', header: 'ID', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'name', header: 'List Name', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
      { accessor: 'list_type', header: 'Type', isEditable: true, isSortable: true, isFilterable: true },
      { accessor: 'city_name', header: 'City', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'creator_handle', header: 'Creator', isEditable: false, isSortable: true, isFilterable: true },
      { accessor: 'item_count', header: 'Items', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'saved_count', header: 'Saves', isEditable: false, isSortable: true, valueType: 'number' },
      { accessor: 'is_public', header: 'Public', isEditable: true, isSortable: true, valueType: 'boolean' },
      { accessor: 'created_at', header: 'Created', isEditable: false, isSortable: true, valueType: 'date' },
      { accessor: 'updated_at', header: 'Updated', isEditable: false, isSortable: true, valueType: 'date' }
    ]
  };
  
  return configs[resourceType] || [];
};

export default COLUMN_CONFIG;
