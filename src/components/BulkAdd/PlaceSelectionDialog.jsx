import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Chip,
  Rating,
  Paper
} from '@mui/material';
import { LocationOn, Star, Restaurant, Info } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { logDebug, logError } from '../../utils/logger';

/**
 * Dialog for selecting a place when multiple options are found
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Array} props.places - Array of place options
 * @param {Object} props.itemData - Original item data
 * @param {Function} props.onSelectPlace - Function to call when place is selected
 * @returns {JSX.Element} - Rendered component
 */
const PlaceSelectionDialog = ({
  open,
  onClose,
  places = [],
  itemData = {},
  onSelectPlace
}) => {
  const theme = useTheme();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Reset selection when dialog opens with new places
  useEffect(() => {
    if (open && places.length > 0) {
      setSelectedPlace(null);
      logDebug('[PlaceSelectionDialog] Dialog opened with places:', places.length);
    }
  }, [open, places]);
  
  const handleSelect = useCallback((place) => {
    setSelectedPlace(place);
  }, []);
  
  const handleConfirm = useCallback(() => {
    if (!selectedPlace) return;
    
    setLoading(true);
    try {
      logDebug('[PlaceSelectionDialog] Selected place:', selectedPlace);
      // Pass both the selected place and the item data to the onSelectPlace function
      onSelectPlace(selectedPlace, itemData);
      setLoading(false);
      onClose();
    } catch (error) {
      logError('[PlaceSelectionDialog] Error selecting place:', error);
      console.error('[PlaceSelectionDialog] Error details:', error);
      setLoading(false);
    }
  }, [selectedPlace, onSelectPlace, onClose, itemData]);
  
  const renderPlaceDetails = useCallback((place) => {
    if (!place) return null;
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.background.paper, borderRadius: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {place.name}
        </Typography>
        
        {place.formatted_address && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
            <LocationOn fontSize="small" sx={{ mr: 1, mt: 0.5 }} color="primary" />
            <Typography variant="body2">{place.formatted_address}</Typography>
          </Box>
        )}
        
        {place.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Rating 
              value={place.rating} 
              readOnly 
              precision={0.1} 
              size="small"
              emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {place.rating} ({place.user_ratings_total || 0} reviews)
            </Typography>
          </Box>
        )}
        
        {place.types && place.types.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {place.types.slice(0, 5).map((type, index) => (
              <Chip 
                key={index} 
                label={type.replace(/_/g, ' ')} 
                size="small" 
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }, [theme]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          Multiple Places Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We found multiple restaurants that match your entry. Please select the correct one.
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ pt: 3 }}>
        {/* Original Entry Card */}
        {itemData && (
          <Paper 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'primary.50', 
              borderColor: 'primary.200',
              borderRadius: 1 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Info color="primary" sx={{ mr: 1.5, mt: 0.3 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom color="primary.dark">
                  Your original entry:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {itemData.name}
                </Typography>
                {itemData.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', opacity: 0.7 }} />
                    <Typography variant="body2">
                      {itemData.location}
                    </Typography>
                  </Box>
                )}
                {itemData.tags && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                      Tags: 
                    </Typography>
                    {typeof itemData.tags === 'string' 
                      ? itemData.tags.split(',').map((tag, i) => (
                          <Chip 
                            key={i} 
                            label={tag.trim()} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))
                      : null
                    }
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        )}
        
        {/* Selection Instructions */}
        <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mb: 2 }}>
          Select the correct restaurant:
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <List sx={{ pt: 0, pb: 0 }} disablePadding>
              {places.map((place, index) => (
                <React.Fragment key={place.place_id || index}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem 
                    button 
                    onClick={() => handleSelect(place)}
                    selected={selectedPlace && selectedPlace.place_id === place.place_id}
                    sx={{
                      py: 2,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        bgcolor: 'primary.50',
                        borderLeft: '4px solid',
                        borderLeftColor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.100'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: selectedPlace && selectedPlace.place_id === place.place_id 
                            ? theme.palette.primary.main 
                            : theme.palette.grey[200],
                          color: selectedPlace && selectedPlace.place_id === place.place_id 
                            ? 'white' 
                            : theme.palette.text.primary
                        }}
                      >
                        <Restaurant />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" fontWeight="medium">
                          {place.name || place.description}
                        </Typography>
                      } 
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem', opacity: 0.7 }} />
                            <Typography variant="body2" color="text.secondary">
                              {place.formatted_address || place.description}
                            </Typography>
                          </Box>
                          {place.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Rating 
                                value={place.rating} 
                                readOnly 
                                precision={0.5} 
                                size="small" 
                              />
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                ({place.user_ratings_total || 0})
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      } 
                    />
                    {selectedPlace && selectedPlace.place_id === place.place_id && (
                      <Chip 
                        label="Selected" 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
        
        {/* Selected Place Details */}
        {selectedPlace && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Selected Restaurant Details:
            </Typography>
            {renderPlaceDetails(selectedPlace)}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={!selectedPlace || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ 
            px: 3,
            py: 1,
            fontWeight: 500,
            boxShadow: 2
          }}
        >
          {loading ? 'Selecting...' : 'Select'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlaceSelectionDialog;
