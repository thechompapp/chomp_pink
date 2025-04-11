// src/components/UI/TrendChart.jsx
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import {
  AreaChart, // Changed from LineChart
  Area,      // Changed from Line
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Define periods for filtering
const PERIOD_OPTIONS = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '1M' },
    { id: '90d', label: '3M' },
    { id: '1y', label: '1Y' },
];

// Define a color for the area/line - use theme color
const CHART_COLOR = "#A78B71";

// Fetcher function for AGGREGATE trend data (uses total_engagements endpoint)
const fetchAggregateTrendData = async (itemType, period) => {
    if (!itemType) {
        console.warn('[TrendChart] itemType is missing for aggregate fetch.');
        return [];
    }
    const params = new URLSearchParams({ itemType, period });
    // Use the correct backend endpoint
    const endpoint = `/api/analytics/aggregate-trends?${params.toString()}`;
    console.log(`[TrendChart] Fetching aggregate trend data from: ${endpoint}`);
    try {
        const data = await apiClient(endpoint, `Workspace Aggregate Trend Data (${itemType} ${period})`);
        // Ensure data is array and has the correct keys now ('total_engagements')
        return Array.isArray(data) ? data.map(d => ({...d, total_engagements: d.total_engagements ?? 0 })) : [];
    } catch (error) {
        console.error(`[TrendChart] Error fetching aggregate trend data for ${itemType}:`, error);
        throw new Error(error.message || 'Failed to load aggregate trend data.');
    }
};

// Modified TrendChart component
const TrendChart = ({ itemType }) => { // Removed itemId, itemName props
    const [period, setPeriod] = useState('30d'); // Default period

    const {
        data: chartData = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        // Updated queryKey
        queryKey: ['aggregateItemTrends', itemType, period],
        // Use the new fetcher function
        queryFn: () => fetchAggregateTrendData(itemType, period),
        enabled: !!itemType, // Only fetch when itemType is valid
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

    // Log data when it updates
    React.useEffect(() => {
        console.log(`[TrendChart] Data updated (type: ${itemType}, period: ${period}):`, chartData);
        if (chartData && chartData.length > 0) {
            console.log('[TrendChart] Sample data point:', chartData[0]);
        }
    }, [chartData, itemType, period]);

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100 min-h-[300px] flex flex-col"> {/* Adjusted min-height */}
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
            {/* *** Using fixed height h-[250px] for chart area *** */}
            <div className="flex-grow h-[250px] w-full">
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
                        {/* *** Changed to AreaChart *** */}
                        <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 5, left: -25, bottom: 0 }} // Adjusted margins
                        >
                             {/* Define Gradient */}
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.5}/>
                                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/> {/* Lighter grid */}
                            <XAxis dataKey="date" tickFormatter={dateFormatter} style={{ fontSize: '0.65rem' }} tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={10}/> {/* Simplified X Axis */}
                            <YAxis allowDecimals={false} style={{ fontSize: '0.65rem' }} tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35}/> {/* Simplified Y Axis */}
                            <Tooltip
                                contentStyle={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                                labelFormatter={dateFormatter}
                                // Custom formatter for single value
                                formatter={(value, name, props) => [`${value} Total`, null]} // Show just the value
                                labelStyle={{ marginBottom: '4px', fontWeight: 'bold' }}
                                wrapperClassName="!border !border-gray-200 !shadow-lg !rounded-md !bg-white/90"
                            />
                            {/* *** Use Area component with total_engagements *** */}
                            <Area
                                type="monotone"
                                dataKey="total_engagements" // Use the new aggregate key
                                stroke={CHART_COLOR}
                                fillOpacity={1}
                                fill="url(#chartGradient)" // Apply gradient
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 1, fill: '#fff', stroke: CHART_COLOR }}
                                name="Total Engagements" // Update name for tooltip
                                isAnimationActive={false} // Keep off for now
                            />
                             {/* Legend removed */}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default TrendChart;