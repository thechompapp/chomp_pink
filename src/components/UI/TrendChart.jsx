// src/components/UI/TrendChart.jsx
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient'; // Use alias
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Define periods for filtering
const PERIOD_OPTIONS = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '1M' },
    { id: '90d', label: '3M' },
    { id: '1y', label: '1Y' },
];

// Colors for different engagement types
const COLORS = {
    views: '#8884d8', // Purple
    clicks: '#82ca9d', // Green
    adds: '#ffc658',   // Amber
    shares: '#ff7300', // Orange
};

// *** Updated Fetcher function for AGGREGATE trend data ***
const fetchAggregateTrendData = async (itemType, period) => {
    // itemType is now required (restaurant, dish, or list)
    if (!itemType) {
        console.warn('[TrendChart] itemType is missing for aggregate fetch.');
        return [];
    }
    const params = new URLSearchParams({ itemType, period });
    // *** Use the new backend endpoint ***
    const endpoint = `/api/analytics/aggregate-trends?${params.toString()}`;
    console.log(`[TrendChart] Fetching aggregate trend data from: ${endpoint}`);
    try {
        const data = await apiClient(endpoint, `Workspace Aggregate Trend Data (${itemType} ${period})`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[TrendChart] Error fetching aggregate trend data for ${itemType}:`, error);
        throw new Error(error.message || 'Failed to load aggregate trend data.'); // Re-throw for useQuery
    }
};

// *** Modified TrendChart component to accept itemType instead of itemId/itemName ***
const TrendChart = ({ itemType }) => {
    const [period, setPeriod] = useState('30d'); // Default period

    const {
        data: chartData = [], // Default to empty array
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        // *** Updated queryKey to reflect aggregate nature ***
        queryKey: ['aggregateItemTrends', itemType, period],
        // *** Use the new fetcher function ***
        queryFn: () => fetchAggregateTrendData(itemType, period),
        enabled: !!itemType, // Only fetch when itemType is valid
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Format date for XAxis labels
    const dateFormatter = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    };

    // Capitalize itemType for title
    const chartTitle = itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : 'Items';

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100 min-h-[350px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                {/* *** Updated Title *** */}
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#A78B71]" />
                    Aggregate Engagement Trends: {chartTitle}
                </h3>
                {/* Period Selection Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                    {PERIOD_OPTIONS.map(option => (
                        <Button
                            key={option.id}
                            variant={period === option.id ? 'primary' : 'tertiary'}
                            size="sm"
                            onClick={() => setPeriod(option.id)}
                            disabled={isLoading}
                            className="!px-2.5 !py-0.5"
                            aria-pressed={period === option.id}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading && <LoadingSpinner message={`Loading ${chartTitle} trend data...`} />}

            {isError && !isLoading && (
                 <ErrorMessage
                    message={error?.message || `Could not load ${chartTitle} trend data.`}
                    onRetry={refetch}
                    isLoadingRetry={isLoading}
                    containerClassName="flex-grow flex flex-col items-center justify-center"
                />
            )}

            {!isLoading && !isError && chartData.length === 0 && (
                <div className="flex-grow flex items-center justify-center">
                     <p className="text-gray-500 text-sm">No engagement data available for {chartTitle} in this period.</p>
                </div>
            )}

            {!isLoading && !isError && chartData.length > 0 && (
                <div className="flex-grow min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" tickFormatter={dateFormatter} style={{ fontSize: '0.7rem' }} tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
                            <YAxis allowDecimals={false} style={{ fontSize: '0.7rem' }} tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
                            <Tooltip contentStyle={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} labelFormatter={dateFormatter}/>
                            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="views" stroke={COLORS.views} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Views" />
                            <Line type="monotone" dataKey="clicks" stroke={COLORS.clicks} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Clicks" />
                            <Line type="monotone" dataKey="adds" stroke={COLORS.adds} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Adds" />
                            <Line type="monotone" dataKey="shares" stroke={COLORS.shares} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Shares" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default TrendChart;