import React, { useState } from "react";
import useAppStore from "@/hooks/useAppStore"; // Use alias
import Button from "@/components/Button"; // Use alias

const Dashboard = () => {
  const pendingSubmissions = useAppStore((state) => state.pendingSubmissions);
  const trendingItems = useAppStore((state) => state.trendingItems);
  const trendingDishes = useAppStore((state) => state.trendingDishes);
  const approveSubmission = useAppStore((state) => state.approveSubmission);
  const rejectSubmission = useAppStore((state) => state.rejectSubmission);
  const [mergeTarget, setMergeTarget] = useState(null);

  const findDuplicates = (item) => {
    const existingItems = item.type === "restaurant" ? trendingItems : trendingDishes;
    return existingItems.filter((existing) =>
      existing.name.toLowerCase().includes(item.name.toLowerCase())
    );
  };

  const handleMerge = (submissionId, targetId) => {
    const submission = pendingSubmissions.find((s) => s.id === submissionId);
    const target = (submission.type === "restaurant" ? trendingItems : trendingDishes).find(
      (i) => i.id === targetId
    );
    if (submission && target) {
      const updatedItem = { ...target, ...submission, id: target.id };
      if (submission.type === "restaurant") {
        useAppStore.setState((state) => ({
          trendingItems: state.trendingItems.map((i) =>
            i.id === targetId ? updatedItem : i
          ),
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
        }));
      } else {
        useAppStore.setState((state) => ({
          trendingDishes: state.trendingDishes.map((i) =>
            i.id === targetId ? updatedItem : i
          ),
          pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== submissionId),
        }));
      }
    }
    setMergeTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pending Submissions</h1>
        {pendingSubmissions.length === 0 ? (
          <p className="text-gray-500">No pending submissions to review.</p>
        ) : (
          <div className="space-y-6">
            {pendingSubmissions.map((submission) => {
              const duplicates = findDuplicates(submission);
              return (
                <div key={submission.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{submission.name}</h2>
                  <p className="text-gray-600 mb-2">Type: {submission.type}</p>
                  {submission.city && (
                    <p className="text-gray-600 mb-2">
                      Location: {submission.neighborhood}, {submission.city}
                    </p>
                  )}
                  {submission.restaurant && (
                    <p className="text-gray-600 mb-2">Restaurant: {submission.restaurant}</p>
                  )}
                  <p className="text-gray-600 mb-4">
                    Tags: {submission.tags?.join(", ") || "None"}
                  </p>

                  {duplicates.length > 0 && (
                    <div className="mb-4">
                      <p className="text-red-600 mb-2">Possible duplicates found:</p>
                      {duplicates.map((dup) => (
                        <div key={dup.id} className="flex items-center justify-between mb-2">
                          <span>{dup.name}</span>
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