// src/pages/AdminPanel/AdminAnalyticsSummary.jsx
// Renamed internally to reflect its new purpose, but filename kept for simplicity now.
// This component now focuses ONLY on the Site Summary / General Stats section.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { BarChart, Store, Utensils, List, Users, Loader2, CheckCircle, XCircle, FileText, PieChart, CheckSquare } from 'lucide-react';

// Fetcher functions remain specific to this summary view
const fetchAnalyticsSummary = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`);
    const endpoint = `/api/analytics/summary`;
    const response = await apiClient(endpoint, `Admin Fetch Analytics Summary`);
    return response?.data ?? {};
};
const fetchSubmissionStats = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching submission stats...`);
    const endpoint = `/api/analytics/submissions`;
    const response = await apiClient(endpoint, `Admin Fetch Submission Stats`);
    return response?.data ?? { pending: 0, approved: 0, rejected: 0 };
};
const fetchContentDistribution = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching content distribution...`);
    const endpoint = `/api/analytics/content-distribution`;
    const response = await apiClient(endpoint, `Admin Fetch Content Distribution`);
    return response?.data ?? { byCity: [], byCuisine: [] };
};
const fetchUserMetrics = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching user metrics...`);
    const endpoint = `/api/analytics/users`;
    const response = await apiClient(endpoint, `Admin Fetch User Metrics`);
    return response?.data ?? { activeUsers: 0, newUsersLastPeriod: 0 };
};

const AdminAnalyticsSummary = () => {
    // Fetch summary data
    const summaryQuery = useQuery({ queryKey: ['adminAnalyticsSummary'], queryFn: fetchAnalyticsSummary });
    // Fetch submission stats
    const submissionQuery = useQuery({ queryKey: ['submissionStats'], queryFn: fetchSubmissionStats });
    // Fetch content distribution
    const contentQuery = useQuery({ queryKey: ['contentDistribution'], queryFn: fetchContentDistribution });
    // Fetch user metrics
    const usersQuery = useQuery({ queryKey: ['userMetrics'], queryFn: fetchUserMetrics });

    // Combined initial loading state
    const isLoadingInitial = summaryQuery.isLoading || submissionQuery.isLoading || contentQuery.isLoading || usersQuery.isLoading;

    // Combined error state (prioritize summary error)
    const queryError = summaryQuery.error || submissionQuery.error || contentQuery.error || usersQuery.error;
    const isFetching = summaryQuery.isFetching || submissionQuery.isFetching || contentQuery.isFetching || usersQuery.isFetching;
    const refetchAll = () => {
        summaryQuery.refetch();
        submissionQuery.refetch();
        contentQuery.refetch();
        usersQuery.refetch();
    };

    // Render Loading State
    if (isLoadingInitial) {
        return <LoadingSpinner message="Loading summary analytics..." />;
    }

    // Render Error State
    if (queryError) {
        return (
            <ErrorMessage
                message={queryError.message || 'Failed to load some summary analytics data.'}
                onRetry={refetchAll}
                isLoadingRetry={isFetching}
                containerClassName="mt-4"
            />
        );
    }

    // Access data safely
    const summaryData = summaryQuery.data ?? {};
    const submissionStats = submissionQuery.data ?? { pending: 0, approved: 0, rejected: 0 };
    const contentDistribution = contentQuery.data ?? { byCity: [], byCuisine: [] };
    const userMetrics = usersQuery.data ?? { activeUsers: 0, newUsersLastPeriod: 0 };

    // --- Render Helper Functions (Keep as before) ---
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

    const renderDistributionTable = (title, data = [], keyField, valueField) => ( // Add default empty array
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                <PieChart size={20} className="text-[#A78B71]" />{title}
            </h3>
            {(data.length === 0) ? (
                <p className="text-sm text-gray-500 text-center py-4">No data available.</p>
            ) : (
                <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-sm text-gray-600 min-w-[250px]">
                        <thead>
                            <tr className="border-b sticky top-0 bg-gray-50">
                                <th className="text-left py-2 px-2 font-medium">{keyField}</th><th className="text-right py-2 px-2 font-medium">{valueField}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={`${keyField}-${item[keyField] || index}`} className="border-b last:border-b-0 hover:bg-gray-100">
                                    <td className="py-2 px-2 truncate">{item[keyField]}</td><td className="text-right py-2 px-2">{item[valueField]?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
    // --- End Render Helper Functions ---

    return (
        <div className="space-y-6">
            {/* Site Summary Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <BarChart size={20} className="text-[#A78B71]" />Site Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderStatCard("Total Restaurants", summaryData.restaurants, Store)}
                    {renderStatCard("Total Dishes", summaryData.dishes, Utensils)}
                    {renderStatCard("Total Lists", summaryData.lists, List)}
                    {renderStatCard("Total Users", summaryData.users, Users)}
                    {renderStatCard("Pending Submissions", summaryData.pendingSubmissions, Loader2)}
                    {renderStatCard("Total Engagements", summaryData.totalEngagements, CheckSquare)}
                </div>
            </div>

            {/* Submission Stats Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <FileText size={20} className="text-[#A78B71]" />Submission Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    {renderStatCard("Pending", submissionStats.pending, Loader2)}
                    {renderStatCard("Approved", submissionStats.approved, CheckCircle)}
                    {renderStatCard("Rejected", submissionStats.rejected, XCircle)}
                </div>
            </div>

            {/* Content Distribution Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {renderDistributionTable("Top Restaurants by City", contentDistribution.byCity, "city", "count")}
                 {renderDistributionTable("Top Restaurants by Cuisine", contentDistribution.byCuisine, "cuisine", "count")}
            </div>

            {/* User Metrics Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Users size={20} className="text-[#A78B71]" />User Metrics (Last {userMetrics.period || 'Period'})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {renderStatCard("Active Users", userMetrics.activeUsers, Users)}
                    {renderStatCard("New Users", userMetrics.newUsersLastPeriod, Users)}
                </div>
            </div>
             {/* Note: Engagement Details moved to AdminEngagementAnalytics */}
        </div>
    );
};

export default AdminAnalyticsSummary;