import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

export const useAdminTableState = ({
  resourceType,
  fetchData,
  updateData,
  deleteData,
  approveData,
  rejectData,
  initialSort = { column: 'id', direction: 'desc' },
  pageSize = 10,
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [editFormData, setEditFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newRowFormData, setNewRowFormData] = useState({});
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState(null);

  // Fetch data with pagination and sorting
  const { data, isLoading, error } = useQuery(
    ['adminData', resourceType, page, pageSize, currentSort],
    () => fetchData({ page, pageSize, sort: currentSort }),
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );

  // Mutations
  const updateMutation = useMutation(updateData, {
    onSuccess: () => {
      queryClient.invalidateQueries(['adminData', resourceType]);
      setEditingRowIds(new Set());
      setEditFormData({});
      setValidationErrors({});
    },
  });

  const deleteMutation = useMutation(deleteData, {
    onSuccess: () => {
      queryClient.invalidateQueries(['adminData', resourceType]);
      setSelectedRows(new Set());
    },
  });

  const approveMutation = useMutation(approveData, {
    onSuccess: () => {
      queryClient.invalidateQueries(['adminData', resourceType]);
    },
  });

  const rejectMutation = useMutation(rejectData, {
    onSuccess: () => {
      queryClient.invalidateQueries(['adminData', resourceType]);
    },
  });

  // Handlers
  const handleSort = useCallback((type, column, direction) => {
    setCurrentSort({ column, direction });
  }, []);

  const handleRowSelect = useCallback((rowId, selected) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected) => {
    if (selected) {
      setSelectedRows(new Set(data?.rows?.map(row => row.id) || []));
    } else {
      setSelectedRows(new Set());
    }
  }, [data?.rows]);

  const handleStartEdit = useCallback((row) => {
    setEditingRowIds(prev => {
      const next = new Set(prev);
      next.add(row.id);
      return next;
    });
    setEditFormData(prev => ({
      ...prev,
      [row.id]: { ...row }
    }));
  }, []);

  const handleCancelEdit = useCallback((rowId) => {
    setEditingRowIds(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
    setEditFormData(prev => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, []);

  const handleSaveEdit = useCallback((rowId) => {
    const rowData = editFormData[rowId];
    if (!rowData) return;

    updateMutation.mutate({ id: rowId, data: rowData });
  }, [editFormData, updateMutation]);

  const handleRowDataChange = useCallback((rowId, changes) => {
    setEditFormData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        ...changes
      }
    }));
  }, []);

  const handleDelete = useCallback((rowId) => {
    setConfirmDeleteInfo({ rowId, type: resourceType });
  }, [resourceType]);

  const handleDeleteConfirm = useCallback(() => {
    if (confirmDeleteInfo) {
      deleteMutation.mutate(confirmDeleteInfo.rowId);
      setConfirmDeleteInfo(null);
    }
  }, [confirmDeleteInfo, deleteMutation]);

  const handleApprove = useCallback((rowId) => {
    approveMutation.mutate(rowId);
  }, [approveMutation]);

  const handleReject = useCallback((rowId) => {
    rejectMutation.mutate(rowId);
  }, [rejectMutation]);

  return {
    // Data
    data: data?.rows || [],
    columns: data?.columns || [],
    isLoading,
    error,
    page,
    setPage,
    pageSize,
    totalPages: data?.totalPages || 1,
    
    // State
    currentSort,
    selectedRows,
    editingRowIds,
    editFormData,
    validationErrors,
    isAdding,
    newRowFormData,
    confirmDeleteInfo,
    
    // Actions
    onSort: handleSort,
    onRowSelect: handleRowSelect,
    onSelectAll: handleSelectAll,
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,
    onSaveEdit: handleSaveEdit,
    onDataChange: handleRowDataChange,
    onDelete: handleDelete,
    onDeleteConfirm: handleDeleteConfirm,
    onApprove: handleApprove,
    onReject: handleReject,
    setIsAdding,
    setNewRowFormData,
    setConfirmDeleteInfo,
    setValidationErrors,
  };
}; 