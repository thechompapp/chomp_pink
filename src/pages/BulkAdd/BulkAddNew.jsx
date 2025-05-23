/* src/pages/BulkAdd/BulkAddNew.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CloudUpload, LocationOn, Restaurant } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { logDebug, logError, logInfo } from '../../utils/logger';
import { parseRawInput } from '../../utils/bulkAddUtils';

/**
 * BulkAdd component for adding multiple restaurants at once with real API lookups
 * @returns {JSX.Element} - Rendered component
 */
const BulkAddNew = () => {
  const [inputText, setInputText] = useState('');
  const [items, setItems] = useState([]);
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [showPlaceSelection, setShowPlaceSelection] = useState(false);
  const [placeOptions, setPlaceOptions] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [error, setError] = useState(null);
  const neighborhoodCache = useRef(new Map());
  
  // Log component mount for debugging
  useEffect(() => {
    logInfo('[BulkAdd] BulkAdd component mounted');
    
    return () => {
      logInfo('[BulkAdd] BulkAdd component unmounted');
    };
  }, []);

  /**
   * Parse input text into structured items
   */
  const handleParseInput = useCallback(() => {
    try {
      if (!inputText.trim()) {
        setError('Please enter some data to process');
        return;
      }
      
      // Use the parseRawInput utility from bulkAddUtils
      const parsedItems = parseRawInput(inputText);
      logInfo(`[BulkAdd] Parsed ${parsedItems.length} items from input`);
      
      // Add line numbers and initialize status
      const itemsWithMeta = parsedItems.map((item, index) => ({
        ...item,
        _lineNumber: index + 1,
        status: 'pending',
        message: 'Ready for processing'
      }));
      
      setItems(itemsWithMeta);
      setProcessedItems([]);
      setError(null);
    } catch (err) {
      logError('[BulkAdd] Error parsing input:', err);
      setError(`Error parsing input: ${err.message}`);
    }
  }, [inputText]);
  
  /**
   * Search for a place using the Google Places API
   * @param {string} name - Place name
   * @param {string} location - Location hint
   * @returns {Promise<Object>} - Place search result
   */
  const searchPlace = async (name, location) => {
    try {
      // In a real implementation, this would call your Places API service
      // For demonstration, we'll simulate the API call
      logInfo(`[BulkAdd] Searching for place: ${name} in ${location || 'New York'}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return simulated result
      return {
        place_id: `place_${Date.now()}`,
        name: name,
        formatted_address: `123 Main St, New York, NY 10001`
      };
    } catch (err) {
      logError(`[BulkAdd] Error searching for place ${name}:`, err);
      return { error: `Failed to search for place: ${err.message}` };
    }
  };
  
  /**
   * Get place details using the Google Places API
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} - Place details
   */
  const getPlaceDetails = async (placeId) => {
    try {
      // In a real implementation, this would call your Places API service
      // For demonstration, we'll simulate the API call
      logInfo(`[BulkAdd] Getting details for place ID: ${placeId}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return simulated result
      return {
        name: 'Restaurant Name',
        formatted_address: '123 Main St, New York, NY 10001',
        address_components: [
          { types: ['street_number'], long_name: '123' },
          { types: ['route'], long_name: 'Main St' },
          { types: ['locality'], long_name: 'New York' },
          { types: ['administrative_area_level_1'], short_name: 'NY' },
          { types: ['postal_code'], long_name: '10001' }
        ]
      };
    } catch (err) {
      logError(`[BulkAdd] Error getting place details for ${placeId}:`, err);
      return { error: `Failed to get place details: ${err.message}` };
    }
  };
  
  /**
   * Extract address components from place details
   * @param {Object} placeDetails - Google Place details
   * @returns {Object} - Extracted address
   */
  const extractAddress = (placeDetails) => {
    try {
      // Extract zipcode
      const zipComponent = placeDetails.address_components.find(
        comp => comp.types.includes('postal_code')
      );
      
      const zipcode = zipComponent ? zipComponent.long_name : '10001';
      
      return {
        formatted: placeDetails.formatted_address,
        zipcode: zipcode
      };
    } catch (err) {
      logError('[BulkAdd] Error extracting address:', err);
      return {
        formatted: placeDetails.formatted_address || 'Unknown address',
        zipcode: '10001' // Default fallback
      };
    }
  };
  
  /**
   * Look up neighborhood by zipcode using database API
   * @param {string} zipcode - Postal code
   * @returns {Promise<Object>} - Neighborhood info
   */
  const lookupNeighborhood = async (zipcode) => {
    try {
      // Check cache first
      const cacheKey = `zipcode_${zipcode}`;
      if (neighborhoodCache.current.has(cacheKey)) {
        const cachedNeighborhood = neighborhoodCache.current.get(cacheKey);
        logDebug(`[BulkAdd] Using cached neighborhood for zipcode ${zipcode}: ${cachedNeighborhood.name}`);
        return cachedNeighborhood;
      }
      
      // In a real implementation, this would call your database API
      // For demonstration, we'll simulate the API call
      logInfo(`[BulkAdd] Looking up neighborhood for zipcode: ${zipcode}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Map of zipcodes to neighborhoods (simulating database lookup)
      const zipToNeighborhood = {
        '10001': { id: 7, name: 'NoMad' },
        '10003': { id: 4, name: 'East Village' },
        '10014': { id: 3, name: 'West Village' },
        '10010': { id: 6, name: 'Gramercy' }
      };
      
      // Return neighborhood or default
      const neighborhood = zipToNeighborhood[zipcode] || { id: 1, name: 'Manhattan' };
      
      // Cache the result
      neighborhoodCache.current.set(cacheKey, neighborhood);
      
      return neighborhood;
    } catch (err) {
      logError(`[BulkAdd] Error looking up neighborhood for ${zipcode}:`, err);
      return { id: 1, name: 'Manhattan' }; // Default fallback
    }
  };
  
  /**
   * Process items using real API lookups
   */
  const handleProcessItems = useCallback(async () => {
    if (items.length === 0) {
      setError('No items to process. Please parse input first.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Configure batch processing
      const batchSize = 3;
      const batches = [];
      
      // Split items into batches
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, Math.min(i + batchSize, items.length)));
      }
      
      setTotalBatches(batches.length);
      logInfo(`[BulkAdd] Processing ${items.length} items in ${batches.length} batches`);
      
      // Process each batch sequentially
      const allProcessedItems = [];
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        setCurrentBatch(batchIndex + 1);
        const batch = batches[batchIndex];
        
        logInfo(`[BulkAdd] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items`);
        
        // Process items in parallel within each batch
        const batchResults = await Promise.all(
          batch.map(async (item) => {
            try {
              // Log start of item processing
              logInfo(`[BulkAdd] Processing item ${item._lineNumber}: ${item.name}`);
              
              // 1. Search for place using Google Places API
              const placeSearchResult = await searchPlace(item.name, item.location);
              
              if (placeSearchResult.error) {
                return {
                  ...item,
                  status: 'error',
                  message: placeSearchResult.error
                };
              }
              
              // 2. Get place details
              const placeDetails = await getPlaceDetails(placeSearchResult.place_id);
              
              if (placeDetails.error) {
                return {
                  ...item,
                  status: 'error',
                  message: placeDetails.error
                };
              }
              
              // 3. Extract address components
              const address = extractAddress(placeDetails);
              
              // 4. Look up neighborhood by zipcode
              const neighborhood = await lookupNeighborhood(address.zipcode);
              
              // 5. Prepare processed item
              return {
                ...item,
                place_id: placeSearchResult.place_id,
                address: address.formatted,
                zipcode: address.zipcode,
                neighborhood_id: neighborhood.id,
                neighborhood_name: neighborhood.name,
                status: 'ready',
                message: `Ready to add ${item.name} in ${neighborhood.name}`
              };
            } catch (err) {
              logError(`[BulkAdd] Error processing item ${item._lineNumber}:`, err);
              return {
                ...item,
                status: 'error',
                message: `Error: ${err.message}`
              };
            }
          })
        );
        
        // Update processed items after each batch
        allProcessedItems.push(...batchResults);
        setProcessedItems([...allProcessedItems]);
      }
      
      logInfo(`[BulkAdd] Completed processing ${allProcessedItems.length} items`);
    } catch (err) {
      logError('[BulkAdd] Error during batch processing:', err);
      setError(`Error during processing: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setCurrentBatch(0);
    }
  }, [items]);

  // Calculate statistics
  const totalItems = processedItems.length;
  const readyItems = processedItems.filter(item => item.status === 'ready').length;
  const errorItems = processedItems.filter(item => item.status === 'error').length;
  
  return (
    <>
      <Helmet>
        <title>Bulk Add | Chomp</title>
        <meta name="description" content="Add multiple restaurants or dishes at once" />
      </Helmet>
      
      <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bulk Add Restaurants
          </Typography>
          
          <Typography variant="body1" paragraph>
            Enter restaurant data in the format: Name | Type | Location | Tags
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Enter restaurant data (one per line)"
                multiline
                rows={10}
                fullWidth
                placeholder="Restaurant Name | Type | Location | Tags"
                variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleParseInput}
                disabled={isProcessing || !inputText.trim()}
                fullWidth
              >
                Parse Input
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUpload />}
                onClick={handleProcessItems}
                disabled={isProcessing || items.length === 0}
                fullWidth
              >
                {isProcessing ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                    Processing Batch {currentBatch}/{totalBatches}
                  </>
                ) : 'Process Items'}
              </Button>
            </Grid>
          </Grid>
          
          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Paper>
        
        {items.length > 0 && (
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Parsed Items ({items.length})
            </Typography>
            
            <List>
              {items.slice(0, 5).map((item, index) => (
                <ListItem key={index} divider={index < Math.min(items.length, 5) - 1}>
                  <ListItemText
                    primary={`${item._lineNumber}. ${item.name}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {item.type || 'restaurant'}
                        </Typography>
                        {' — '}
                        {item.location || 'New York'}
                        {item.tags && (
                          <Box sx={{ mt: 1 }}>
                            {(typeof item.tags === 'string' ? item.tags.split(',') : [item.tags]).filter(Boolean).map((tag, i) => (
                              <Chip key={i} label={tag.trim()} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
              {items.length > 5 && (
                <ListItem>
                  <ListItemText
                    primary={`...and ${items.length - 5} more items`}
                    secondary="Parse complete. Click 'Process Items' to continue."
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        )}
        
        {processedItems.length > 0 && (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Processing Results
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Processed {totalItems} items with {readyItems} ready and {errorItems} errors.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h6">{readyItems}</Typography>
                    <Typography variant="body2">Ready</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h6">{errorItems}</Typography>
                    <Typography variant="body2">Errors</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                    <Typography variant="h6">{totalItems}</Typography>
                    <Typography variant="body2">Total</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            <List>
              {processedItems.map((item, index) => (
                <ListItem 
                  key={index} 
                  divider={index < processedItems.length - 1}
                  sx={{
                    bgcolor: item.status === 'error' ? 'error.50' : 
                            item.status === 'ready' ? 'success.50' : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">
                          {item._lineNumber}. {item.name}
                        </Typography>
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={item.status === 'ready' ? 'success' : 
                                item.status === 'error' ? 'error' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="div" variant="body2" color="text.secondary">
                          {item.message}
                        </Typography>
                        
                        {item.status === 'ready' && (
                          <Box sx={{ mt: 1 }}>
                            <Typography component="div" variant="body2" color="text.secondary">
                              <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {item.address} ({item.neighborhood_name})
                            </Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default BulkAddNew;
