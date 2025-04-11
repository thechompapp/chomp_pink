// src/pages/AdminPanel/AdminEngagementAnalytics.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import TrendChart from '@/components/UI/TrendChart';
import Button from '@/components/UI/Button';
import { Activity, BarChart2, Filter, MapPin, Tag, Hash } from 'lucide-react'; // Added icons

// --- Fetcher Functions ---
// Fetcher for overall engagement details
const fetchEngagementDetails = async () => {
    console.log(`[AdminEngagementAnalytics] Fetching engagement details...`);
    const endpoint = `/api/analytics/engagements`;
    try {
        const response = await apiClient(endpoint, `Admin Fetch Engagement Details`);
        return response?.data ?? { views: 0, clicks: 0, adds: 0, shares: 0 };
    } catch (error) {
        console.error(`[AdminEngagementAnalytics] Error fetching engagement details:`, error);
        throw new Error(error.message || `Failed to load engagement details`);
    }
};

// TODO: Add fetcher functions for drill-down views when backend endpoints are ready
// e.g., fetchEngagementByCategory, fetchEngagementByNeighborhood, etc.

// --- Component ---
const AdminEngagementAnalytics = () => {
    const [drilldownView, setDrilldownView] = useState('platform'); // 'platform', 'dish', 'restaurant', 'category', 'neighborhood', 'cuisine'
    const [selectedFilter, setSelectedFilter] = useState(null); // e.g., category name, neighborhood ID
    const [chartItemType, setChartItemType] = useState('restaurant'); // For TrendChart

    // Fetch overall engagement details
    const engagementDetailsQuery = useQuery({
        queryKey: ['engagementDetails'],
        queryFn: fetchEngagementDetails,
        staleTime: 5 * 60 * 1000,
        placeholderData: { views: 0, clicks: 0, adds: 0, shares: 0 },
    });

    // TODO: Add useQuery calls for drill-down data based on drilldownView and selectedFilter
    // const drilldownQuery = useQuery({
    //     queryKey: ['engagementDrilldown', drilldownView, selectedFilter],
    //     queryFn: () => fetchDrilldownData(drilldownView, selectedFilter), // Replace with actual fetcher
    //     enabled: drilldownView !== 'platform',
    //     placeholderData: [], // Adjust placeholder as needed
    // });

    // Render Stat Card Helper (can be shared or kept local)
    const renderStatCard = (label, value, IconComponent) => {
        const displayValue = (typeof value === 'number' && !isNaN(value)) ? value.toLocaleString() : (value ?? 'N/A');
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

    // Render Drilldown Placeholder (replace with actual table/chart later)
    const renderDrilldownContent = () => {
        if (drilldownView === 'platform') return null; // No specific drilldown needed for platform view (shown above)

        // Placeholder message until backend is ready
        return (
             <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500">
                 <p>Detailed drill-down data for '{drilldownView}' {selectedFilter ? `(Filter: ${selectedFilter})` : ''} will be displayed here.</p>
                 <p className="text-xs mt-1">(Requires corresponding backend API endpoints)</p>
             </div>
        );
        // TODO: Replace placeholder with actual data rendering using drilldownQuery.data
        // Example: A table component showing engagement by category/neighborhood etc.
    };

    return (
        <div className="space-y-6">
            {/* Overall Engagement Details Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Activity size={20} className="text-[#A78B71]" />Overall Engagement (Total)
                </h3>
                {engagementDetailsQuery.isLoading ? (
                    <LoadingSpinner message="Loading engagement totals..." />
                ) : engagementDetailsQuery.isError ? (
                    <ErrorMessage
                        message={engagementDetailsQuery.error.message || 'Failed to load engagement totals.'}
                        onRetry={engagementDetailsQuery.refetch}
                        isLoadingRetry={engagementDetailsQuery.isFetching}
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderStatCard("Views", engagementDetailsQuery.data?.views ?? 0, Activity)}
                        {renderStatCard("Clicks", engagementDetailsQuery.data?.clicks ?? 0, Activity)}
                        {renderStatCard("Adds to Lists", engagementDetailsQuery.data?.adds ?? 0, Activity)}
                        {renderStatCard("Shares", engagementDetailsQuery.data?.shares ?? 0, Activity)}
                    </div>
                )}
            </div>

            {/* Engagement Trends Chart (Reuse TrendChart) */}
            <TrendChart itemType={chartItemType} />
            <div className="flex justify-center gap-2 mt-2">
                {/* Buttons to select item type for the trend chart */}
                {(['restaurant', 'dish', 'list']).map(type => (
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

            {/* Drilldown Selection */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Filter size={20} className="text-[#A78B71]" />Drilldown View
                </h3>
                <div className="flex flex-wrap gap-2">
                    <Button variant={drilldownView === 'platform' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('platform'); setSelectedFilter(null); }}>Platform-Wide</Button>
                    <Button variant={drilldownView === 'dish' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('dish'); setSelectedFilter(null); }}>By Dish (Aggregate)</Button>
                    <Button variant={drilldownView === 'restaurant' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('restaurant'); setSelectedFilter(null); }}>By Restaurant (Aggregate)</Button>
                    <Button variant={drilldownView === 'category' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('category'); setSelectedFilter(null); }}>By Category</Button>
                    <Button variant={drilldownView === 'neighborhood' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('neighborhood'); setSelectedFilter(null); }}>By Neighborhood</Button>
                    <Button variant={drilldownView === 'cuisine' ? 'primary' : 'tertiary'} size="sm" onClick={() => { setDrilldownView('cuisine'); setSelectedFilter(null); }}>By Cuisine</Button>
                    {/* TODO: Add filter selection UI when a drilldown (e.g., category, neighborhood) is active */}
                </div>
                 {/* Placeholder for Filter Selection Input (e.g., dropdown for categories) */}
                 {drilldownView !== 'platform' && drilldownView !== 'dish' && drilldownView !== 'restaurant' && (
                      <div className="mt-4">
                          <label htmlFor="drilldown-filter" className="text-sm font-medium text-gray-700 mr-2">Filter by {drilldownView}:</label>
                          {/* Replace with actual dropdown/search input */}
                          <input
                              id="drilldown-filter"
                              type="text"
                              placeholder={`Select or type a ${drilldownView}...`}
                              className="p-1 border border-gray-300 rounded text-sm"
                              // onChange={(e) => setSelectedFilter(e.target.value)} // Example
                              disabled // Disabled until backend/data source is ready
                          />
                      </div>
                 )}

                {renderDrilldownContent()}
            </div>

        </div>
    );
};

export default AdminEngagementAnalytics;