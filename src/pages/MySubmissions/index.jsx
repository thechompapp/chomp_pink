/*
 * Filename: root/src/pages/MySubmissions/index.jsx
 * Description: Page displaying the current user's submissions (restaurants/dishes).
 * Refactored to use React Query instead of useSubmissionStore for data fetching.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth/AuthContext'; // Changed to default import // Migrated from useAuthStore
import submissionService from '@/services/submissionService';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import SubmissionSkeleton from './SubmissionSkeleton'; // Assuming this exists
import PageContainer from '@/layouts/PageContainer'; // Using layout component

// Define a component to display individual submission details (example structure)
const SubmissionCard = ({ submission }) => {
    // Determine color based on status
    let statusColor = 'text-gray-600 dark:text-gray-400';
    if (submission.status === 'approved') statusColor = 'text-green-600 dark:text-green-400';
    if (submission.status === 'rejected') statusColor = 'text-red-600 dark:text-red-400';

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{submission.name}</h3>
                 <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${statusColor} bg-opacity-20 ${submission.status === 'approved' ? 'bg-green-100 dark:bg-green-900' : submission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                     {submission.status}
                 </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Type: {submission.type}</p>
            {/* Display more details from submission.data if needed */}
             {submission.data?.location && <p className="text-sm text-gray-600 dark:text-gray-300">Location: {submission.data.location}</p>}
             {submission.data?.restaurant_name && <p className="text-sm text-gray-600 dark:text-gray-300">Restaurant: {submission.data.restaurant_name}</p>}
             {submission.data?.notes && <p className="text-sm text-gray-600 dark:text-gray-300 italic">Notes: "{submission.data.notes}"</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500">Submitted: {new Date(submission.created_at).toLocaleDateString()}</p>
             {submission.status === 'rejected' && submission.admin_notes && (
                 <p className="text-xs text-red-500 dark:text-red-400 mt-1">Reason: {submission.admin_notes}</p>
             )}
        </div>
    );
};

const MySubmissionsPage = () => {
    const { user, isAuthenticated } = useAuth();
    const userId = user?.id;

    const [statusFilter, setStatusFilter] = useState(null); // null, 'pending', 'approved', 'rejected'
    const [page, setPage] = useState(1);
    const limit = 10; // Or use a config value

    // --- React Query Data Fetching ---
    const { data: queryResult, isLoading, isError, error, isFetching, isPlaceholderData } = useQuery({
        queryKey: ['userSubmissions', userId, { status: statusFilter, page, limit }],
        queryFn: () => submissionService.getUserSubmissions(userId, { status: statusFilter, page, limit }), // Updated to pass userId
        placeholderData: (previousData) => previousData,
        enabled: !!isAuthenticated && !!userId,
        // Optional: Set staleTime/cacheTime
    });
    // --- End React Query Data Fetching ---

    const submissions = queryResult?.data || [];
    const pagination = queryResult?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const handleFilterChange = (newFilter) => {
        if (newFilter !== statusFilter) {
            setStatusFilter(newFilter);
            setPage(1); // Reset page when filter changes
        }
    };

     const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            setPage(newPage);
             window.scrollTo(0, 0);
        }
    };

    if (!isAuthenticated) {
        return (
             <PageContainer title="My Submissions">
                <ErrorMessage message="Please log in to view your submissions." />
             </PageContainer>
        );
    }

    // Initial loading state
    if (isLoading && !queryResult) {
        return (
             <PageContainer title="My Submissions">
                 <div className="space-y-4">
                     {Array.from({ length: limit }).map((_, index) => (
                         <SubmissionSkeleton key={index} />
                     ))}
                 </div>
             </PageContainer>
        );
    }

     // Error state
     if (isError) {
         return (
              <PageContainer title="My Submissions">
                <ErrorMessage message={error?.message || 'Failed to load submissions.'} />
              </PageContainer>
         );
     }

    return (
        <PageContainer title="My Submissions">
            <div className="space-y-6">
                {/* Filter Buttons */}
                 <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                     <Button
                         variant={!statusFilter ? 'solid' : 'outline'}
                         onClick={() => handleFilterChange(null)}
                         size="sm"
                     >
                         All
                     </Button>
                     <Button
                         variant={statusFilter === 'pending' ? 'solid' : 'outline'}
                         onClick={() => handleFilterChange('pending')}
                         size="sm"
                     >
                         Pending
                     </Button>
                     <Button
                         variant={statusFilter === 'approved' ? 'solid' : 'outline'}
                         onClick={() => handleFilterChange('approved')}
                         size="sm"
                     >
                         Approved
                     </Button>
                     <Button
                         variant={statusFilter === 'rejected' ? 'solid' : 'outline'}
                         onClick={() => handleFilterChange('rejected')}
                         size="sm"
                     >
                         Rejected
                     </Button>
                 </div>

                {/* List of Submissions */}
                {(isLoading || isFetching || submissions.length > 0) ? (
                     <div className="space-y-4">
                         {(isLoading || (isFetching && isPlaceholderData)) ? (
                             Array.from({ length: limit }).map((_, index) => <SubmissionSkeleton key={`skel-${index}`} />)
                         ) : (
                             submissions.map((submission) => (
                                 <SubmissionCard key={submission.id} submission={submission} />
                             ))
                         )}
                     </div>
                 ) : (
                     <div className="text-center py-10">
                         <p className="text-gray-600 dark:text-gray-400">
                             You haven't made any submissions yet.
                         </p>
                         {/* Optional: Link to add submission */}
                     </div>
                 )}

                 {/* Pagination Controls */}
                 {pagination && totalPages > 1 && (
                     <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                         <Button
                             onClick={() => handlePageChange(page - 1)}
                             disabled={page <= 1}
                             variant="outline"
                             size="sm"
                         >
                             Previous
                         </Button>
                         <span className="text-sm text-gray-700 dark:text-gray-300">
                             Page {page} of {totalPages}
                         </span>
                         <Button
                             onClick={() => handlePageChange(page + 1)}
                             disabled={page >= totalPages || isPlaceholderData}
                             variant="outline"
                             size="sm"
                         >
                             Next
                         </Button>
                     </div>
                 )}
            </div>
        </PageContainer>
    );
};

export default MySubmissionsPage;