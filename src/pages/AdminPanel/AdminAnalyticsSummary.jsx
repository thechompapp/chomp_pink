// src/pages/AdminPanel/AdminAnalyticsSummary.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button'; // Added for retry consistency
import { BarChart, Store, Utensils, List, Users, Loader, CheckCircle, XCircle, FileText, PieChart, Activity, CheckSquare } from 'lucide-react';

// Fetcher function for analytics summary
const fetchAnalyticsSummary = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`);
    const endpoint = `/api/analytics/summary`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch Analytics Summary`);
        return (typeof data === 'object' && data !== null) ? data : {};
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching analytics summary:`, error);
        throw new Error(error.message || `Failed to load analytics summary`);
    }
};

// Fetcher function for submission stats
const fetchSubmissionStats = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching submission stats...`);
    const endpoint = `/api/analytics/submissions`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch Submission Stats`);
        return (typeof data === 'object' && data !== null) ? data : { pending: 0, approved: 0, rejected: 0 };
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching submission stats:`, error);
        throw new Error(error.message || `Failed to load submission stats`);
    }
};

// Fetcher function for content distribution
const fetchContentDistribution = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching content distribution...`);
    const endpoint = `/api/analytics/content-distribution`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch Content Distribution`);
        return (typeof data === 'object' && data !== null) ? data : { byCity: [], byCuisine: [] };
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching content distribution:`, error);
        throw new Error(error.message || `Failed to load content distribution`);
    }
};

// Fetcher function for user metrics
const fetchUserMetrics = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching user metrics...`);
    const endpoint = `/api/analytics/users`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch User Metrics`);
        return (typeof data === 'object' && data !== null) ? data : { activeUsers: 0, newUsersLast30Days: 0 };
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching user metrics:`, error);
        throw new Error(error.message || `Failed to load user metrics`);
    }
};

// Fetcher function for engagement details
const fetchEngagementDetails = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching engagement details...`);
    const endpoint = `/api/analytics/engagements`;
    try {
        const data = await apiClient(endpoint, `Admin Fetch Engagement Details`);
        return (typeof data === 'object' && data !== null) ? data : { views: 0, clicks: 0, adds: 0, shares: 0 };
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching engagement details:`, error);
        throw new Error(error.message || `Failed to load engagement details`);
    }
};

const AdminAnalyticsSummary = () => {
    // Fetch summary data
    const {
        data: summaryData,
        isLoading: isLoadingSummary,
        isError: isErrorSummary,
        error: errorSummary,
        refetch: refetchSummary
    } = useQuery({
        queryKey: ['adminAnalyticsSummary'],
        queryFn: fetchAnalyticsSummary,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: {},
    });

    // Fetch submission stats
    const {
        data: submissionStats,
        isLoading: isLoadingSubmissions,
        isError: isErrorSubmissions,
        error: errorSubmissions,
        refetch: refetchSubmissions
    } = useQuery({
        queryKey: ['submissionStats'],
        queryFn: fetchSubmissionStats,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: { pending: 0, approved: 0, rejected: 0 },
    });

    // Fetch content distribution
    const {
        data: contentDistribution,
        isLoading: isLoadingContent,
        isError: isErrorContent,
        error: errorContent,
        refetch: refetchContent
    } = useQuery({
        queryKey: ['contentDistribution'],
        queryFn: fetchContentDistribution,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: { byCity: [], byCuisine: [] },
    });

    // Fetch user metrics
    const {
        data: userMetrics,
        isLoading: isLoadingUsers,
        isError: isErrorUsers,
        error: errorUsers,
        refetch: refetchUsers
    } = useQuery({
        queryKey: ['userMetrics'],
        queryFn: fetchUserMetrics,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: { activeUsers: 0, newUsersLast30Days: 0 },
    });

    // Fetch engagement details
    const {
        data: engagementDetails,
        isLoading: isLoadingEngagements,
        isError: isErrorEngagements,
        error: errorEngagements,
        refetch: refetchEngagements
    } = useQuery({
        queryKey: ['engagementDetails'],
        queryFn: fetchEngagementDetails,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: { views: 0, clicks: 0, adds: 0, shares: 0 },
    });

    // Combined loading state
    const isLoading = isLoadingSummary || isLoadingSubmissions || isLoadingContent || isLoadingUsers || isLoadingEngagements;

    // Render Loading State
    if (isLoading) {
        return <LoadingSpinner message="Loading analytics summary..." />;
    }

    // Render Error State (prioritize summary error)
    if (isErrorSummary) {
        return (
            <ErrorMessage
                message={errorSummary?.message || 'Failed to load main analytics summary.'}
                onRetry={refetchSummary}
                isLoadingRetry={isLoadingSummary}
                containerClassName="mt-4"
            />
        );
    }

    // Render Stat Card Helper
    const renderStatCard = (label, value, IconComponent) => {
        // *** FIX APPLIED HERE ***
        // Check if value is a valid number before formatting
        const displayValue = typeof value === 'number' && !isNaN(value)
            ? value.toLocaleString()
            : 'N/A'; // Display 'N/A' if value is not a valid number
        // *** END FIX ***

        return (
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center transition hover:shadow-md">
                <div className="flex justify-center items-center text-gray-500 mb-2">
                    {IconComponent && <IconComponent size={18} className="mr-2" />}
                    <p className="text-sm font-medium">{label}</p>
                </div>
                <p className="text-2xl font-bold text-[#A78B71]">
                    {/* Render the validated displayValue */}
                    {displayValue}
                </p>
            </div>
        );
    };


    // Render Table for Content Distribution
    const renderDistributionTable = (title, data, keyField, valueField) => (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                <PieChart size={20} className="text-[#A78B71]" />
                {title}
            </h3>
            {data.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No data available.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-600 min-w-[250px]">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-2">{keyField}</th>
                                <th className="text-right py-2 px-2">{valueField}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-100">
                                    <td className="py-2 px-2 truncate">{item[keyField]}</td>
                                    <td className="text-right py-2 px-2">{item[valueField]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
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

            {/* Submission Stats Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <FileText size={20} className="text-[#A78B71]" />
                    Submission Stats
                </h3>
                {isErrorSubmissions ? (
                    <ErrorMessage
                        message={errorSubmissions?.message || 'Failed to load submission stats.'}
                        onRetry={refetchSubmissions}
                        isLoadingRetry={isLoadingSubmissions}
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {renderStatCard("Pending", submissionStats?.pending, Loader)}
                        {renderStatCard("Approved", submissionStats?.approved, CheckCircle)}
                        {renderStatCard("Rejected", submissionStats?.rejected, XCircle)}
                    </div>
                )}
            </div>

            {/* Content Distribution Section */}
            {isErrorContent ? (
                <ErrorMessage
                    message={errorContent?.message || 'Failed to load content distribution.'}
                    onRetry={refetchContent}
                    isLoadingRetry={isLoadingContent}
                    containerClassName="py-4"
                />
            ) : (
                <>
                    {renderDistributionTable("Restaurants by City", contentDistribution?.byCity || [], "city", "count")}
                    {renderDistributionTable("Restaurants by Cuisine", contentDistribution?.byCuisine || [], "cuisine", "count")}
                </>
            )}

            {/* User Metrics Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Users size={20} className="text-[#A78B71]" />
                    User Metrics
                </h3>
                {isErrorUsers ? (
                    <ErrorMessage
                        message={errorUsers?.message || 'Failed to load user metrics.'}
                        onRetry={refetchUsers}
                        isLoadingRetry={isLoadingUsers}
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {renderStatCard("Active Users (30d)", userMetrics?.activeUsers, Users)}
                        {renderStatCard("New Users (30d)", userMetrics?.newUsersLast30Days, Users)}
                    </div>
                )}
            </div>

            {/* Engagement Details Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Activity size={20} className="text-[#A78B71]" />
                    Engagement Details (Total)
                </h3>
                {isErrorEngagements ? (
                    <ErrorMessage
                        message={errorEngagements?.message || 'Failed to load engagement details.'}
                        onRetry={refetchEngagements}
                        isLoadingRetry={isLoadingEngagements}
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderStatCard("Views", engagementDetails?.views, Activity)}
                        {renderStatCard("Clicks", engagementDetails?.clicks, Activity)}
                        {renderStatCard("Adds to Lists", engagementDetails?.adds, Activity)}
                        {renderStatCard("Shares", engagementDetails?.shares, Activity)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalyticsSummary;