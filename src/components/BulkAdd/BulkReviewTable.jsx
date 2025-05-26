/**
 * BulkReviewTable Component
 * 
 * Displays parsed items for review before submission in the bulk add workflow.
 * Allows users to view, edit, and validate items before final submission.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  Button,
  TablePagination,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  Error,
  Warning,
  Refresh
} from '@mui/icons-material';
import { logDebug } from '@/utils/logger';

/**
 * Status component to display item status with appropriate icon
 * @param {Object} props - Component props
 * @param {string} props.status - Item status
 * @returns {JSX.Element} - Rendered component
 */
const ItemStatus = ({ status }) => {
  const statusConfig = {
    pending: { color: 'default', icon: <Refresh fontSize="small" />, label: 'Pending' },
    valid: { color: 'success', icon: <CheckCircle fontSize="small" />, label: 'Valid' },
    warning: { color: 'warning', icon: <Warning fontSize="small" />, label: 'Warning' },
    error: { color: 'error', icon: <Error fontSize="small" />, label: 'Error' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};

/**
 * BulkReviewTable component
 * @param {Object} props - Component props
 * @param {Array} props.items - Items to review
 * @param {Function} props.onEditItem - Edit item handler
 * @param {Function} props.onDeleteItem - Delete item handler
 * @param {Function} props.onResolveItem - Resolve item handler
 * @param {boolean} props.isProcessing - Processing state
 * @returns {JSX.Element} - Rendered component
 */
const BulkReviewTable = ({
  items,
  onEditItem,
  onDeleteItem,
  onResolveItem,
  isProcessing
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Paginated items
  const paginatedItems = useMemo(() => {
    return items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [items, page, rowsPerPage]);

  // Handle page change
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Start editing an item
  const handleStartEdit = useCallback((item) => {
    setEditingItem(item._id || item._lineNumber);
    setEditValues({
      name: item.name || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      zip: item.zip || ''
    });
  }, []);

  // Handle edit field change
  const handleEditChange = useCallback((field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Save edited item
  const handleSaveEdit = useCallback((item) => {
    const updatedItem = {
      ...item,
      ...editValues
    };
    onEditItem(updatedItem);
    setEditingItem(null);
  }, [editValues, onEditItem]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Determine if an item is being edited
  const isEditing = useCallback((item) => {
    return editingItem === (item._id || item._lineNumber);
  }, [editingItem]);

  // Render table cell content based on edit state
  const renderCell = useCallback((item, field) => {
    if (isEditing(item)) {
      return (
        <TextField
          value={editValues[field] || ''}
          onChange={(e) => handleEditChange(field, e.target.value)}
          size="small"
          fullWidth
          variant="outlined"
          disabled={isProcessing}
        />
      );
    }
    return item[field] || '';
  }, [editValues, handleEditChange, isEditing, isProcessing]);

  // Render action buttons
  const renderActions = useCallback((item) => {
    if (isEditing(item)) {
      return (
        <>
          <Button
            size="small"
            onClick={() => handleSaveEdit(item)}
            color="primary"
            disabled={isProcessing}
          >
            Save
          </Button>
          <Button
            size="small"
            onClick={handleCancelEdit}
            color="secondary"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </>
      );
    }

    return (
      <>
        <Tooltip title="Edit item">
          <IconButton
            size="small"
            onClick={() => handleStartEdit(item)}
            disabled={isProcessing}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete item">
          <IconButton
            size="small"
            onClick={() => onDeleteItem(item)}
            disabled={isProcessing}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
        {item.status === 'warning' && (
          <Tooltip title="Resolve place">
            <IconButton
              size="small"
              onClick={() => onResolveItem(item)}
              disabled={isProcessing}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  }, [handleCancelEdit, handleSaveEdit, handleStartEdit, isEditing, isProcessing, onDeleteItem, onResolveItem]);

  return (
    <Box>
      <Paper elevation={2}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>State</TableCell>
                <TableCell>ZIP</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <TableRow key={item._id || item._lineNumber}>
                    <TableCell>
                      <ItemStatus status={item.status || 'pending'} />
                    </TableCell>
                    <TableCell>{renderCell(item, 'name')}</TableCell>
                    <TableCell>{renderCell(item, 'address')}</TableCell>
                    <TableCell>{renderCell(item, 'city')}</TableCell>
                    <TableCell>{renderCell(item, 'state')}</TableCell>
                    <TableCell>{renderCell(item, 'zip')}</TableCell>
                    <TableCell>{renderActions(item)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {isProcessing ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        <Typography variant="body2">Processing items...</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">No items to review</Typography>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default BulkReviewTable;
