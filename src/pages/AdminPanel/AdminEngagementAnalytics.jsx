// src/pages/AdminPanel/AdminEngagementAnalytics.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDefaultApiClient } from '@/services/http';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import TrendChart from '@/components/UI/TrendChart.jsx'; // Use .jsx
import Button from '@/components/UI/Button.jsx';
import { Activity, Filter, MapPin, Tag, Hash } from 'lucide-react'; // Removed BarChart2

// --- REMOVED: TypeScript interfaces ---

// --- Fetcher Functions ---
const fetchEngagementDetails = async () => { // REMOVED: : Promise<EngagementDetails>
  console.log(`[AdminEngagementAnalytics] Fetching engagement details...`);
  const endpoint = `/api/analytics/engagements`;
  try {
    const response = await apiClient(endpoint, `Admin Fetch Engagement Details`); // REMOVED: <{ data: EngagementDetails }>
    // Basic JS check
    if (!response?.success || typeof response?.data !== 'object' || response.data === null) {
        throw new Error(response?.error || 'Failed to fetch or parse engagement details');
    }
    return response.data ?? { views: 0, clicks: 0, adds: 0, shares: 0 };
  } catch (error) {
    console.error(`[AdminEngagementAnalytics] Error fetching engagement details:`, error);
    throw error instanceof Error ? error : new Error(`Failed to load engagement details`);
  }
};

const AdminEngagementAnalytics = () => { // Removed : React.FC
  const [drilldownView, setDrilldownView] = useState('platform'); // REMOVED: <string>
  const [selectedFilter, setSelectedFilter] = useState(null); // REMOVED: <string | null>
  const [chartItemType, setChartItemType] = useState('restaurant'); // REMOVED: <string>

  // UseQuery without generics
  const engagementDetailsQuery = useQuery({
    queryKey: ['engagementDetails'],
    queryFn: fetchEngagementDetails,
    staleTime: 5 * 60 * 1000,
    placeholderData: { views: 0, clicks: 0, adds: 0, shares: 0 }, // Provide initial data
  });

  const renderStatCard = (label, value, IconComponent) => { // Removed type annotations
    const displayValue = typeof value === 'number' && !isNaN(value) ? value.toLocaleString() : value ?? 'N/A';
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center transition hover:shadow-md">
        <div className="flex justify-center items-center text-gray-500 mb-2">
          {IconComponent && <IconComponent size={18} className="mr-2 flex-shrink-0" />}
          <p className="text-sm font-medium truncate">{label}</p>
        </div>
        <p className="text-2xl font-bold text-[#A78B71]">{displayValue}</p>
      </div>
    );
  };

  // Drilldown content - kept simple as backend logic not implemented
  const renderDrilldownContent = useMemo(() => {
    if (drilldownView === 'platform') return null;
    return (
      <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500">
        <p>
          Detailed drill-down data for '{drilldownView}' {selectedFilter ? `(Filter: ${selectedFilter})` : ''} will be
          displayed here.
        </p>
        <p className="text-xs mt-1">(Requires corresponding backend API endpoints)</p>
      </div>
    );
  }, [drilldownView, selectedFilter]);

  return (
    <div className="space-y-6">
      {/* Overall Engagement Card */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <Activity size={20} className="text-[#A78B71]" /> Overall Engagement (Total)
        </h3>
        {engagementDetailsQuery.isLoading ? (
          <LoadingSpinner message="Loading engagement totals..." />
        ) : engagementDetailsQuery.isError ? (
          <ErrorMessage
            message={engagementDetailsQuery.error?.message || 'Failed to load engagement totals.'} // Use optional chaining
            onRetry={engagementDetailsQuery.refetch}
            isLoadingRetry={engagementDetailsQuery.isFetching}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderStatCard('Views', engagementDetailsQuery.data?.views ?? 0, Activity)}
            {renderStatCard('Clicks', engagementDetailsQuery.data?.clicks ?? 0, Activity)}
            {renderStatCard('Adds to Lists', engagementDetailsQuery.data?.adds ?? 0, Activity)}
            {renderStatCard('Shares', engagementDetailsQuery.data?.shares ?? 0, Activity)}
          </div>
        )}
      </div>

      {/* Trend Chart Section */}
      <TrendChart itemType={chartItemType} />
      <div className="flex justify-center gap-2 mt-2">
        {(['restaurant', 'dish', 'list']).map((type) => ( // REMOVED: as const assertion
          <Button
            key={type}
            variant={chartItemType === type ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setChartItemType(type)}
            className="!px-2.5 !py-1 flex items-center gap-1 capitalize"
            aria-pressed={chartItemType === type}
          >
            {type} Trends
          </Button>
        ))}
      </div>

      {/* Drilldown Section */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <Filter size={20} className="text-[#A78B71]" /> Drilldown View
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Drilldown Buttons - logic remains the same */}
          <Button variant={drilldownView === 'platform' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('platform'); setSelectedFilter(null); }}>Platform-Wide</Button>
          <Button variant={drilldownView === 'dish' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('dish'); setSelectedFilter(null); }}>By Dish</Button>
          <Button variant={drilldownView === 'restaurant' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('restaurant'); setSelectedFilter(null); }}>By Restaurant</Button>
          <Button variant={drilldownView === 'category' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('category'); setSelectedFilter(null); }}>By Category</Button>
          <Button variant={drilldownView === 'neighborhood' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('neighborhood'); setSelectedFilter(null); }}>By Neighborhood</Button>
          <Button variant={drilldownView === 'cuisine' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('cuisine'); setSelectedFilter(null); }}>By Cuisine</Button>
        </div>
        {/* Drilldown Filter Placeholder - logic remains the same */}
        {drilldownView !== 'platform' && drilldownView !== 'dish' && drilldownView !== 'restaurant' && (
          <div className="mt-4">
            <label htmlFor="drilldown-filter" className="text-sm font-medium text-gray-700 mr-2"> Filter by {drilldownView}: </label>
            <input id="drilldown-filter" type="text" placeholder={`Select or type a ${drilldownView}...`} className="p-1 border border-gray-300 rounded text-sm" disabled />
          </div>
        )}
        {renderDrilldownContent}
      </div>
    </div>
  );
};

export default AdminEngagementAnalytics;