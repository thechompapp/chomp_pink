/**
 * LocationsTab Component
 * 
 * Unified location management combining cities and neighborhoods
 * Supports hierarchical structure and address resolution (e.g., Brooklyn, NY)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Globe,
  Navigation,
  Layers,
  Settings,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/services/apiClient';
import { logDebug, logError } from '@/utils/logger';

const LocationsTab = () => {
  const [locationHierarchy, setLocationHierarchy] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [expandedCities, setExpandedCities] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [addressResolution, setAddressResolution] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadLocationData();
    loadStats();
  }, []);

  const loadLocationData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/locations/hierarchy');
      
      // Debug the exact response structure
      logDebug('[LocationsTab] Full response object:', response);
      logDebug('[LocationsTab] Response data:', response?.data);
      logDebug('[LocationsTab] Response data type:', typeof response?.data);
      logDebug('[LocationsTab] Response data keys:', response?.data ? Object.keys(response.data) : 'no data');
      
      // Try different extraction approaches
      let hierarchyData;
      if (response?.data?.data) {
        // Nested data structure (response.data.data)
        hierarchyData = response.data.data;
        logDebug('[LocationsTab] Using nested data structure:', hierarchyData?.length);
      } else if (response?.data && Array.isArray(response.data)) {
        // Direct data structure (response.data is the array)
        hierarchyData = response.data;
        logDebug('[LocationsTab] Using direct data structure:', hierarchyData?.length);
      } else {
        // Fallback
        hierarchyData = [];
        logDebug('[LocationsTab] No valid data found, using empty array');
      }
      
      setLocationHierarchy(Array.isArray(hierarchyData) ? hierarchyData : []);
      logDebug('[LocationsTab] Final hierarchy set:', hierarchyData?.length);
    } catch (error) {
      logError('[LocationsTab] Error loading location hierarchy:', error);
      setLocationHierarchy([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/admin/locations/stats');
      
      // Debug the stats response structure
      logDebug('[LocationsTab] Stats response:', response);
      logDebug('[LocationsTab] Stats data:', response?.data);
      logDebug('[LocationsTab] Stats data type:', typeof response?.data);
      
      // Try different extraction approaches for stats
      let statsData;
      if (response?.data?.data) {
        // Nested data structure (response.data.data)
        statsData = response.data.data;
        logDebug('[LocationsTab] Using nested stats structure');
      } else if (response?.data) {
        // Direct data structure (response.data is the object)
        statsData = response.data;
        logDebug('[LocationsTab] Using direct stats structure');
      } else {
        statsData = null;
        logDebug('[LocationsTab] No valid stats data found');
      }
      
      setStats(statsData);
    } catch (error) {
      logError('[LocationsTab] Error loading stats:', error);
    }
  };

  // Filter locations based on search
  const filteredHierarchy = useMemo(() => {
    // Ensure locationHierarchy is always an array
    const hierarchyArray = Array.isArray(locationHierarchy) ? locationHierarchy : [];
    
    if (!searchTerm.trim()) return hierarchyArray;
    
    return hierarchyArray.filter(city => {
      if (!city || typeof city !== 'object') return false;
      
      const cityMatch = city.city_name && city.city_name.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = city.locations?.some(location => 
        location.name && location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.children?.some(child => 
          child.name && child.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      return cityMatch || locationMatch;
    });
  }, [locationHierarchy, searchTerm]);

  // Toggle city expansion
  const toggleCityExpansion = (cityId) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  // Address resolution
  const resolveAddress = async (addressCity, addressState = 'NY') => {
    try {
      const response = await apiClient.post('/admin/locations/resolve', {
        addressCity,
        addressState
      });
      // API returns response.data as the resolution object
      const resolutionData = response?.data;
      setAddressResolution(resolutionData);
    } catch (error) {
      logError('[LocationsTab] Error resolving address:', error);
      setAddressResolution({ error: 'Failed to resolve address' });
    }
  };

  // CRUD operations
  const createLocation = async (type, data) => {
    try {
      // Use correct plural forms for the API endpoints
      const endpoint = type === 'city' ? '/admin/locations/cities' : '/admin/locations/neighborhoods';
      await apiClient.post(endpoint, data);
      await loadLocationData();
      await loadStats();
      setActiveModal(null);
      setFormData({});
    } catch (error) {
      logError(`[LocationsTab] Error creating ${type}:`, error);
    }
  };

  const updateLocation = async (type, id, data) => {
    try {
      // Use correct plural forms for the API endpoints
      const endpoint = type === 'city' ? `/admin/locations/cities/${id}` : `/admin/locations/neighborhoods/${id}`;
      await apiClient.put(endpoint, data);
      await loadLocationData();
      await loadStats();
      setActiveModal(null);
      setFormData({});
    } catch (error) {
      logError(`[LocationsTab] Error updating ${type}:`, error);
    }
  };

  const deleteLocation = async (type, id) => {
    try {
      // Use correct plural forms for the API endpoints
      const endpoint = type === 'city' ? `/admin/locations/cities/${id}` : `/admin/locations/neighborhoods/${id}`;
      await apiClient.delete(endpoint);
      await loadLocationData();
      await loadStats();
    } catch (error) {
      logError(`[LocationsTab] Error deleting ${type}:`, error);
    }
  };

  // Modal handlers
  const openCreateModal = (type, parentData = {}) => {
    setFormData({ ...parentData, type });
    setActiveModal(`create-${type}`);
  };

  const openEditModal = (type, item) => {
    setFormData({ ...item, type });
    setActiveModal(`edit-${type}`);
  };

  // Location type icons
  const getLocationIcon = (type, isBorough) => {
    if (isBorough) return <Building2 size={16} className="text-blue-600" />;
    switch (type) {
      case 'borough': return <Building2 size={16} className="text-blue-600" />;
      case 'district': return <Layers size={16} className="text-green-600" />;
      case 'neighborhood': return <MapPin size={16} className="text-orange-600" />;
      default: return <MapPin size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading locations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-blue-600" />
            Location Management
          </h2>
          <p className="text-gray-600 mt-1">Manage cities, boroughs, and neighborhoods in hierarchical structure</p>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-semibold text-blue-700">{stats.total_cities}</div>
              <div className="text-blue-600">Cities</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-semibold text-green-700">{stats.total_boroughs}</div>
              <div className="text-green-600">Boroughs</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="font-semibold text-orange-700">{stats.total_neighborhoods}</div>
              <div className="text-orange-600">Neighborhoods</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-semibold text-purple-700">{stats.metro_areas}</div>
              <div className="text-purple-600">Metro Areas</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search cities, boroughs, neighborhoods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Add buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => openCreateModal('city')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add City
          </button>
          <button
            onClick={() => openCreateModal('neighborhood')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Add Location
          </button>
        </div>
      </div>

      {/* Address Resolution Tool */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
          <Navigation size={16} />
          Address Resolution Tool
        </h3>
        <p className="text-yellow-700 text-sm mb-3">
          Test how addresses like "Brooklyn, NY" resolve to proper locations
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Brooklyn, Manhattan, Queens..."
            className="flex-1 px-3 py-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                resolveAddress(e.target.value);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Brooklyn"]');
              if (input?.value) resolveAddress(input.value);
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Resolve
          </button>
        </div>
        
        {addressResolution && (
          <div className="mt-3 p-3 bg-white border border-yellow-200 rounded">
            {addressResolution.error ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={16} />
                {addressResolution.error}
              </div>
            ) : addressResolution.resolved_city_name ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="font-medium">Resolved Successfully</span>
                </div>
                <div className="text-sm text-gray-700">
                  <strong>City:</strong> {addressResolution.resolved_city_name}<br/>
                  {addressResolution.resolved_neighborhood_name && (
                    <>
                      <strong>Location:</strong> {addressResolution.resolved_neighborhood_name}<br/>
                    </>
                  )}
                  <strong>Type:</strong> {addressResolution.resolution_type}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <Info size={16} />
                No resolution found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Hierarchy */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="divide-y divide-gray-200">
          {filteredHierarchy.map((city) => (
            <div key={city.city_id} className="p-4">
              {/* City Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCityExpansion(city.city_id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedCities.has(city.city_id) ? (
                      <ChevronDown size={20} className="text-gray-600" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-600" />
                    )}
                  </button>
                  
                  <Globe size={20} className="text-blue-600" />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">{city.city_name}</h3>
                    <div className="text-sm text-gray-600 flex gap-4">
                      {city.state_code && (
                        <span>{city.state_code}</span>
                      )}
                      {city.is_metro_area && (
                        <span className="text-purple-600">Metro Area</span>
                      )}
                      {city.locations && (
                        <span>{city.locations.length} locations</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreateModal('neighborhood', { city_id: city.city_id })}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Add location to this city"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => openEditModal('city', city)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit city"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteLocation('city', city.city_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete city"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded City Content */}
              {expandedCities.has(city.city_id) && city.locations && (
                <div className="mt-4 ml-8 space-y-2">
                  {city.locations.map((location) => (
                    <div key={location.id} className="border-l-2 border-gray-200 pl-4">
                      {/* Location Header */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          {getLocationIcon(location.location_type, location.is_borough)}
                          <span className="font-medium text-gray-800">{location.name}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {location.location_type}
                          </span>
                          {location.is_borough && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              Borough
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openCreateModal('neighborhood', { 
                              city_id: city.city_id, 
                              parent_id: location.id,
                              location_level: (location.location_level || 1) + 1
                            })}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Add sub-location"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal('neighborhood', { ...location, city_id: city.city_id })}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit location"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteLocation('neighborhood', location.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete location"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Children Locations */}
                      {location.children && location.children.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {location.children.map((child) => (
                            <div key={child.id} className="flex items-center justify-between py-1 text-sm">
                              <div className="flex items-center gap-2">
                                {getLocationIcon(child.location_type)}
                                <span className="text-gray-700">{child.name}</span>
                                <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded">
                                  {child.location_type}
                                </span>
                                {child.zipcode_ranges && child.zipcode_ranges.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {child.zipcode_ranges.slice(0, 2).join(', ')}
                                    {child.zipcode_ranges.length > 2 && '...'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditModal('neighborhood', { ...child, city_id: city.city_id })}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit neighborhood"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => deleteLocation('neighborhood', child.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete neighborhood"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <LocationModal
          type={activeModal}
          data={formData}
          onSave={(data) => {
            if (activeModal.startsWith('create-')) {
              const locationType = activeModal.replace('create-', '');
              createLocation(locationType, data);
            } else if (activeModal.startsWith('edit-')) {
              const locationType = activeModal.replace('edit-', '');
              updateLocation(locationType, data.id, data);
            }
          }}
          onClose={() => {
            setActiveModal(null);
            setFormData({});
          }}
          cities={locationHierarchy}
        />
      )}
    </div>
  );
};

// Modal Component
const LocationModal = ({ type, data, onSave, onClose, cities }) => {
  const [formData, setFormData] = useState(data);
  const isCity = type.includes('city');
  const isEditing = type.startsWith('edit-');

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Edit' : 'Create'} {isCity ? 'City' : 'Location'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {isCity ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={formData.state_code || ''}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  maxLength={2}
                  placeholder="NY"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_metro_area"
                  checked={formData.is_metro_area || false}
                  onChange={(e) => setFormData({ ...formData, is_metro_area: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_metro_area" className="text-sm text-gray-700">
                  Metro Area
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_boroughs"
                  checked={formData.has_boroughs || false}
                  onChange={(e) => setFormData({ ...formData, has_boroughs: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="has_boroughs" className="text-sm text-gray-700">
                  Has Boroughs
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  value={formData.city_id || ''}
                  onChange={(e) => setFormData({ ...formData, city_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city.city_id} value={city.city_id}>
                      {city.city_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Type
                </label>
                <select
                  value={formData.location_type || 'neighborhood'}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="neighborhood">Neighborhood</option>
                  <option value="borough">Borough</option>
                  <option value="district">District</option>
                  <option value="area">Area</option>
                  <option value="zone">Zone</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_borough"
                  checked={formData.is_borough || false}
                  onChange={(e) => setFormData({ ...formData, is_borough: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_borough" className="text-sm text-gray-700">
                  Is Borough
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Codes (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.zipcode_ranges?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    zipcode_ranges: e.target.value.split(',').map(z => z.trim()).filter(z => z)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="10001, 10002, 10003"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Aliases (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.address_aliases?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address_aliases: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Brooklyn, NY"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationsTab; 