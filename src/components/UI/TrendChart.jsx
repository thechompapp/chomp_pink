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

// Fetcher function for aggregate trend data
const fetchAggregateTrendData = async (itemType, period) => {
    if (!itemType) {
        console.warn('[TrendChart] itemType is missing for aggregate fetch.');
        return [];
    }
    const params = new URLSearchParams({ itemType, period });
    const endpoint = `/api/analytics/aggregate-trends?${params.toString()}`;
    console.log(`[TrendChart] Fetching aggregate trend data from: ${endpoint}`);
    try {
        const data = await apiClient(endpoint, `Workspace Aggregate Trend Data (${itemType} ${period})`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`[TrendChart] Error fetching aggregate trend data for ${itemType}:`, error);
        throw new Error(error.message || 'Failed to load aggregate trend data.');
    }
};

const TrendChart = ({ itemType }) => {
    const [period, setPeriod] = useState('30d');

    const {
        data: chartData = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['aggregateItemTrends', itemType, period],
        queryFn: () => fetchAggregateTrendData(itemType, period),
        enabled: !!itemType,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Format date for XAxis labels
    const dateFormatter = (dateStr) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    };

    const chartTitle = itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : 'Items';

    // Log data only when it changes or component re-renders with new data
    React.useEffect(() => {
        console.log(`[TrendChart] Data updated (type: ${itemType}, period: ${period}):`, chartData);
        if (chartData && chartData.length > 0) {
            console.log('[TrendChart] Sample data point:', chartData[0]);
        }
    }, [chartData, itemType, period]); // Dependency array includes chartData

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100 min-h-[350px] flex flex-col">
             {/* Header Section (Title & Period Buttons) */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                 <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                     <TrendingUp size={18} className="text-[#A78B71]" />
                     Aggregate Engagement Trends: {chartTitle}
                 </h3>
                 <div className="flex gap-1 flex-shrink-0">
                     {PERIOD_OPTIONS.map(option => (
                         <Button key={option.id} variant={period === option.id ? 'primary' : 'tertiary'} size="sm" onClick={() => setPeriod(option.id)} disabled={isLoading} className="!px-2.5 !py-0.5" aria-pressed={period === option.id}>
                             {option.label}
                         </Button>
                     ))}
                 </div>
             </div>

            {/* Chart Area or Loading/Error/No Data Message */}
             {/* *** CHANGED: Use fixed height h-[300px] instead of min-h *** */}
            <div className="flex-grow h-[300px] w-full">
                {isLoading && <LoadingSpinner message={`Loading ${chartTitle} trend data...`} />}

                {isError && !isLoading && (
                     <ErrorMessage message={error?.message || `Could not load ${chartTitle} trend data.`} onRetry={refetch} isLoadingRetry={isLoading} containerClassName="h-full flex flex-col items-center justify-center" />
                )}

                {!isLoading && !isError && (!chartData || chartData.length === 0) && (
                    <div className="h-full flex items-center justify-center">
                         <p className="text-gray-500 text-sm">No engagement data available for {chartTitle} in this period.</p>
                    </div>
                )}

                {!isLoading && !isError && chartData && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" tickFormatter={dateFormatter} style={{ fontSize: '0.7rem' }} tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} interval="preserveStartEnd" />
                            <YAxis allowDecimals={false} style={{ fontSize: '0.7rem' }} tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#d1d5db' }} tickLine={{ stroke: '#d1d5db' }} />
                            <Tooltip contentStyle={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} labelFormatter={dateFormatter}/>
                            <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="views" stroke={COLORS.views} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Views" isAnimationActive={false} />
                            <Line type="monotone" dataKey="clicks" stroke={COLORS.clicks} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Clicks" isAnimationActive={false}/>
                            <Line type="monotone" dataKey="adds" stroke={COLORS.adds} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Adds" isAnimationActive={false}/>
                            <Line type="monotone" dataKey="shares" stroke={COLORS.shares} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Shares" isAnimationActive={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default TrendChart;