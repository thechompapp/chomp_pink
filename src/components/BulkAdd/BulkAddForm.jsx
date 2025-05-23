/* src/components/BulkAdd/BulkAddForm.jsx */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Chip
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { logDebug } from '../../utils/logger';

/**
 * BulkAddForm component for entering and parsing bulk add data
 * @param {Object} props - Component props
 * @param {string} props.inputText - Input text value
 * @param {Function} props.setInputText - Function to update input text
 * @param {Function} props.onParseInput - Function to parse input
 * @param {Function} props.onProcessItems - Function to process items
 * @param {boolean} props.isProcessing - Whether items are being processed
 * @param {number} props.currentBatch - Current batch being processed
 * @param {number} props.totalBatches - Total number of batches
 * @param {string} props.error - Error message
 * @param {number} props.itemCount - Number of parsed items
 * @returns {JSX.Element} - Rendered component
 */
const BulkAddForm = ({
  inputText,
  setInputText,
  onParseInput,
  onProcessItems,
  isProcessing,
  currentBatch,
  totalBatches,
  error,
  itemCount
}) => {
  // Track if form has been submitted to show validation errors
  const [submitted, setSubmitted] = useState(false);
  
  // Handle parse button click
  const handleParse = () => {
    setSubmitted(true);
    if (inputText.trim()) {
      logDebug('[BulkAddForm] Parsing input text');
      onParseInput();
    }
  };
  
  // Handle process button click
  const handleProcess = async () => {
    logDebug('[BulkAddForm] Processing items');
    try {
      await onProcessItems();
      logDebug('[BulkAddForm] Items processed successfully');
    } catch (error) {
      logDebug('[BulkAddForm] Error processing items:', error);
    }
  };
  
  return (
    <Box component="form" noValidate>
      {/* Instructions Card */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'info.50', 
          borderColor: 'info.200',
          borderRadius: 1
        }}
      >
        <Typography variant="subtitle2" color="info.dark" gutterBottom fontWeight="bold">
          How to use Bulk Add:
        </Typography>
        
        <Typography variant="body2" component="div">
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Enter each restaurant on a new line using this format:</li>
            <Box 
              component="code" 
              sx={{ 
                display: 'block', 
                p: 1.5, 
                my: 1, 
                bgcolor: 'background.paper', 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            >
              Restaurant Name | Type | Location | Tags
            </Box>
            <li>Click <strong>Parse Input</strong> to validate your entries</li>
            <li>Review the parsed items in the Results panel</li>
            <li>Click <strong>Process Items</strong> to look up and add the restaurants</li>
          </ol>
        </Typography>
      </Paper>
      
      {/* Example */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Example: <code>Popeyes | restaurant | New York | Chicken, Fast Food</code>
        </Typography>
      </Box>
      
      {/* Input Field */}
      <TextField
        label="Enter restaurant data (one per line)"
        multiline
        rows={8}
        fullWidth
        placeholder="Restaurant Name | Type | Location | Tags"
        variant="outlined"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isProcessing}
        error={submitted && !inputText.trim()}
        helperText={submitted && !inputText.trim() ? 'Please enter some data' : ''}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }
        }}
      />
      
      {/* Action Buttons with Progress Indicators */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleParse}
            disabled={isProcessing || !inputText.trim()}
            fullWidth
            size="large"
            sx={{ 
              py: 1.2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            1. Parse Input
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="primary"
            startIcon={isProcessing ? null : <CloudUpload />}
            onClick={() => {
              console.log('PROCESS BUTTON CLICKED DIRECTLY');
              handleProcess();
            }}
            disabled={isProcessing || itemCount === 0}
            fullWidth
            size="large"
            sx={{ 
              py: 1.2,
              boxShadow: 2,
              '&:disabled': {
                bgcolor: 'action.disabledBackground'
              }
            }}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Processing {currentBatch}/{totalBatches}
              </>
            ) : '2. Process Items'}
          </Button>
        </Grid>
      </Grid>
      
      {/* Status Indicators */}
      {itemCount > 0 && !isProcessing && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chip 
            label={`${itemCount} items ready to process`} 
            color="success" 
            size="small" 
            variant="outlined"
          />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default BulkAddForm;
