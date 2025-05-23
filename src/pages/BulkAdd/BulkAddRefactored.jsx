/* src/pages/BulkAdd/BulkAddRefactored.jsx */
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import useBulkAddProcessorV2 from '../../hooks/useBulkAddProcessorV2';
import BulkAddForm from '../../components/BulkAdd/BulkAddForm';
import BulkAddResults from '../../components/BulkAdd/BulkAddResults';
import PlaceSelectionDialog from '../../components/BulkAdd/PlaceSelectionDialog';
import { logInfo, logError } from '../../utils/logger';

/**
 * BulkAdd component for adding multiple restaurants at once with real API lookups
 * @returns {JSX.Element} - Rendered component
 */
const BulkAddRefactored = () => {
  // Input text state
  const [inputText, setInputText] = useState('');
  
  // Get bulk add processor hook
  const {
    parseItems,
    processItems,
    processBulkAddItems,
    items,
    processedItems,
    isProcessing,
    currentBatch,
    totalBatches,
    error,
    placeSelections,
    awaitingSelection,
    selectPlace,
    cancelPlaceSelection,
    resetProcessor,
    currentProcessingItem
  } = useBulkAddProcessorV2('restaurants');
  
  // Handle parse input button click
  const handleParseInput = () => {
    if (!inputText.trim()) {
      return;
    }
    
    try {
      parseItems(inputText);
    } catch (err) {
      logError('[BulkAdd] Error parsing input:', err);
    }
  };
  
  // Handle process items button click
  const handleProcessItems = async () => {
    logInfo('[BulkAdd] handleProcessItems called');
    console.log('[BulkAdd] handleProcessItems called with items:', items);
    console.log('[BulkAdd] processBulkAddItems function:', processBulkAddItems);
    
    if (items.length === 0) {
      logInfo('[BulkAdd] No items to process');
      console.log('[BulkAdd] No items to process');
      return;
    }
    
    try {
      logInfo(`[BulkAdd] About to process ${items.length} items`, { items });
      console.log(`[BulkAdd] About to process ${items.length} items:`, items);
      
      // Use the correct function name - processBulkAddItems instead of processItems
      // Make sure to await the Promise
      const result = await processBulkAddItems(items);
      console.log('[BulkAdd] Process result:', result);
      
      logInfo(`[BulkAdd] Processing ${items.length} items`);
    } catch (err) {
      console.error('[BulkAdd] Error processing items:', err);
      logError('[BulkAdd] Error processing items:', err);
    }
  };
  
  // Log component mount for debugging
  useEffect(() => {
    logInfo('[BulkAdd] Refactored BulkAdd component mounted');
    
    return () => {
      logInfo('[BulkAdd] Refactored BulkAdd component unmounted');
      resetProcessor();
    };
  }, [resetProcessor]);
  
  return (
    <>
      <Helmet>
        <title>Bulk Add | Chomp</title>
        <meta name="description" content="Add multiple restaurants or dishes at once" />
      </Helmet>
      
      <Container maxWidth="lg">
        <Box sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary.main">
              Bulk Add Restaurants
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              Add multiple restaurants at once by entering them in a simple format.
              We'll look up the details and add them to your collection.
            </Typography>
          </Box>
          
          {/* Main Content */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Input Form Section */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, sm: 4 }, 
                flex: { md: '0 0 50%' },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  width: 28, 
                  height: 28, 
                  borderRadius: '50%', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                Enter Restaurant Data
              </Typography>
              
              <BulkAddForm
                inputText={inputText}
                setInputText={setInputText}
                onParseInput={handleParseInput}
                onProcessItems={handleProcessItems}
                isProcessing={isProcessing}
                currentBatch={currentBatch}
                totalBatches={totalBatches}
                error={error}
                itemCount={items.length}
              />
            </Paper>
            
            {/* Results Section */}
            <Box sx={{ flex: { md: '0 0 50%' } }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box component="span" sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mr: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    2
                  </Box>
                  Review Results
                </Typography>
                
                {items.length === 0 && processedItems.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flex: 1,
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <Restaurant sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" align="center">
                      Enter restaurant data and click "Parse Input" to get started
                    </Typography>
                  </Box>
                ) : (
                  <BulkAddResults
                    items={items}
                    processedItems={processedItems}
                    onProcessItems={handleProcessItems}
                  />
                )}
              </Paper>
            </Box>
          </Box>
          
          {/* Place Selection Dialog */}
          <PlaceSelectionDialog
            open={awaitingSelection}
            onClose={cancelPlaceSelection}
            places={placeSelections}
            itemData={currentProcessingItem}
            onSelectPlace={selectPlace}
          />
        </Box>
      </Container>
    </>
  );
};

export default BulkAddRefactored;
