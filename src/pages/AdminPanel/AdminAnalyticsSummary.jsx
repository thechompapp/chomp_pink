// src/pages/AdminPanel/AdminAnalyticsSummary.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient'; // Use global import alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use global import alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use global import alias
import Button from '@/components/Button'; // Added for retry consistency
import { BarChart, Store, Utensils, List, Users, Loader2, CheckCircle, XCircle, FileText, PieChart, Activity, CheckSquare } from 'lucide-react'; // Use Loader2

// Fetcher function for analytics summary
const fetchAnalyticsSummary = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`);
    const endpoint = `/api/analytics/summary`;
    try {
        // Expecting { data: SummaryData }
        const response = await apiClient(endpoint, `Admin Fetch Analytics Summary`);
        const data = response?.data; // Extract data from response
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
        // Expecting { data: SubmissionStats }
        const response = await apiClient(endpoint, `Admin Fetch Submission Stats`);
        const data = response?.data; // Extract data
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
        // Expecting { data: ContentDistribution }
        const response = await apiClient(endpoint, `Admin Fetch Content Distribution`);
        const data = response?.data; // Extract data
        return (typeof data === 'object' && data !== null) ? data : { byCity: [], byCuisine: [] };
    } catch (error) {
        console.error(`[AdminAnalyticsSummary] Error fetching content distribution:`, error);
        throw new Error(error.message || `Failed to load content distribution`);
    }
};

// Fetcher function for user metrics
const fetchUserMetrics = async () => {
    console.log(`[AdminAnalyticsSummary] Fetching user metrics...`);
    const endpoint = `/api/analytics/users`; // Assuming default period or add query param if needed
    try {
        // Expecting { data: UserMetrics }
        const response = await apiClient(endpoint, `Admin Fetch User Metrics`);
        const data = response?.data; // Extract data
        return (typeof data === 'object' && data !== null) ? data : { activeUsers: 0, newUsersLastPeriod: 0 }; // Adjusted key based on model
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
        // Expecting { data: EngagementDetails }
        const response = await apiClient(endpoint, `Admin Fetch Engagement Details`);
        const data = response?.data; // Extract data
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
        isFetching: isFetchingSummary, // Use isFetching for retry loading state
        isError: isErrorSummary,
        error: errorSummary,
        refetch: refetchSummary
    } = useQuery({
        queryKey: ['adminAnalyticsSummary'],
        queryFn: fetchAnalyticsSummary,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: {}, // Keep empty placeholder
    });

    // Fetch submission stats
    const {
        data: submissionStats,
        isLoading: isLoadingSubmissions,
        isFetching: isFetchingSubmissions,
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
        isFetching: isFetchingContent,
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
        isFetching: isFetchingUsers,
        isError: isErrorUsers,
        error: errorUsers,
        refetch: refetchUsers
    } = useQuery({
        queryKey: ['userMetrics'],
        queryFn: fetchUserMetrics,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        placeholderData: { activeUsers: 0, newUsersLastPeriod: 0 },
    });

    // Fetch engagement details
    const {
        data: engagementDetails,
        isLoading: isLoadingEngagements,
        isFetching: isFetchingEngagements,
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

    // Combined initial loading state (only show full spinner on first load)
    const isLoadingInitial = isLoadingSummary || isLoadingSubmissions || isLoadingContent || isLoadingUsers || isLoadingEngagements;

    // Render Loading State
    if (isLoadingInitial) {
        return <LoadingSpinner message="Loading analytics summary..." />;
    }

    // Render Error State (prioritize summary error)
    if (isErrorSummary) {
        return (
            <ErrorMessage
                message={errorSummary?.message || 'Failed to load main analytics summary.'}
                onRetry={refetchSummary} // Corrected variable name
                isLoadingRetry={isFetchingSummary} // Use isFetching for retry spinner state
                containerClassName="mt-4"
            />
        );
    }

    // Render Stat Card Helper
    const renderStatCard = (label, value, IconComponent) => {
        // Check if value is a number and not null/undefined before formatting
        const displayValue = (typeof value === 'number' && !isNaN(value))
            ? value.toLocaleString()
            : (value ?? 'N/A'); // Display original value if not number (e.g., string 'N/A'), default to 'N/A'

        return (
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center transition hover:shadow-md">
                <div className="flex justify-center items-center text-gray-500 mb-2">
                    {IconComponent && <IconComponent size={18} className="mr-2 flex-shrink-0" />}
                    <p className="text-sm font-medium truncate">{label}</p>
                </div>
                <p className="text-2xl font-bold text-[#A78B71]">
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
            {(!data || data.length === 0) ? ( // Check if data array is empty or undefined
                <p className="text-sm text-gray-500 text-center py-4">No data available.</p>
            ) : (
                <div className="overflow-x-auto max-h-60"> {/* Added max-height and scroll */}
                    <table className="w-full text-sm text-gray-600 min-w-[250px]">
                        <thead>
                            <tr className="border-b sticky top-0 bg-gray-50">
                                {/* FIX: Ensure no whitespace within the TR */}
                                <th className="text-left py-2 px-2 font-medium">{keyField}</th><th className="text-right py-2 px-2 font-medium">{valueField}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={`${keyField}-${item[keyField] || index}`} className="border-b last:border-b-0 hover:bg-gray-100">
                                    {/* FIX: Ensure no whitespace within the TR */}
                                    <td className="py-2 px-2 truncate">{item[keyField]}</td><td className="text-right py-2 px-2">{item[valueField]?.toLocaleString()}</td>
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
                {/* Use optional chaining and nullish coalescing for safety */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderStatCard("Total Restaurants", summaryData?.restaurants ?? 0, Store)}
                    {renderStatCard("Total Dishes", summaryData?.dishes ?? 0, Utensils)}
                    {renderStatCard("Total Lists", summaryData?.lists ?? 0, List)}
                    {renderStatCard("Total Users", summaryData?.users ?? 0, Users)}
                    {renderStatCard("Pending Submissions", summaryData?.pendingSubmissions ?? 0, Loader2)}
                    {renderStatCard("Total Engagements", summaryData?.totalEngagements ?? 0, CheckSquare)}
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
                        isLoadingRetry={isFetchingSubmissions} // Use isFetching
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {renderStatCard("Pending", submissionStats?.pending ?? 0, Loader2)}
                        {renderStatCard("Approved", submissionStats?.approved ?? 0, CheckCircle)}
                        {renderStatCard("Rejected", submissionStats?.rejected ?? 0, XCircle)}
                    </div>
                )}
            </div>

            {/* Content Distribution Section */}
            {isErrorContent ? (
                <ErrorMessage
                    message={errorContent?.message || 'Failed to load content distribution.'}
                    onRetry={refetchContent}
                    isLoadingRetry={isFetchingContent} // Use isFetching
                    containerClassName="py-4"
                />
            ) : (
                 // Add checks for data existence before rendering tables
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contentDistribution?.byCity && renderDistributionTable("Restaurants by City", contentDistribution.byCity, "city", "count")}
                    {contentDistribution?.byCuisine && renderDistributionTable("Restaurants by Cuisine", contentDistribution.byCuisine, "cuisine", "count")}
                </div>
            )}

            {/* User Metrics Section */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Users size={20} className="text-[#A78B71]" />
                    User Metrics (Last {userMetrics?.period || 'Period'}) {/* Display period */}
                </h3>
                {isErrorUsers ? (
                    <ErrorMessage
                        message={errorUsers?.message || 'Failed to load user metrics.'}
                        onRetry={refetchUsers}
                        isLoadingRetry={isFetchingUsers} // Use isFetching
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {renderStatCard("Active Users", userMetrics?.activeUsers ?? 0, Users)}
                        {renderStatCard("New Users", userMetrics?.newUsersLastPeriod ?? 0, Users)}
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
                        isLoadingRetry={isFetchingEngagements} // Use isFetching
                        containerClassName="py-4"
                    />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderStatCard("Views", engagementDetails?.views ?? 0, Activity)}
                        {renderStatCard("Clicks", engagementDetails?.clicks ?? 0, Activity)}
                        {renderStatCard("Adds to Lists", engagementDetails?.adds ?? 0, Activity)}
                        {renderStatCard("Shares", engagementDetails?.shares ?? 0, Activity)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalyticsSummary;