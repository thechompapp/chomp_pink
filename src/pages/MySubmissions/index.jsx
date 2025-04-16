/* src/pages/MySubmissions/index.jsx */ // Renamed file
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import LoadingSpinner from '@/components/UI/LoadingSpinner.jsx';
// FIX: Adjust import path for skeleton if it's moved with the component
import SubmissionSkeleton from './SubmissionSkeleton';
import { FileText, CheckCircle, XCircle, Clock, Utensils, Store } from 'lucide-react';
import Button from '@/components/UI/Button';

// --- Fetcher Function ---
// Assumes an endpoint /api/submissions/my exists
const fetchMySubmissions = async () => {
    console.log("[MySubmissions] Fetching my submissions..."); // Updated log context
    try {
        const response = await apiClient('/api/submissions/my', 'FetchMySubmissions');

        if (!response.success || !Array.isArray(response.data)) {
            console.error("[MySubmissions] Failed to fetch submissions:", response.error || "Invalid data format");
            throw new Error(response.error || 'Failed to load your submissions.');
        }
        console.log(`[MySubmissions] Fetched ${response.data.length} submissions.`);
        return response.data.filter(sub => sub && sub.id != null);
    } catch (error) {
        console.error("[MySubmissions] Error in fetchMySubmissions:", error);
        throw error instanceof Error ? error : new Error('An unknown error occurred fetching submissions.');
    }
};

// --- Helper Component for Rendering a Single Submission ---
const SubmissionItem = ({ submission }) => {
    // ... (Component logic remains the same as provided previously) ...
    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} className="text-green-500" />;
            case 'rejected': return <XCircle size={16} className="text-red-500" />;
            case 'pending': default: return <Clock size={16} className="text-yellow-500" />;
        }
    };
    const getItemIcon = (type) => {
        switch (type) {
            case 'restaurant': return <Store size={16} className="text-blue-500" />;
            case 'dish': return <Utensils size={16} className="text-orange-500" />;
            default: return <FileText size={16} className="text-gray-500" />;
        }
    };
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-2">
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                    {getItemIcon(submission.type)}
                    <span className="font-medium text-gray-800">{submission.name}</span>
                    {submission.restaurant_name && submission.type === 'dish' && (
                        <span className="text-xs text-gray-500 italic">at {submission.restaurant_name}</span>
                    )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {getStatusIcon(submission.status)}
                    {submission.status}
                </span>
            </div>
            {(submission.location || submission.city || submission.neighborhood) && (
                <p className="text-sm text-gray-600">
                    Location: {submission.location || `${submission.neighborhood || ''}, ${submission.city || ''}`.trim().replace(/^,|,$/g, '')}
                </p>
            )}
             <p className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                Submitted on: {new Date(submission.created_at).toLocaleDateString()}
                {submission.reviewed_at && ` | Reviewed on: ${new Date(submission.reviewed_at).toLocaleDateString()}`}
            </p>
        </div>
    );
};


// --- Main Component ---
// FIX: Renamed component from Dashboard to MySubmissions
const MySubmissions = () => {
    const user = useAuthStore(state => state.user);
    const userId = user?.id;

    const queryResult = useQuery({
        queryKey: ['mySubmissions', userId],
        queryFn: fetchMySubmissions,
        enabled: !!userId,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true,
        placeholderData: [],
    });

    // Memoized loading component using skeletons
    const LoadingComponent = useMemo(() => (
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => <SubmissionSkeleton key={i} />)}
        </div>
    ), []);

    return (
        // FIX: Changed outer div styling if needed, kept container for now
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* FIX: Changed H1 text */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Submissions</h1>

            <QueryResultDisplay
                queryResult={queryResult}
                LoadingComponent={LoadingComponent}
                loadingMessage="Loading your submissions..."
                errorMessagePrefix="Could not load your submissions"
                noDataMessage="You haven't submitted any restaurants or dishes yet."
                isDataEmpty={(data) => !data || data.length === 0}
            >
                {(submissions) => (
                    <div className="space-y-3">
                        {submissions.map(sub => (
                            <SubmissionItem key={sub.id} submission={sub} />
                        ))}
                    </div>
                )}
            </QueryResultDisplay>
            {/* Optional: Add link/button to submit more */}
        </div>
    );
};

// FIX: Updated default export
export default MySubmissions;