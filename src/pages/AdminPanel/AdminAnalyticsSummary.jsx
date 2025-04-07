// src/pages/AdminPanel/AdminAnalyticsSummary.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient'; // Use alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use alias
import { BarChart, Store, Utensils, List, Users, Loader, CheckSquare } from 'lucide-react'; // Import relevant icons

// Fetcher function specifically for analytics summary
const fetchAnalyticsSummary = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`);
    const endpoint = `/api/analytics/summary`; // Backend endpoint defined previously
    try {
        const data = await apiClient(endpoint, `Admin Fetch Analytics Summary`);
        // Ensure data is an object, default to empty if not
        return (typeof data === 'object' && data !== null) ? data : {};
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching analytics summary:`, error);
        // Re-throw the error so React Query can handle it
        throw new Error(error.message || `Failed to load analytics summary`);
    }
};

const AdminAnalyticsSummary = () => {
    // Use React Query to fetch the summary data
    const {
        data: summaryData,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['adminAnalyticsSummary'], // Unique key for this query
        queryFn: fetchAnalyticsSummary,
        staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
        refetchOnWindowFocus: false, // Don't refetch just on window focus
        placeholderData: {}, // Start with an empty object as placeholder
    });

    // Render Loading State
    if (isLoading) {
        return <LoadingSpinner message="Loading analytics summary..." />;
    }

    // Render Error State
    if (isError) {
        return <ErrorMessage
                    message={error?.message || 'Failed to load analytics summary.'}
                    onRetry={refetch}
                    isLoadingRetry={isLoading}
                    containerClassName="mt-4"
               />;
    }

    // Render Summary Data
    // Use helper for consistent display and handling of potentially missing data
    const renderStatCard = (label, value, IconComponent) => (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center transition hover:shadow-md">
            <div className="flex justify-center items-center text-gray-500 mb-2">
                {IconComponent && <IconComponent size={18} className="mr-2" />}
                <p className="text-sm font-medium ">{label}</p>
            </div>
            <p className="text-2xl font-bold text-[#A78B71]">
                {typeof value === 'number' ? value.toLocaleString() : 'N/A'}
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Site Summary Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <BarChart size={20} className="text-[#A78B71]" />
                    Site Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderStatCard("Total Restaurants", summaryData?.restaurants, Store)}
                    {renderStatCard("Total Dishes", summaryData?.dishes, Utensils)}
                    {renderStatCard("Total Lists", summaryData?.lists, List)}
                    {renderStatCard("Total Users", summaryData?.users, Users)}
                    {renderStatCard("Pending Submissions", summaryData?.pendingSubmissions, Loader)}
                    {renderStatCard("Total Engagements", summaryData?.totalEngagements, CheckSquare)}
                </div>
            </div>

            {/* Placeholder for future analytics sections */}
            {/*
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Submission Stats</h3>
                <p className="text-sm text-gray-500 text-center py-4">(Submission breakdown chart/table coming soon)</p>
            </div>

             <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Content Distribution</h3>
                <p className="text-sm text-gray-500 text-center py-4">(Content distribution chart/table coming soon)</p>
            </div>
            */}

        </div>
    );
};

export default AdminAnalyticsSummary;