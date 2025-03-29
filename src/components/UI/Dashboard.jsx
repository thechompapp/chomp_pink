import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, AlertCircle, Store, Utensils, SortAsc } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const SubmissionCard = ({ submission, onApprove, onReject }) => {
  const isIncomplete = !submission.name || !submission.tags || 
    (submission.type === 'restaurant' && (!submission.location || !submission.cuisine)) ||
    (submission.type === 'dish' && !submission.restaurant);
  
  return (
    <div className="bg-white rounded-xl border border-[#D1B399]/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-start gap-3">
        {submission.type === 'restaurant' ? (
          <Store size={20} className="text-[#D1B399]" />
        ) : (
          <Utensils size={20} className="text-[#D1B399]" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {submission.name}
            {isIncomplete && <AlertCircle size={16} className="text-yellow-500" title="Incomplete data" />}
          </h3>
          <p className="text-sm text-gray-600">
            {submission.type === 'restaurant' && `${submission.location} • ${submission.cuisine}`}
            {submission.type === 'dish' && `at ${submission.restaurant}`}
          </p>
          <p className="text-sm text-gray-500">Tags: {submission.tags || 'None'}</p>
          <p className="text-xs text-gray-400 mt-1">Submitted by {submission.submittedBy} on {submission.date}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onApprove(submission.id)}
          className="p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#c1a389] transition-colors"
          aria-label="Approve submission"
        >
          <Check size={20} />
        </button>
        <button
          onClick={() => onReject(submission.id)}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          aria-label="Reject submission"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { pendingSubmissions, setPendingSubmissions, addTrendingItem } = useAppStore((state) => ({
    pendingSubmissions: state.pendingSubmissions || [],
    setPendingSubmissions: state.setPendingSubmissions || (() => {}),
    addTrendingItem: state.addTrendingItem || (() => {})
  }));
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [actionConfirm, setActionConfirm] = useState(null);

  useEffect(() => {
    if (!pendingSubmissions.length) {
      setPendingSubmissions([
        { id: 1, type: 'restaurant', name: 'New Eatery', location: 'Downtown', cuisine: 'Fusion', tags: 'fusion, trendy', submittedBy: 'user1', date: '2025-03-28' },
        { id: 2, type: 'dish', name: 'Spicy Noodles', restaurant: 'Noodle House', tags: 'spicy, asian', submittedBy: 'user2', date: '2025-03-27' },
        { id: 3, type: 'restaurant', name: 'Bad Data', location: '???', cuisine: 'none', tags: '', submittedBy: 'user3', date: '2025-03-26' },
      ]);
    }
  }, [pendingSubmissions, setPendingSubmissions]);

  const handleApprove = (submissionId) => {
    if (actionConfirm && actionConfirm.id === submissionId && actionConfirm.action === 'approve') {
      const submission = pendingSubmissions.find(s => s.id === submissionId);
      if (submission.type === 'restaurant') {
        addTrendingItem({
          name: submission.name,
          neighborhood: submission.location.split(',')[0],
          city: submission.location.split(',')[1]?.trim() || 'Unknown',
          tags: submission.tags.split(', ').filter(t => t)
        });
      }
      setPendingSubmissions(pendingSubmissions.filter(s => s.id !== submissionId));
      setActionConfirm(null);
    } else {
      setActionConfirm({ id: submissionId, action: 'approve' });
    }
  };

  const handleReject = (submissionId) => {
    if (actionConfirm && actionConfirm.id === submissionId && actionConfirm.action === 'reject') {
      setPendingSubmissions(pendingSubmissions.filter(s => s.id !== submissionId));
      setActionConfirm(null);
    } else {
      setActionConfirm({ id: submissionId, action: 'reject' });
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...pendingSubmissions];
    if (filterType !== 'all') {
      result = result.filter(s => s.type === filterType);
    }
    return result.sort((a, b) => sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
  }, [pendingSubmissions, filterType, sortOrder]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Dashboard</h1>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-[#D1B399] text-white' : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('restaurant')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${filterType === 'restaurant' ? 'bg-[#D1B399] text-white' : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'}`}
            >
              <Store size={16} className="mr-1" /> Restaurants
            </button>
            <button
              onClick={() => setFilterType('dish')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${filterType === 'dish' ? 'bg-[#D1B399] text-white' : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'}`}
            >
              <Utensils size={16} className="mr-1" /> Dishes
            </button>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20 rounded-lg flex items-center text-sm font-medium transition-colors"
          >
            <SortAsc size={16} className={`mr-1 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} /> Date
          </button>
        </div>
      </div>
      {filteredAndSortedSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D1B399]/20 p-6 text-center">
          <p className="text-gray-500">No pending submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedSubmissions.map(submission => (
            <div key={submission.id} className="relative">
              <SubmissionCard submission={submission} onApprove={handleApprove} onReject={handleReject} />
              {actionConfirm && actionConfirm.id === submission.id && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <p className="text-sm text-gray-700 mb-4">Are you sure you want to {actionConfirm.action} "{submission.name}"?</p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setActionConfirm(null)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => actionConfirm.action === 'approve' ? handleApprove(submission.id) : handleReject(submission.id)}
                        className={`px-3 py-1 rounded-lg text-white ${actionConfirm.action === 'approve' ? 'bg-[#D1B399] hover:bg-[#c1a389]' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;