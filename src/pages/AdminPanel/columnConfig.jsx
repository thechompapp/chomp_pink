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
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'website', header: 'Website', isEditable: true, isSortable: false },
    { accessor: 'phone', header: 'Phone', isEditable: true, isSortable: false },
    { accessor: 'address', header: 'Address', isEditable: true, isSortable: false },
    { accessor: 'city_id', header: 'City', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'select',
      selectOptions: (cities) => cities.map(city => ({ value: city.id, label: city.name })),
    },
    { accessor: 'neighborhood_id', header: 'Neighborhood', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'select',
      selectOptions: (_, neighborhoods) => neighborhoods.map(n => ({ value: n.id, label: n.name })),
      dependsOn: 'city_id',
    },
    { accessor: 'price_range', header: 'Price', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'select',
      selectOptions: () => [
        { value: 1, label: '$' },
        { value: 2, label: '$$' },
        { value: 3, label: '$$$' },
        { value: 4, label: '$$$$' },
      ],
    },
  ],
  dishes: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Dish Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_id', header: 'Restaurant', isEditable: true, isSortable: true, isFilterable: true,
      render(value, row) {
        return row['restaurant_name'] || row['restaurant_id_display'] || value || '-';
      }
    },
    { accessor: 'price', header: 'Price', isEditable: true, isSortable: true },
    { accessor: 'description', header: 'Description', isEditable: true, isSortable: false },
  ],
  users: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'email', header: 'Email', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'username', header: 'Username', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'full_name', header: 'Name', isEditable: true, isSortable: true },
    { accessor: 'is_admin', header: 'Admin', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'boolean',
    },
    { accessor: 'is_verified', header: 'Verified', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'boolean',
    },
  ],
  cities: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'state', header: 'State', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'country', header: 'Country', isEditable: true, isSortable: true, isFilterable: true },
  ],
  neighborhoods: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'city_id', header: 'City', isEditable: true, isSortable: true, isFilterable: true,
      valueType: 'select',
      selectOptions: (cities) => cities.map(city => ({ value: city.id, label: city.name })),
    },
  ],
  hashtags: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'count', header: 'Usage Count', isEditable: false, isSortable: true },
  ],
  restaurant_chains: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_count', header: 'Restaurant Count', isEditable: false, isSortable: true },
  ],
  chains: [
    { accessor: 'id', header: 'ID', isEditable: false, isSortable: true },
    { accessor: 'name', header: 'Name', isEditable: true, isSortable: true, isFilterable: true },
    { accessor: 'restaurant_count', header: 'Restaurant Count', isEditable: false, isSortable: true },
  ],
  submissions: [
    {
      accessor: 'id',
      header: 'ID',
      isEditable: false,
      isSortable: true,
      render(value) {
        return `#${value}`;
      }
    },
    {
      accessor: 'name',
      header: 'Name',
      isEditable: false,
      isSortable: true,
      render(value) {
        return value || '-';
      }
    },
    {
      accessor: 'location',
      header: 'Address / Location',
      isEditable: false,
      isSortable: false,
      render(value) {
        return value || '-';
      }
    },
    {
      accessor: 'city',
      header: 'City',
      isEditable: false,
      isSortable: true,
      render(value) {
        return value || '-';
      }
    },
    {
      accessor: 'neighborhood',
      header: 'Neighborhood',
      isEditable: false,
      isSortable: true,
      render(value) {
        return value || '-';
      }
    },
    {
      accessor: 'user_handle',
      header: 'Submitted By',
      isEditable: false,
      isSortable: true,
      render(value) {
        return value || 'Anonymous';
      }
    },
    {
      accessor: 'restaurant_name',
      header: 'Restaurant (Dishes)',
      isEditable: false,
      isSortable: true,
      render(name, row) {
        if (!name) return '-';
        
        const dishes = row.dishes || [];
        return (
          <div>
            <div className="font-medium">{name}</div>
            {dishes.length > 0 && (
              <div className="text-xs text-muted-foreground">{dishes.length} dish(es) included</div>
            )}
          </div>
        );
      }
    },
    {
      accessor: 'status',
      header: 'Status',
      isEditable: false,
      isSortable: true,
      render(status) {
        const statusMap = {
          'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
          'approved': { label: 'Approved', className: 'bg-green-100 text-green-800' },
          'rejected': { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        };
        const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100' };
        return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>;
      }
    },
    {
      accessor: 'created_at',
      header: 'Submitted',
      isEditable: false,
      isSortable: true,
      render(value) {
        return value ? new Date(value).toLocaleDateString() : '-';
      }
    },
  ],
};
