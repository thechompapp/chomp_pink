import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { 
  CloudUpload, 
  Refresh, 
  Check, 
  Error as ErrorIcon, 
  Info, 
  HelpOutline,
  RestaurantMenu
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useBulkAddProcessorV2 from '../../hooks/useBulkAddProcessorV2';
import PlaceSelectionDialog from './PlaceSelectionDialog';
import { logDebug, logError, logInfo } from '../../utils/logger';
import { parseInputText, parseRawInput } from '../../utils/bulkAddUtils';

/**
 * BulkAdd component for adding multiple restaurants or dishes at once
 * @returns {JSX.Element} - Rendered component
 */
const BulkAdd = () => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPlaceSelection, setShowPlaceSelection] = useState(false);
  const [placeOptions, setPlaceOptions] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  
  const { 
    processedItems,
    processBulkAddItems,
    selectPlaceForItem,
    resetProcessor,
    submitProcessedItems,
    isSubmitting
  } = useBulkAddProcessorV2();
  
  const handleTextChange = useCallback((e) => {
    setInputText(e.target.value);
  }, []);
  
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputText(event.target.result);
    };
    reader.onerror = (error) => {
      logError('[BulkAdd] Error reading file:', error);
      console.error('[BulkAdd] Error details:', error);
    };
    reader.readAsText(file);
  }, []);
  
  const handleProcess = useCallback(async () => {
    if (!inputText.trim()) return;
    
    try {
      setIsProcessing(true);
      logInfo('[BulkAdd] Processing input text...');
      
      // Parse input text
      const parsedItems = parseInputText(inputText);
      if (!parsedItems || parsedItems.length === 0) {
        logError('[BulkAdd] No valid items found in input');
        return;
      }
      
      logDebug('[BulkAdd] Parsed items:', parsedItems.length);
      
      // Process items
      await processBulkAddItems(parsedItems);
      
    } catch (error) {
      logError('[BulkAdd] Error processing bulk add items:', error);
      console.error('[BulkAdd] Error details:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, processBulkAddItems]);
  
  const handleReset = useCallback(() => {
    setInputText('');
    resetProcessor();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetProcessor]);
  
  const handleSubmit = useCallback(async () => {
    try {
      await submitProcessedItems();
    } catch (error) {
      logError('[BulkAdd] Error submitting processed items:', error);
      console.error('[BulkAdd] Error details:', error);
    }
  }, [submitProcessedItems]);
  
  const handlePlaceSelection = useCallback((places, item) => {
    setPlaceOptions(places);
    setCurrentItem(item);
    setShowPlaceSelection(true);
  }, []);
  
  const handleSelectPlace = useCallback((place) => {
    if (!currentItem || !place) return;
    
    try {
      selectPlaceForItem(currentItem, place);
    } catch (error) {
      logError('[BulkAdd] Error selecting place for item:', error);
      console.error('[BulkAdd] Error details:', error);
    }
  }, [currentItem, selectPlaceForItem]);
  
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'ready':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'pending':
        return theme.palette.info.main;
      case 'processing':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  }, [theme]);
  
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'ready':
        return <Check fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'pending':
        return <Info fontSize="small" />;
      case 'processing':
        return <CircularProgress size={16} />;
      default:
        return <Info fontSize="small" />;
    }
  }, []);
  
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Add
        <Tooltip title="Add multiple restaurants or dishes at once">
          <IconButton size="small" sx={{ ml: 1 }}>
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader 
              title="Input" 
              subheader="Enter items in the format: Name | Type | Location | Tags"
            />
            <CardContent>
              <TextField
                label="Bulk Add Input"
                multiline
                rows={10}
                value={inputText}
                onChange={handleTextChange}
                fullWidth
                variant="outlined"
                placeholder="Restaurant Name | restaurant | City | tag1, tag2\nDish Name | dish | Restaurant Name | tag1, tag2"
                disabled={isProcessing}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  Upload File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                
                <Box>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleReset}
                    disabled={isProcessing || !inputText}
                    sx={{ mr: 1 }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleProcess}
                    disabled={isProcessing || !inputText.trim()}
                    startIcon={isProcessing && <CircularProgress size={20} color="inherit" />}
                  >
                    {isProcessing ? 'Processing...' : 'Process'}
                  </Button>
                </Box>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Format:</strong> Each line should contain an item in the format:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  Name | Type | Location | Tags
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Type:</strong> Either "restaurant" or "dish"
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> For restaurants, this is the city. For dishes, this is the restaurant name.
                </Typography>
                <Typography variant="body2">
                  <strong>Tags:</strong> Comma-separated list of tags (optional)
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader 
              title="Results" 
              subheader={`${processedItems.length} items processed`}
              action={
                processedItems.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || processedItems.every(item => item.status !== 'ready')}
                    startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                )
              }
            />
            <CardContent>
              {processedItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <RestaurantMenu sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No items processed yet. Enter your data and click "Process".
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {processedItems.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" component="span">
                                {item.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={item.type}
                                sx={{ ml: 1 }}
                                color={item.type === 'restaurant' ? 'primary' : 'secondary'}
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                icon={getStatusIcon(item.status)}
                                label={item.status}
                                sx={{ ml: 1 }}
                                color={item.status === 'error' ? 'error' : 'default'}
                                style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span" color="text.primary">
                                {item.type === 'restaurant' ? (
                                  <>City: {item.city_name}</>
                                ) : (
                                  <>Restaurant: {item.restaurant_name}</>
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.message}
                              </Typography>
                              {item.tags && item.tags.length > 0 && (
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {item.tags.map((tag, tagIndex) => (
                                    <Chip
                                      key={tagIndex}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      {index < processedItems.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <PlaceSelectionDialog
        open={showPlaceSelection}
        onClose={() => setShowPlaceSelection(false)}
        places={placeOptions}
        itemData={currentItem}
        onSelectPlace={handleSelectPlace}
      />
    </Box>
  );
};

export default BulkAdd;
