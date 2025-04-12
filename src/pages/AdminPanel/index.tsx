// src/pages/AdminPanel/index.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import apiClient from '@/services/apiClient';
import { adminService } from '@/services/adminService';
import AdminTable from './AdminTable';
import AdminAnalyticsSummary from './AdminAnalyticsSummary';
import AdminEngagementAnalytics from './AdminEngagementAnalytics';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select from '@/components/UI/Select';
import { Activity, BarChart, Database, FileText, Hash, List, Store, Utensils, User, Filter, Search, ChevronLeft, ChevronRight, Map } from 'lucide-react';

// --- Types ---
interface City {
  id: number;
  name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminDataResponse<T> {
  data: T[];
  pagination: Pagination;
}

// --- Config ---
const TAB_CONFIG = {
  analytics: { label: 'Analytics', Icon: BarChart },
  submissions: { label: 'Submissions', Icon: FileText },
  restaurants: { label: 'Restaurants', Icon: Store },
  dishes: { label: 'Dishes', Icon: Utensils },
  neighborhoods: { label: 'Neighborhoods', Icon: Map },
  lists: { label: 'Lists', Icon: List },
  hashtags: { label: 'Hashtags', Icon: Hash },
  users: { label: 'Users', Icon: User },
};
const DEFAULT_TAB = 'analytics';
const LIST_TYPE_OPTIONS = ['all', 'mixed', 'restaurant', 'dish'];
const HASHTAG_CATEGORY_OPTIONS = ['all', 'cuisine', 'attributes', 'ingredients', 'location', 'meal', 'dietary'];
const PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
const DEBOUNCE_DELAY = 500;
const DEFAULT_PAGE_LIMIT = 25;
const SUBMISSION_STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

// --- Fetcher Function ---
const fetchAdminData = async (
  type: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_LIMIT,
  sort: string = '',
  search: string = '',
  status: string = '',
  listType: string = '',
  hashtagCategory: string = '',
  cityId: string = ''
): Promise<AdminDataResponse<unknown>> => {
  if (type === 'analytics') return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };

  console.log(`[AdminPanel] Fetching data for type: ${type}, page: ${page}, limit: ${limit}, sort: ${sort}, search: "${search}", status: "${status}", listType: "${listType}", hashtagCategory: "${hashtagCategory}", cityId: "${cityId}"`);

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (sort) params.append('sort', sort);
  if (search) params.append('search', search);
  if (type === 'submissions' && status) params.append('status', status);
  if (type === 'lists' && listType && listType !== 'all') params.append('list_type', listType);
  if (type === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') params.append('hashtag_category', hashtagCategory);
  if (type === 'neighborhoods' && cityId) params.append('cityId', cityId);

  const endpoint = `/api/admin/${type}?${params.toString()}`;
  try {
    const response = await apiClient<AdminDataResponse<unknown>>(endpoint, `Admin Fetch ${type}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || `Invalid server response for ${type}.`);
    }
    const data = Array.isArray(response.data) ? response.data : (response.data.data ?? []);
    const pagination = response.pagination ?? {
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
    };
    pagination.total = Number(pagination.total || 0);
    pagination.page = Number(pagination.page || 1);
    pagination.limit = Number(pagination.limit || limit);
    pagination.totalPages = Number(pagination.totalPages || Math.ceil(pagination.total / pagination.limit));
    return { data, pagination };
  } catch (error) {
    console.error(`[AdminPanel] Error fetching ${type}:`, error);
    throw error instanceof Error ? error : new Error(`Failed to load ${type}`);
  }
};

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Component ---
const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [sortState, setSortState] = useState<Record<string, string>>({});
  const [listTypeFilter, setListTypeFilter] = useState<string>('all');
  const [hashtagCategoryFilter, setHashtagCategoryFilter] = useState<string>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_LIMIT);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [neighborhoodCityFilter, setNeighborhoodCityFilter] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);
  const queryClient = useQueryClient();

  // Fetch cities
  const { data: cities = [], isLoading: isLoadingCities, error: citiesError } = useQuery<City[], Error>({
    queryKey: ['adminCitiesSimple'],
    queryFn: adminService.getAdminCitiesSimple,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });

  // Reset page on filter/tab change
  useEffect(() => {
    setPage(1);
  }, [activeTab, limit, debouncedSearchTerm, listTypeFilter, hashtagCategoryFilter, submissionStatusFilter, neighborhoodCityFilter]);

  const currentSort = useMemo(() => sortState[activeTab] || '', [sortState, activeTab]);

  // Query key
  const queryKeyParams = useMemo(
    () => ({
      tab: activeTab,
      page,
      limit,
      sort: currentSort,
      search: debouncedSearchTerm,
      ...(activeTab === 'submissions' && { status: submissionStatusFilter }),
      ...(activeTab === 'lists' && { listType: listTypeFilter }),
      ...(activeTab === 'hashtags' && { hashtagCategory: hashtagCategoryFilter }),
      ...(activeTab === 'neighborhoods' && { cityId: neighborhoodCityFilter }),
    }),
    [
      activeTab,
      page,
      limit,
      currentSort,
      debouncedSearchTerm,
      submissionStatusFilter,
      listTypeFilter,
      hashtagCategoryFilter,
      neighborhoodCityFilter,
    ]
  );

  // Fetch data
  const {
    data: queryResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AdminDataResponse<unknown>, Error>({
    queryKey: ['adminData', queryKeyParams],
    queryFn: () =>
      fetchAdminData(
        activeTab,
        page,
        limit,
        currentSort,
        debouncedSearchTerm,
        activeTab === 'submissions' ? submissionStatusFilter : '',
        activeTab === 'lists' ? listTypeFilter : '',
        activeTab === 'hashtags' ? hashtagCategoryFilter : '',
        activeTab === 'neighborhoods' ? neighborhoodCityFilter : ''
      ),
    enabled: !!activeTab && activeTab !== 'analytics',
    placeholderData: { data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } },
    keepPreviousData: true,
  });

  // Memoized data
  const responseData = useMemo(() => queryResult?.data || [], [queryResult?.data]);
  const pagination = useMemo(
    () => queryResult?.pagination || { total: 0, page: 1, limit, totalPages: 0 },
    [queryResult?.pagination, limit]
  );

  // --- Handlers ---
  const handleSortChange = useCallback(
    (type: string, column: string, direction: string) => {
      setSortState((prev) => ({ ...prev, [type]: `${column}_${direction}` }));
    },
    []
  );

  const handleDataMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adminData', queryKeyParams] });
    if (['cities', 'neighborhoods'].includes(activeTab)) {
      queryClient.invalidateQueries({ queryKey: ['adminNeighborhoods'] });
      queryClient.invalidateQueries({ queryKey: ['adminCitiesSimple'] });
    }
  }, [queryClient, queryKeyParams, activeTab]);

  const handleListTypeFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setListTypeFilter(e.target.value);
  }, []);

  const handleHashtagCategoryFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setHashtagCategoryFilter(e.target.value);
  }, []);

  const handleSubmissionStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubmissionStatusFilter(e.target.value);
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleLimitChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(event.target.value));
  }, []);

  const handleNeighborhoodCityFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setNeighborhoodCityFilter(event.target.value);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const totalPages = pagination?.totalPages ?? 1;
      const validPage = Math.max(1, Math.min(newPage, totalPages));
      if (validPage !== page) setPage(validPage);
    },
    [page, pagination?.totalPages]
  );

  // --- Render Tab Content ---
  const renderTabContent = useCallback(
    (tab: string) => {
      try {
        switch (tab) {
          case 'analytics':
            return (
              <Tabs.Root value="summary" defaultValue="summary">
                <Tabs.List className="flex border-b border-gray-200 mb-4">
                  <Tabs.Trigger
                    value="summary"
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-[#A78B71] data-[state=active]:border-[#A78B71]"
                  >
                    Summary
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="engagement"
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-[#A78B71] data-[state=active]:border-[#A78B71]"
                  >
                    Engagement
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="summary">
                  <AdminAnalyticsSummary />
                </Tabs.Content>
                <Tabs.Content value="engagement">
                  <AdminEngagementAnalytics />
                </Tabs.Content>
              </Tabs.Root>
            );
          default:
            return (
              <>
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mr-2">
                      <Filter size={14} /> Filters:
                    </span>
                    {tab === 'submissions' && (
                      <div className="flex items-center gap-1">
                        <label htmlFor="submission-status-filter" className="text-xs text-gray-600 mr-1">
                          Status:
                        </label>
                        <Select
                          id="submission-status-filter"
                          value={submissionStatusFilter}
                          onChange={handleSubmissionStatusFilterChange}
                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white min-w-[120px]"
                        >
                          {SUBMISSION_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                    {tab === 'lists' && (
                      <div className="flex items-center gap-1">
                        <label htmlFor="list-type-filter" className="text-xs text-gray-600 mr-1">
                          List Type:
                        </label>
                        <Select
                          id="list-type-filter"
                          value={listTypeFilter}
                          onChange={handleListTypeFilterChange}
                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white min-w-[120px]"
                        >
                          {LIST_TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                    {tab === 'hashtags' && (
                      <div className="flex items-center gap-1">
                        <label htmlFor="hashtag-category-filter" className="text-xs text-gray-600 mr-1">
                          Category:
                        </label>
                        <Select
                          id="hashtag-category-filter"
                          value={hashtagCategoryFilter}
                          onChange={handleHashtagCategoryFilterChange}
                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white min-w-[120px]"
                        >
                          {HASHTAG_CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                    {tab === 'neighborhoods' && (
                      <div className="flex items-center gap-1">
                        <label htmlFor="neighborhood-city-filter" className="text-xs text-gray-600 mr-1">
                          City:
                        </label>
                        <Select
                          id="neighborhood-city-filter"
                          value={neighborhoodCityFilter}
                          onChange={handleNeighborhoodCityFilterChange}
                          disabled={isLoadingCities || !!citiesError || !cities?.length}
                          className="text-xs border-gray-300 rounded shadow-sm focus:border-[#A78B71] focus:ring-[#A78B71] py-1 pl-2 pr-6 bg-white min-w-[120px]"
                        >
                          <option value="">All Cities</option>
                          {isLoadingCities && <option disabled>Loading...</option>}
                          {citiesError && <option disabled>Error</option>}
                          {!isLoadingCities && !citiesError && Array.isArray(cities) && cities.length > 0 ? (
                            cities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))
                          ) : (
                            !isLoadingCities && <option disabled>No cities</option>
                          )}
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="relative flex-shrink-0 w-full md:w-64">
                    <label htmlFor="adminSearch" className="sr-only">
                      Search {tab}
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </div>
                    <Input
                      type="search"
                      name="adminSearch"
                      id="adminSearch"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-9"
                      placeholder={`Search ${tab}...`}
                    />
                  </div>
                </div>
                {isLoading && <LoadingSpinner message={`Loading ${TAB_CONFIG[tab]?.label}...`} />}
                {isError && !isLoading && (
                  <ErrorMessage
                    message={error?.message || `Failed to load ${TAB_CONFIG[tab]?.label}.`}
                    onRetry={refetch}
                    isLoadingRetry={isFetching}
                    containerClassName="mt-4"
                  />
                )}
                {!isLoading && !isError && (
                  <>
                    <AdminTable
                      type={tab}
                      data={responseData}
                      sort={currentSort}
                      onSortChange={handleSortChange}
                      onDataMutated={handleDataMutation}
                      isLoading={isFetching}
                    />
                    {pagination && pagination.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                        <div>
                          <label htmlFor="items-per-page" className="mr-2 text-xs">
                            Items:
                          </label>
                          <Select
                            id="items-per-page"
                            value={limit}
                            onChange={handleLimitChange}
                            disabled={isFetching}
                            className="text-xs py-1 pl-2 pr-7"
                          >
                            {PAGE_LIMIT_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <span className="text-xs">
                          Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1 || isFetching}
                            className="!px-2 !py-1"
                            aria-label="Prev"
                          >
                            <ChevronLeft size={16} /> Prev
                          </Button>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= pagination.totalPages || isFetching}
                            className="!px-2 !py-1"
                            aria-label="Next"
                          >
                            Next <ChevronRight size={16} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            );
        }
      } catch (err) {
        console.error(`[AdminPanel] Error rendering tab ${tab}:`, err);
        return (
          <ErrorMessage
            message={`Failed to render ${TAB_CONFIG[tab]?.label}.`}
            onRetry={() => setActiveTab(activeTab)}
          />
        );
      }
    },
    [activeTab, submissionStatusFilter, listTypeFilter, hashtagCategoryFilter, neighborhoodCityFilter, isLoadingCities, citiesError, cities, searchTerm, isLoading, isError, error, isFetching, responseData, currentSort, limit, pagination, handleSortChange, handleDataMutation, handleSubmissionStatusFilterChange, handleListTypeFilterChange, handleHashtagCategoryFilterChange, handleSearchChange, handleLimitChange, handleNeighborhoodCityFilterChange, handlePageChange, refetch]
  );

  // --- Main Render ---
  return (
    <div className="max-w-full mx-auto px-0 sm:px-2 md:px-4 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 px-4 sm:px-0">Admin Panel</h1>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar px-4 sm:px-0">
          {Object.entries(TAB_CONFIG).map(([key, { label, Icon }]) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:z-10 whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'text-[#A78B71] border-b-2 border-[#A78B71]'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              {Icon && <Icon size={16} />} {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="mt-4 px-4 sm:px-0">{renderTabContent(activeTab)}</div>
      </Tabs.Root>
    </div>
  );
};

export default AdminPanel;