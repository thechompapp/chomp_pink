// src/pages/AdminPanel/AdminAnalyticsSummary.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { BarChart, Store, Utensils, List, Users, Loader2, CheckCircle, XCircle, FileText, PieChart, CheckSquare } from 'lucide-react';
import useAuthStore from '@/stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';

// --- Types ---
interface SummaryData {
  restaurants?: number;
  dishes?: number;
  lists?: number;
  users?: number;
  pendingSubmissions?: number;
  totalEngagements?: number;
}

interface SubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
}

interface ContentDistribution {
  byCity: { city: string; count: number }[];
  byCuisine: { cuisine: string; count: number }[];
}

interface UserMetrics {
  activeUsers: number;
  newUsersLastPeriod: number;
  period?: string;
}

// --- Fetcher Functions ---
const fetchAnalyticsSummary = async (): Promise<SummaryData> => {
  console.log(`[AdminAnalyticsSummary] Fetching analytics summary...`);
  const endpoint = `/api/analytics/summary`;
  const response = await apiClient<{ data: SummaryData }>(endpoint, `Admin Fetch Analytics Summary`);
  return response?.data ?? {};
};

const fetchSubmissionStats = async (): Promise<SubmissionStats> => {
  console.log(`[AdminAnalyticsSummary] Fetching submission stats...`);
  const endpoint = `/api/analytics/submissions`;
  const response = await apiClient<{ data: SubmissionStats }>(endpoint, `Admin Fetch Submission Stats`);
  return response?.data ?? { pending: 0, approved: 0, rejected: 0 };
};

const fetchContentDistribution = async (): Promise<ContentDistribution> => {
  console.log(`[AdminAnalyticsSummary] Fetching content distribution...`);
  const endpoint = `/api/analytics/content-distribution`;
  const response = await apiClient<{ data: ContentDistribution }>(endpoint, `Admin Fetch Content Distribution`);
  return response?.data ?? { byCity: [], byCuisine: [] };
};

const fetchUserMetrics = async (): Promise<UserMetrics> => {
  console.log(`[AdminAnalyticsSummary] Fetching user metrics...`);
  const endpoint = `/api/analytics/users`;
  const response = await apiClient<{ data: UserMetrics }>(endpoint, `Admin Fetch User Metrics`);
  return response?.data ?? { activeUsers: 0, newUsersLastPeriod: 0 };
};

const AdminAnalyticsSummary: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    }))
  );

  const summaryQuery = useQuery<SummaryData, Error>({
    queryKey: ['adminAnalyticsSummary'],
    queryFn: fetchAnalyticsSummary,
    enabled: isAuthenticated && !authLoading,
  });

  const submissionQuery = useQuery<SubmissionStats, Error>({
    queryKey: ['submissionStats'],
    queryFn: fetchSubmissionStats,
    enabled: isAuthenticated && !authLoading,
  });

  const contentQuery = useQuery<ContentDistribution, Error>({
    queryKey: ['contentDistribution'],
    queryFn: fetchContentDistribution,
    enabled: isAuthenticated && !authLoading,
  });

  const usersQuery = useQuery<UserMetrics, Error>({
    queryKey: ['userMetrics'],
    queryFn: fetchUserMetrics,
    enabled: isAuthenticated && !authLoading,
  });

  const isLoadingInitial =
    summaryQuery.isLoading || submissionQuery.isLoading || contentQuery.isLoading || usersQuery.isLoading || authLoading;

  const queryError = summaryQuery.error || submissionQuery.error || contentQuery.error || usersQuery.error;
  const isFetching = summaryQuery.isFetching || submissionQuery.isFetching || contentQuery.isFetching || usersQuery.isFetching;

  const refetchAll = () => {
    summaryQuery.refetch();
    submissionQuery.refetch();
    contentQuery.refetch();
    usersQuery.refetch();
  };

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

  const summaryData = summaryQuery.data ?? {};
  const submissionStats = submissionQuery.data ?? { pending: 0, approved: 0, rejected: 0 };
  const contentDistribution = contentQuery.data ?? { byCity: [], byCuisine: [] };
  const userMetrics = usersQuery.data ?? { activeUsers: 0, newUsersLastPeriod: 0 };

  const renderStatCard = (label: string, value: number | undefined, IconComponent: React.ComponentType<any>) => {
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
  };

  const renderDistributionTable = (
    title: string,
    data: { [key: string]: any }[] = [],
    keyField: string,
    valueField: string
  ) => (
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
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={`${keyField}-${item[keyField] || index}`}
                  className="border-b last:border-b-0 hover:bg-gray-100"
                >
                  <td className="py-2 px-2 truncate">{item[keyField]}</td>
                  <td className="text-right py-2 px-2">{item[valueField]?.toLocaleString()}</td>
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
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <BarChart size={20} className="text-[#A78B71]" /> Site Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderStatCard('Total Restaurants', summaryData.restaurants, Store)}
          {renderStatCard('Total Dishes', summaryData.dishes, Utensils)}
          {renderStatCard('Total Lists', summaryData.lists, List)}
          {renderStatCard('Total Users', summaryData.users, Users)}
          {renderStatCard('Pending Submissions', summaryData.pendingSubmissions, Loader2)}
          {renderStatCard('Total Engagements', summaryData.totalEngagements, CheckSquare)}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <FileText size={20} className="text-[#A78B71]" /> Submission Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {renderStatCard('Pending', submissionStats.pending, Loader2)}
          {renderStatCard('Approved', submissionStats.approved, CheckCircle)}
          {renderStatCard('Rejected', submissionStats.rejected, XCircle)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderDistributionTable('Top Restaurants by City', contentDistribution.byCity, 'city', 'count')}
        {renderDistributionTable('Top Restaurants by Cuisine', contentDistribution.byCuisine, 'cuisine', 'count')}
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <Users size={20} className="text-[#A78B71]" /> User Metrics (Last {userMetrics.period || 'Period'})
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {renderStatCard('Active Users', userMetrics.activeUsers, Users)}
          {renderStatCard('New Users', userMetrics.newUsersLastPeriod, Users)}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsSummary;