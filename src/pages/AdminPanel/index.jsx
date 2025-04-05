import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/utils/apiClient';
import Button from '@/components/Button';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

const fetchAdminData = async (type, sort) => {
    const endpoint = type === 'submissions' ? '/api/submissions' : `/api/${type}`;
    const data = await apiClient(endpoint, `Admin Fetch ${type}`);
    return Array.isArray(data) ? data.sort((a, b) => sort === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)) : [];
};

const AdminPanel = React.memo(() => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('submissions');
    const [sort, setSort] = useState('asc');

    const { data: items = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ['adminData', activeTab, sort],
        queryFn: () => fetchAdminData(activeTab, sort),
        enabled: !!activeTab,
    });

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const handleSort = useCallback(() => {
        setSort(prev => prev === 'asc' ? 'desc' : 'asc');
    }, []);

    const handleApprove = useCallback(async (id) => {
        try {
            await apiClient(`/api/submissions/${id}/approve`, 'Admin Approve', { method: 'POST' });
            queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
            queryClient.invalidateQueries({ queryKey: ['trendingData'] });
            console.log(`[AdminPanel] Submission ${id} approved`);
        } catch (err) {
            console.error(`[AdminPanel] Error approving submission ${id}:`, err);
        }
    }, [activeTab, sort, queryClient]);

    const handleReject = useCallback(async (id) => {
        try {
            await apiClient(`/api/submissions/${id}/reject`, 'Admin Reject', { method: 'POST' });
            queryClient.invalidateQueries({ queryKey: ['adminData', activeTab, sort] });
            console.log(`[AdminPanel] Submission ${id} rejected`);
        } catch (err) {
            console.error(`[AdminPanel] Error rejecting submission ${id}:`, err);
        }
    }, [activeTab, sort, queryClient]);

    const renderTable = () => {
        if (isLoading) return <LoadingSpinner size="lg" message="Loading data..." />;
        if (isError) return <ErrorMessage message={error?.message || 'Failed to load data'} onRetry={refetch} isLoadingRetry={isLoading} />;
        if (!items.length) return <p className="text-gray-500 text-center py-6">No {activeTab} available.</p>;

        return (
            <ul className="space-y-4">
                {items.map((item) => (
                    <li key={item.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-md">
                        <div>
                            <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.type} - {item.city || 'No city'}, {item.neighborhood || 'No neighborhood'}</p>
                            {item.tags.length > 0 && (
                                <p className="text-xs text-gray-500">{item.tags.join(', ')}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleApprove(item.id)}>Approve</Button>
                            <Button variant="tertiary" size="sm" onClick={() => handleReject(item.id)} className="text-red-500 hover:text-red-700">Reject</Button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h1>
            <div className="flex gap-4 mb-6">
                <Button onClick={() => handleTabChange('submissions')} className={activeTab === 'submissions' ? 'bg-[#A78B71] text-white' : ''}>Submissions</Button>
                <Button onClick={() => handleTabChange('restaurants')} className={activeTab === 'restaurants' ? 'bg-[#A78B71] text-white' : ''}>Restaurants</Button>
                <Button onClick={() => handleTabChange('dishes')} className={activeTab === 'dishes' ? 'bg-[#A78B71] text-white' : ''}>Dishes</Button>
            </div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                <Button variant="tertiary" size="sm" onClick={handleSort}>
                    Sort {sort === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
            </div>
            {renderTable()}
        </div>
    );
});

export default AdminPanel;