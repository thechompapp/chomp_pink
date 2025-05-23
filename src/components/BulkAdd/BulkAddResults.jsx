/* src/components/BulkAdd/BulkAddResults.jsx */
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Divider,
  Button
} from '@mui/material';
import { LocationOn, CheckCircle, Error, HourglassEmpty, Restaurant, CloudUpload } from '@mui/icons-material';
import { logInfo, logError } from '../../utils/logger';

/**
 * BulkAddResults component for displaying parsed and processed items
 * @param {Object} props - Component props
 * @param {Array} props.items - Parsed items
 * @param {Array} props.processedItems - Processed items
 * @param {Function} props.onProcessItems - Function to process items
 * @returns {JSX.Element} - Rendered component
 */
const BulkAddResults = ({ items = [], processedItems = [], onProcessItems }) => {
  // Calculate statistics
  const totalItems = processedItems.length;
  const readyItems = processedItems.filter(item => item.status === 'ready').length;
  const errorItems = processedItems.filter(item => item.status === 'error').length;
  const pendingItems = processedItems.filter(item => item.status === 'pending').length;
  
  // Render tags for an item
  const renderTags = (tags) => {
    if (!tags) return null;
    
    const tagArray = typeof tags === 'string' 
      ? tags.split(',').filter(Boolean)
      : Array.isArray(tags) ? tags.filter(Boolean) : [];
    
    if (tagArray.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
        {tagArray.map((tag, i) => (
          <Chip 
            key={i} 
            label={typeof tag === 'string' ? tag.trim() : String(tag)} 
            size="small" 
            sx={{ mr: 0.5, mb: 0.5 }} 
          />
        ))}
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Parsed Items Section */}
      {items.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Parsed Items
            </Typography>
            <Chip 
              label={items.length} 
              size="small" 
              color="primary" 
              sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} 
            />
          </Box>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              borderRadius: 1,
              overflow: 'hidden',
              maxHeight: processedItems.length > 0 ? 200 : 400,
              overflowY: 'auto'
            }}
          >
            <List disablePadding>
              {items.slice(0, 10).map((item, index) => (
                <ListItem 
                  key={index} 
                  divider={index < Math.min(items.length, 10) - 1}
                  sx={{ py: 1.5 }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          mr: 1.5
                        }}
                      >
                        {item._lineNumber || index + 1}
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {item.name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 5 }}>
                      <Typography 
                        component="span" 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          mr: 2
                        }}
                      >
                        <Restaurant fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', opacity: 0.7 }} />
                        {item.type || 'restaurant'}
                      </Typography>
                      
                      {item.location && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: 'inline-flex',
                            alignItems: 'center' 
                          }}
                        >
                          <LocationOn fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', opacity: 0.7 }} />
                          {item.location}
                        </Typography>
                      )}
                    </Box>
                    
                    {renderTags(item.tags)}
                  </Box>
                </ListItem>
              ))}
              
              {items.length > 10 && (
                <ListItem sx={{ py: 1.5, bgcolor: 'action.hover' }}>
                  <ListItemText
                    primary={`...and ${items.length - 10} more items`}
                    secondary="Parse complete. Click 'Process Items' to continue."
                  />
                </ListItem>
              )}
            </List>
          </Paper>
          
          {processedItems.length === 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<CloudUpload />}
                onClick={async () => {
                  logInfo('[BulkAddResults] Process Items button clicked');
                  if (typeof onProcessItems === 'function') {
                    try {
                      await onProcessItems();
                      logInfo('[BulkAddResults] Items processed successfully');
                    } catch (error) {
                      logError('[BulkAddResults] Error processing items:', error);
                    }
                  } else {
                    logError('[BulkAddResults] onProcessItems is not a function', { onProcessItems });
                  }
                }}
                sx={{ mt: 1 }}
              >
                Process Items
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Click to look up restaurant details and add them
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {/* Processing Results Section */}
      {processedItems.length > 0 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Processing Results
            </Typography>
            <Chip 
              label={processedItems.length} 
              size="small" 
              color="primary" 
              sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} 
            />
          </Box>
          
          {/* Status Cards */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center', 
                    bgcolor: 'success.50',
                    border: '1px solid',
                    borderColor: 'success.200',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="h6" color="success.main">{readyItems}</Typography>
                  <Typography variant="caption" color="success.dark">Ready</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center', 
                    bgcolor: 'error.50',
                    border: '1px solid',
                    borderColor: 'error.200',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="h6" color="error.main">{errorItems}</Typography>
                  <Typography variant="caption" color="error.dark">Errors</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center', 
                    bgcolor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.200',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="h6" color="primary.main">{totalItems}</Typography>
                  <Typography variant="caption" color="primary.dark">Total</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Results List */}
          <Paper 
            variant="outlined" 
            sx={{ 
              borderRadius: 1,
              overflow: 'hidden',
              flex: 1,
              maxHeight: 400,
              overflowY: 'auto'
            }}
          >
            <List disablePadding>
              {processedItems.map((item, index) => (
                <ListItem 
                  key={index} 
                  divider={index < processedItems.length - 1}
                  sx={{
                    py: 1.5,
                    borderLeft: '4px solid',
                    borderLeftColor: 
                      item.status === 'ready' ? 'success.main' : 
                      item.status === 'error' ? 'error.main' : 
                      item.status === 'pending' ? 'warning.main' : 'divider',
                    bgcolor: 
                      item.status === 'ready' ? 'success.50' : 
                      item.status === 'error' ? 'error.50' : 
                      item.status === 'pending' ? 'warning.50' : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <Chip 
                            label={item.status} 
                            size="small" 
                            color={item.status === 'ready' ? 'success' : 
                                  item.status === 'error' ? 'error' : 
                                  item.status === 'pending' ? 'warning' : 'default'}
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Line {item._lineNumber || index + 1}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {/* Status Message */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          {item.status === 'ready' && <CheckCircle fontSize="small" color="success" sx={{ mt: 0.3, mr: 0.5, fontSize: '1rem' }} />}
                          {item.status === 'error' && <Error fontSize="small" color="error" sx={{ mt: 0.3, mr: 0.5, fontSize: '1rem' }} />}
                          {item.status === 'pending' && <HourglassEmpty fontSize="small" color="warning" sx={{ mt: 0.3, mr: 0.5, fontSize: '1rem' }} />}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {item.message}
                          </Typography>
                        </Box>
                        
                        {/* Location Info for Ready Items */}
                        {item.status === 'ready' && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start' }}>
                            <LocationOn fontSize="small" color="primary" sx={{ mt: 0.3, mr: 0.5, fontSize: '1rem' }} />
                            <Typography component="span" variant="body2" color="text.secondary">
                              {item.address} {item.neighborhood_name && (
                                <Chip 
                                  label={item.neighborhood_name} 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                  sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                                />
                              )}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Tags for Ready Items */}
                        {item.status === 'ready' && renderTags(item.tags)}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );

};

export default BulkAddResults;
