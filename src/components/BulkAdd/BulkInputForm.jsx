/**
 * BulkInputForm Component
 * 
 * Handles the UI for data input in the bulk add workflow.
 * Supports text input and file upload for bulk data entry.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { 
  CloudUpload, 
  Refresh, 
  Send,
  HelpOutline,
  ContentPaste
} from '@mui/icons-material';
import { logDebug, logError } from '@/utils/logger';

/**
 * BulkInputForm component
 * @param {Object} props - Component props
 * @param {string} props.inputText - Input text value
 * @param {Function} props.onInputChange - Input change handler
 * @param {Function} props.onProcess - Process handler
 * @param {boolean} props.isProcessing - Processing state
 * @returns {JSX.Element} - Rendered component
 */
const BulkInputForm = ({ 
  inputText, 
  onInputChange, 
  onProcess, 
  isProcessing 
}) => {
  const fileInputRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Handle text change
  const handleTextChange = useCallback((e) => {
    onInputChange(e.target.value);
  }, [onInputChange]);
  
  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onInputChange(event.target.result);
    };
    reader.onerror = (error) => {
      logError('[BulkInputForm] Error reading file:', error);
    };
    reader.readAsText(file);
  }, [onInputChange]);
  
  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onInputChange(clipboardText);
    } catch (error) {
      logError('[BulkInputForm] Error pasting from clipboard:', error);
    }
  }, [onInputChange]);
  
  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onProcess();
  }, [onProcess]);
  
  // Handle form reset
  const handleReset = useCallback(() => {
    onInputChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onInputChange]);
  
  // Toggle help display
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Card elevation={2}>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center">
              <Typography variant="h6">Bulk Add Input</Typography>
              <Tooltip title="Toggle help information">
                <IconButton size="small" onClick={toggleHelp} sx={{ ml: 1 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          subheader="Enter restaurants to add, one per line"
        />
        
        <CardContent>
          {showHelp && (
            <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Input Format:
              </Typography>
              <Typography variant="body2" gutterBottom>
                Enter one restaurant per line using the following format:
              </Typography>
              <Typography variant="body2" component="pre" fontFamily="monospace" gutterBottom>
                Restaurant Name, Address, City, State, ZIP
              </Typography>
              <Typography variant="body2" gutterBottom>
                Example:
              </Typography>
              <Typography variant="body2" component="pre" fontFamily="monospace" gutterBottom>
                Joe's Pizza, 123 Main St, New York, NY 10001
                Sushi Palace, 456 Broadway, New York, NY 10002
                Taco Heaven, 789 Park Ave, New York, NY 10003
              </Typography>
              <Typography variant="body2">
                You can also upload a text file with the same format or paste from clipboard.
              </Typography>
            </Box>
          )}
          
          <TextField
            label="Bulk Add Input"
            multiline
            rows={10}
            value={inputText}
            onChange={handleTextChange}
            fullWidth
            variant="outlined"
            placeholder="Restaurant Name, Address, City, State, ZIP"
            disabled={isProcessing}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
                disabled={isProcessing}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                sx={{ mr: 1 }}
              >
                Upload File
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ContentPaste />}
                onClick={handlePaste}
                disabled={isProcessing}
              >
                Paste
              </Button>
            </Box>
            
            <Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={isProcessing}
                sx={{ mr: 1 }}
              >
                Clear
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<Send />}
                onClick={onProcess}
                disabled={isProcessing || !inputText.trim()}
                type="submit"
              >
                Process
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BulkInputForm;
