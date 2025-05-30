/* src/components/UI/TrendChart.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Lock } from 'lucide-react';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { fetchAggregateTrends } from '@/utils/analyticsUtils';

const PERIOD_OPTIONS = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '1M' },
    { id: '90d', label: '3M' },
    { id: '1y', label: '1Y' },
];
const CHART_COLOR = "#A78B71";


// Modified TrendChart component with enhanced auth handling
const TrendChart = ({ itemType }) => { // REMOVED: Type hints for props
    const [period, setPeriod] = useState('30d'); // Default period
    const { isAuthenticated, token, user  } = useAuth(); // Get full auth state

    // Log auth state for debugging
    useEffect(() => {
        if (isAuthenticated) {
            logDebug('[TrendChart] User is authenticated, token available:', !!token);
        } else {
            logDebug('[TrendChart] User is not authenticated');
        }
    }, [isAuthenticated, token]);

    // Set up the query using our standardized API authentication approach
    const {
        data: chartData = [], // Default to empty array
        isLoading,
        isError,
        error,
        refetch,
        isFetching, // Used for loading state during refetch
    } = useQuery({ 
        queryKey: ['aggregateItemTrends', itemType, period, isAuthenticated], // No need to include token explicitly
        queryFn: () => fetchAggregateTrends(itemType, period), // Using standardized auth flow without token
        enabled: !!itemType && isAuthenticated, // Only run if user is authenticated
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        placeholderData: [], // Start with empty array placeholder
        retry: 1, // Only retry once for auth issues
        onError: (error) => {
            logError(`[TrendChart] Query error for ${itemType}:`, error);
        },
        onSuccess: (data) => {
            logDebug(`[TrendChart] Query success for ${itemType}:`, data?.length || 0, 'data points');
        }
    });

    // Format date for XAxis labels
    const dateFormatter = (dateStr) => {
        try {
            const date = new Date(dateStr);
            // Check if date is valid before formatting
            return !isNaN(date.getTime())
                ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : dateStr; // Return original string if invalid
        } catch { return dateStr; } // Catch potential errors during Date parsing
    };

    const chartTitle = itemType ? itemType.charAt(0).toUpperCase() + itemType.slice(1) : 'Items';

    // Log data when it updates (for debugging)
    useEffect(() => {
        console.log(`[TrendChart] Data updated (type: ${itemType}, period: ${period}):`, chartData);
        if (chartData && chartData.length > 0) {
            console.log('[TrendChart] Sample data point:', chartData[0]);
        }
    }, [chartData, itemType, period]);

    // Determine combined loading state
    const showLoading = isLoading || isFetching;

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-100 min-h-[300px] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#A78B71]" />
                    Aggregate Engagement Trends: {chartTitle}
                </h3>
                {isAuthenticated ? (
                <div className="flex gap-1 flex-shrink-0">
                    {PERIOD_OPTIONS.map(option => (
                        <Button
                            key={option.id}
                            variant={period === option.id ? 'filled' : 'outlined'}
                            size="sm"
                            onClick={() => setPeriod(option.id)}
                            className={period === option.id ? 'bg-[#A78B71] text-white' : 'text-gray-600'}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
                ) : (
                <div className="flex items-center text-gray-500">
                    <Lock size={16} className="mr-1" />
                    <span className="text-sm">Login to view trends</span>
                </div>
                )}
            </div>

            {/* Chart Area or Status Message */}
            <div className="flex-grow h-[250px] w-full">
                {!isAuthenticated ? (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-md">
                        <Lock size={32} className="text-gray-400 mb-2" />
                        <p className="text-gray-600 text-center mb-1">Login to view trend analytics</p>
                        <p className="text-gray-500 text-xs text-center max-w-xs">Engagement trends are available to authenticated users</p>
                    </div>
                ) : (
                    <>
                        {showLoading && <LoadingSpinner message={`Loading ${chartTitle} trend data...`} />}

                        {isError && !showLoading && (
                            <ErrorMessage
                                message={error?.message || `Could not load ${chartTitle} trend data.`}
                                onRetry={refetch}
                                isLoadingRetry={isFetching}
                                containerClassName="h-full flex flex-col items-center justify-center"
                            />
                        )}

                        {!showLoading && !isError && (!chartData || chartData.length === 0) && (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-sm">No engagement data available for {chartTitle} in this period.</p>
                            </div>
                        )}
                        
                        {!showLoading && !isError && chartData && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
                                    <XAxis dataKey="date" tickFormatter={dateFormatter} style={{ fontSize: '0.65rem' }} tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={10}/>
                                    <YAxis allowDecimals={false} style={{ fontSize: '0.65rem' }} tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35}/>
                                    <Tooltip
                                        contentStyle={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                                        labelFormatter={dateFormatter}
                                        formatter={(value/*REMOVED:, name, props*/) => [`${value} Total`, null]} // Simplify formatter
                                        labelStyle={{ marginBottom: '4px', fontWeight: 'bold' }}
                                        wrapperClassName="!border !border-gray-200 !shadow-lg !rounded-md !bg-white/90"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total_engagements" // Use the aggregate key
                                        stroke={CHART_COLOR}
                                        fillOpacity={1}
                                        fill="url(#chartGradient)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 1, fill: '#fff', stroke: CHART_COLOR }}
                                        name="Total Engagements" // Update tooltip name
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TrendChart;