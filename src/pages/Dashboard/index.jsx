import React, { useState, useEffect } from "react";
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";
import { API_BASE_URL } from "@/config";

const Dashboard = () => {
  const { pendingSubmissions, fetchPendingSubmissions, approveSubmission, rejectSubmission, trendingItems, setTrendingItems } = useAppStore();
  const [mergeTarget, setMergeTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchPendingSubmissions();
        console.log("Pending submissions fetched:", pendingSubmissions);
      } catch (err) {
        setError("Failed to fetch pending submissions: " + err.message);
        console.error("Error fetching pending submissions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubmissions();
  }, [fetchPendingSubmissions]);

  const findDuplicates = (item) => {
    const existingItems = trendingItems;
    return existingItems.filter((existing) =>
      existing.name.toLowerCase() === item.name.toLowerCase()
    );
  };

  const handleMerge = async (submissionId, targetId) => {
    const submission = pendingSubmissions.find((s) => s.id === submissionId);
    const target = trendingItems.find((i) => i.id === targetId);
    if (submission && target) {
      const updatedTarget = {
        ...target,
        adds: (target.adds || 0) + 1,
        tags: [...new Set([...(target.tags || []), ...(submission.tags || [])])],
      };
      setTrendingItems(trendingItems.map(item => item.id === targetId ? updatedTarget : item));
      await approveSubmission(submissionId);
      setMergeTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pending Submissions</h1>
        {isLoading ? (
          <p className="text-gray-500">Loading pending submissions...</p>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => fetchPendingSubmissions()}
              variant="primary"
              className="px-4 py-2"
            >
              Retry
            </Button>
          </div>
        ) : pendingSubmissions.length === 0 ? (
          <p className="text-gray-500">No pending submissions to review.</p>
        ) : (
          <div className="space-y-6">
            {pendingSubmissions.map((submission) => {
              const duplicates = findDuplicates(submission);
              return (
                <div key={submission.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{submission.name}</h2>
                  <p className="text-gray-600 mb-2">Type: {submission.type}</p>
                  {submission.location && (
                    <p className="text-gray-600 mb-2">Location: {submission.location}</p>
                  )}
                  {submission.restaurant && (
                    <p className="text-gray-600 mb-2">Restaurant: {submission.restaurant}</p>
                  )}
                  <p className="text-gray-600 mb-4">
                    Tags: {submission.tags?.map(tag => `#${tag}`).join(", ") || "None"}
                  </p>

                  {duplicates.length > 0 && (
                    <div className="mb-4">
                      <p className="text-red-600 mb-2">Possible duplicates found:</p>
                      {duplicates.map((dup) => (
                        <div key={dup.id} className="flex items-center justify-between mb-2">
                          <span>{dup.name} ({dup.neighborhood}, {dup.city})</span>
                          <Button
                            onClick={() => setMergeTarget({ submissionId: submission.id, targetId: dup.id })}
                            variant="primary"
                            size="sm"
                            className="px-3 py-1"
                          >
                            Merge
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {mergeTarget?.submissionId === submission.id && (
                    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                      <p className="text-gray-800 mb-2">
                        Merging with: {(duplicates.find((d) => d.id === mergeTarget.targetId) || {}).name}
                      </p>
                      <Button
                        onClick={() => handleMerge(mergeTarget.submissionId, mergeTarget.targetId)}
                        variant="primary"
                        className="px-4 py-2 mr-2"
                      >
                        Confirm Merge
                      </Button>
                      <Button
                        onClick={() => setMergeTarget(null)}
                        variant="tertiary"
                        className="px-4 py-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => approveSubmission(submission.id)}
                      variant="primary"
                      className="px-4 py-2"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectSubmission(submission.id)}
                      variant="tertiary"
                      className="px-4 py-2"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;