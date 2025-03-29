import React, { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const Dashboard = () => {
  const userLists = useAppStore((state) => state.userLists);
  const [pendingSubmissions, setPendingSubmissions] = useState([
    { id: 1, type: 'restaurant', name: 'New Eatery', location: 'Downtown', cuisine: 'Fusion', tags: 'fusion, trendy', submittedBy: 'user1', date: '2025-03-28' },
    { id: 2, type: 'dish', name: 'Spicy Noodles', restaurant: 'Noodle House', tags: 'spicy, asian', submittedBy: 'user2', date: '2025-03-27' },
    { id: 3, type: 'restaurant', name: 'Bad Data', location: '???', cuisine: 'none', tags: '', submittedBy: 'user3', date: '2025-03-26' },
  ]);

  const handleApprove = (submissionId) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (submission.type === 'list') {
      // Add to store or handle differently if needed
    }
    setPendingSubmissions(pendingSubmissions.filter(s => s.id !== submissionId));
  };

  const handleReject = (submissionId) => {
    setPendingSubmissions(pendingSubmissions.filter(s => s.id !== submissionId));
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Dashboard</h1>
      {pendingSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D1B399]/20 p-6 text-center">
          <p className="text-gray-500">No pending submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSubmissions.map(submission => (
            <div key={submission.id} className="bg-white rounded-xl border border-[#D1B399]/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{submission.name}</h3>
                <p className="text-sm text-gray-600">
                  {submission.type === 'restaurant' && `${submission.location} • ${submission.cuisine}`}
                  {submission.type === 'dish' && `at ${submission.restaurant}`}
                </p>
                <p className="text-sm text-gray-500">Tags: {submission.tags || 'None'}</p>
                <p className="text-xs text-gray-400 mt-1">Submitted by {submission.submittedBy} on {submission.date}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleApprove(submission.id)} className="p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#c1a389] transition-colors" aria-label="Approve submission"><Check size={20} /></button>
                <button onClick={() => handleReject(submission.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" aria-label="Reject submission"><X size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;