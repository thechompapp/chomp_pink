// src/pages/AdminPanel/AdminAnalyticsSummary.jsx
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import { BarChart, Store, Utensils, List, Users, Loader2, CheckCircle, XCircle, FileText, PieChart, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import useComponentError from '@/hooks/useComponentError';

// --- REMOVED: TypeScript interfaces ---

// --- Fetcher Functions ---
const fetchAnalyticsSummary = async () => { // REMOVED: : Promise<SummaryData>
  // console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`); // Optional log
  const endpoint = `/api/analytics/summary`;
  const response = await apiClient(endpoint, `Admin Fetch Analytics Summary`); // REMOVED: Generics
  // Basic JS check
  if (!response?.success || typeof response?.data !== 'object' || response.data === null) {
    throw new Error(response?.error || 'Failed to fetch or parse summary data');
  }
  return response.data ?? {};
};

const fetchSubmissionStats = async () => { // REMOVED: : Promise<SubmissionStats>
  // console.log(`[AdminAnalyticsSummary] Fetching submission stats...`); // Optional log
  const endpoint = `/api/analytics/submissions`;
  const response = await apiClient(endpoint, `Admin Fetch Submission Stats`); // REMOVED: Generics
   if (!response?.success || typeof response?.data !== 'object' || response.data === null) {
      throw new Error(response?.error || 'Failed to fetch or parse submission stats');
    }
  return response.data ?? { pending: 0, approved: 0, rejected: 0 };
};

const fetchContentDistribution = async () => { // REMOVED: : Promise<ContentDistribution>
  // console.log(`[AdminAnalyticsSummary] Fetching content distribution...`); // Optional log
  const endpoint = `/api/analytics/content-distribution`;
  const response = await apiClient(endpoint, `Admin Fetch Content Distribution`); // REMOVED: Generics
   if (!response?.success || typeof response?.data !== 'object' || response.data === null) {
       throw new Error(response?.error || 'Failed to fetch or parse content distribution');
   }
  return response.data ?? { byCity: [], byCuisine: [] };
};

const fetchUserMetrics = async () => { // REMOVED: : Promise<UserMetrics>
  // console.log(`[AdminAnalyticsSummary] Fetching user metrics...`); // Optional log
  const endpoint = `/api/analytics/users`;
  const response = await apiClient(endpoint, `Admin Fetch User Metrics`); // REMOVED: Generics
  if (!response?.success || typeof response?.data !== 'object' || response.data === null) {
       throw new Error(response?.error || 'Failed to fetch or parse user metrics');
   }
  return response.data ?? { activeUsers: 0, newUsersLastPeriod: 0 };
};

// Memoized stat card component
const StatCard = memo(({ label, value, IconComponent }) => {
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
});

StatCard.displayName = 'StatCard';

// Memoized distribution table component
const DistributionTable = memo(({ title, data = [], keyField, valueField }) => (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
      <PieChart size={20} className="text-[#A78B71]" />
      {title}
    </h3>
    {data.length === 0 ? (
      <p className="text-sm text-gray-500 text-center py-4">No data available.</p>
    ) : (
      <div className="overflow-x-auto max-h-60">
        <table className="w-full text-sm text-gray-600 min-w-[250px]">
          <thead>
            <tr className="border-b sticky top-0 bg-gray-50">
              <th className="text-left py-2 px-2 font-medium">{keyField}</th>
              <th className="text-right py-2 px-2 font-medium">{valueField}</th>
            </tr>
          </thead>
          {/* Ensure no whitespace directly inside tbody */}
          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${keyField}-${item?.[keyField] || index}`} // Safer key access
                className="border-b last:border-b-0 hover:bg-gray-100"
              >
                <td className="py-2 px-2 truncate">{item?.[keyField]}</td>
                <td className="text-right py-2 px-2">{item?.[valueField]?.toLocaleString() ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
));

DistributionTable.displayName = 'DistributionTable';

const AdminAnalyticsSummary = () => { // Removed : React.FC
  // Use error handling hook
  const { handleError } = useComponentError({ 
    componentName: 'AdminAnalyticsSummary',
    showToast: true
  });

  // Extract only what we need from auth store
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // UseQuery with memoized query keys
  const summaryQuery = useQuery({
    queryKey: ['adminAnalyticsSummary'],
    queryFn: fetchAnalyticsSummary,
    enabled: isAuthenticated && !authLoading,
    onError: (error) => handleError(error, 'fetchAnalyticsSummary')
  });

  const submissionQuery = useQuery({
    queryKey: ['submissionStats'],
    queryFn: fetchSubmissionStats,
    enabled: isAuthenticated && !authLoading,
    onError: (error) => handleError(error, 'fetchSubmissionStats')
  });

  const contentQuery = useQuery({
    queryKey: ['contentDistribution'],
    queryFn: fetchContentDistribution,
    enabled: isAuthenticated && !authLoading,
    onError: (error) => handleError(error, 'fetchContentDistribution')
  });

  const usersQuery = useQuery({
    queryKey: ['userMetrics'],
    queryFn: fetchUserMetrics,
    enabled: isAuthenticated && !authLoading,
    onError: (error) => handleError(error, 'fetchUserMetrics')
  });

  // Memoize derived state
  const loadingAndErrorState = useMemo(() => {
    const isLoadingInitial = 
      summaryQuery.isLoading || 
      submissionQuery.isLoading || 
      contentQuery.isLoading || 
      usersQuery.isLoading || 
      authLoading;

    const queryError = 
      summaryQuery.error || 
      submissionQuery.error || 
      contentQuery.error || 
      usersQuery.error;
      
    const isFetching = 
      summaryQuery.isFetching || 
      submissionQuery.isFetching || 
      contentQuery.isFetching || 
      usersQuery.isFetching;
      
    return { isLoadingInitial, queryError, isFetching };
  }, [
    summaryQuery.isLoading, submissionQuery.isLoading,
    contentQuery.isLoading, usersQuery.isLoading,
    summaryQuery.error, submissionQuery.error,
    contentQuery.error, usersQuery.error,
    summaryQuery.isFetching, submissionQuery.isFetching,
    contentQuery.isFetching, usersQuery.isFetching,
    authLoading
  ]);

  // Memoize data objects to prevent unnecessary re-rendering
  const analyticsData = useMemo(() => {
    return {
      summaryData: summaryQuery.data ?? {},
      submissionStats: submissionQuery.data ?? { pending: 0, approved: 0, rejected: 0 },
      contentDistribution: contentQuery.data ?? { byCity: [], byCuisine: [] },
      userMetrics: usersQuery.data ?? { activeUsers: 0, newUsersLastPeriod: 0 }
    };
  }, [
    summaryQuery.data,
    submissionQuery.data,
    contentQuery.data,
    usersQuery.data
  ]);

  // Memoize the refetch function
  const refetchAll = useCallback(() => {
    summaryQuery.refetch();
    submissionQuery.refetch();
    contentQuery.refetch();
    usersQuery.refetch();
  }, [summaryQuery, submissionQuery, contentQuery, usersQuery]);

  // Destructure once from memoized objects
  const { isLoadingInitial, queryError, isFetching } = loadingAndErrorState;
  const { summaryData, submissionStats, contentDistribution, userMetrics } = analyticsData;

  if (isLoadingInitial) {
    return <LoadingSpinner message="Loading summary analytics..." />;
  }

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

  return (
    <div className="space-y-6">
      {/* Site Summary Card */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <BarChart size={20} className="text-[#A78B71]" /> Site Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Restaurants" value={summaryData.restaurants} IconComponent={Store} />
          <StatCard label="Total Dishes" value={summaryData.dishes} IconComponent={Utensils} />
          <StatCard label="Total Lists" value={summaryData.lists} IconComponent={List} />
          <StatCard label="Total Users" value={summaryData.users} IconComponent={Users} />
          <StatCard label="Pending Submissions" value={summaryData.pendingSubmissions} IconComponent={Loader2} />
          <StatCard label="Total Engagements" value={summaryData.totalEngagements} IconComponent={CheckSquare} />
        </div>
      </div>

      {/* Submission Stats Card */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <FileText size={20} className="text-[#A78B71]" /> Submission Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Pending" value={submissionStats.pending} IconComponent={Loader2} />
          <StatCard label="Approved" value={submissionStats.approved} IconComponent={CheckCircle} />
          <StatCard label="Rejected" value={submissionStats.rejected} IconComponent={XCircle} />
        </div>
      </div>

      {/* Content Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistributionTable 
          title="Top Restaurants by City" 
          data={contentDistribution.byCity} 
          keyField="city" 
          valueField="count"
        />
        <DistributionTable 
          title="Top Restaurants by Cuisine" 
          data={contentDistribution.byCuisine} 
          keyField="cuisine" 
          valueField="count"
        />
      </div>

      {/* User Metrics Card */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <Users size={20} className="text-[#A78B71]" /> User Metrics (Last {userMetrics.period || 'Period'})
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Active Users" value={userMetrics.activeUsers} IconComponent={Users} />
          <StatCard label="New Users" value={userMetrics.newUsersLastPeriod} IconComponent={Users} />
        </div>
      </div>
    </div>
  );
};

// Export memoized component
export default memo(AdminAnalyticsSummary);