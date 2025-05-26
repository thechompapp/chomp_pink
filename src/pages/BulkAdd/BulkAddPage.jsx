/**
 * BulkAddPage Component
 * 
 * Main container for the Bulk Add workflow. Orchestrates the interaction
 * between input parsing, place resolution, and submission components.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Alert, CircularProgress, Stepper, Step, StepLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InputMode from './InputMode';
import ReviewMode from './ReviewMode';
import PlaceSelectionDialog from './PlaceSelectionDialog';
import useInputParser from '@/hooks/useInputParser';
import usePlaceResolver from '@/hooks/usePlaceResolver';
import useBulkSubmitter from '@/hooks/useBulkSubmitter';
import { logDebug, logError, logInfo } from '@/utils/logger';

// Steps in the bulk add workflow
const STEPS = [
  { label: 'Input', value: 'input' },
  { label: 'Process', value: 'process' },
  { label: 'Review', value: 'review' },
  { label: 'Submit', value: 'submit' }
];

/**
 * BulkAddPage Component
 * @returns {JSX.Element} Rendered component
 */
const BulkAddPage = () => {
  // Navigation
  const navigate = useNavigate();
  
  // State for workflow
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState('input');
  const [inputText, setInputText] = useState('');
  const [localError, setLocalError] = useState(null);
  
  // Custom hooks for different stages of the workflow
  const { 
    parsedItems, 
    parseError, 
    isParsing, 
    parseInput, 
    resetParser 
  } = useInputParser();
  
  const { 
    resolvedItems, 
    isResolving, 
    resolvingError, 
    placeSelections, 
    awaitingSelection, 
    currentItem, 
    resolvePlaces, 
    selectPlace, 
    cancelPlaceSelection, 
    resetResolver 
  } = usePlaceResolver();
  
  const { 
    submittedItems, 
    isSubmitting, 
    submissionError, 
    submissionResult, 
    progress, 
    submitItems, 
    resetSubmitter 
  } = useBulkSubmitter();
  
  // Determine which error to display (prioritize errors from hooks)
  const displayError = parseError || resolvingError || submissionError || localError;
  
  // Handle input text change
  const handleInputChange = useCallback((text) => {
    setInputText(text);
    setLocalError(null);
  }, []);
  
  // Process the input text
  const handleProcess = useCallback(async () => {
    if (!inputText.trim()) {
      setLocalError('Please enter some data to process');
      return;
    }
    
    setLocalError(null);
    
    try {
      // Parse input text
      const items = await parseInput(inputText);
      
      if (!items || items.length === 0) {
        setLocalError('No valid items found in input');
        return;
      }
      
      // Move to process step
      setActiveStep(1);
      setMode('process');
      
      // Resolve places for parsed items
      await resolvePlaces(items);
      
      // Move to review step
      setActiveStep(2);
      setMode('review');
    } catch (err) {
      logError('[BulkAddPage] Error processing input:', err);
      setLocalError(`Error processing input: ${err.message}`);
    }
  }, [inputText, parseInput, resolvePlaces]);
  
  // Handle place selection
  const handlePlaceSelection = useCallback((place) => {
    selectPlace(place);
  }, [selectPlace]);
  
  // Handle place selection cancellation
  const handlePlaceSelectionCancel = useCallback(() => {
    cancelPlaceSelection();
  }, [cancelPlaceSelection]);
  
  // Submit the processed items
  const handleSubmit = useCallback(async () => {
    try {
      // Move to submit step
      setActiveStep(3);
      setMode('submit');
      
      // Submit the resolved items
      const result = await submitItems(resolvedItems);
      
      if (result && result.success) {
        logInfo('[BulkAddPage] Items submitted successfully');
        
        // Navigate to the restaurants page after a short delay
        setTimeout(() => {
          navigate('/restaurants');
        }, 2000);
      }
    } catch (err) {
      logError('[BulkAddPage] Error submitting items:', err);
      setLocalError(`Error submitting items: ${err.message}`);
    }
  }, [resolvedItems, submitItems, navigate]);
  
  // Reset the workflow
  const handleReset = useCallback(() => {
    resetParser();
    resetResolver();
    resetSubmitter();
    setInputText('');
    setLocalError(null);
    setActiveStep(0);
    setMode('input');
    logDebug('[BulkAddPage] Reset workflow');
  }, [resetParser, resetResolver, resetSubmitter]);
  
  // Handle tab change
  const handleTabChange = useCallback((event, newValue) => {
    // Only allow changing to tabs that have been reached
    const stepIndex = STEPS.findIndex(step => step.value === newValue);
    
    if (stepIndex <= activeStep) {
      setMode(newValue);
    }
  }, [activeStep]);
  
  // Render the component
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bulk Add
      </Typography>
      
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((step, index) => (
          <Step key={step.value} completed={activeStep > index}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Error display */}
      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {displayError}
        </Alert>
      )}
      
      {/* Success message */}
      {submissionResult && submissionResult.success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Successfully added {submissionResult.added} of {submissionResult.total} items!
        </Alert>
      )}
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={mode}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Input" value="input" disabled={isSubmitting} />
          <Tab label="Process" value="process" disabled={parsedItems.length === 0 || isSubmitting} />
          <Tab label="Review" value="review" disabled={resolvedItems.length === 0 || isSubmitting} />
          <Tab label="Submit" value="submit" disabled={!submissionResult} />
        </Tabs>
      </Paper>
      
      {/* Loading indicators */}
      {isParsing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Parsing input...
          </Typography>
        </Box>
      )}
      
      {isResolving && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Resolving places...
          </Typography>
        </Box>
      )}
      
      {isSubmitting && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress variant="determinate" value={progress} />
          <Typography variant="body1" sx={{ mt: 1 }}>
            Submitting items... {progress}%
          </Typography>
        </Box>
      )}
      
      {/* Content based on mode */}
      {!isParsing && mode === 'input' && (
        <InputMode
          inputText={inputText}
          onInputChange={handleInputChange}
          onProcess={handleProcess}
          isProcessing={isParsing}
        />
      )}
      
      {mode === 'process' && !isResolving && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Processing Complete
          </Typography>
          <Typography variant="body1">
            {parsedItems.length} items processed. Click "Review" to continue.
          </Typography>
        </Box>
      )}
      
      {mode === 'review' && !isResolving && (
        <ReviewMode
          items={resolvedItems}
          onSubmit={handleSubmit}
          onReset={handleReset}
          isSubmitting={isSubmitting}
        />
      )}
      
      {mode === 'submit' && !isSubmitting && submissionResult && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Submission Complete
          </Typography>
          <Typography variant="body1">
            {submissionResult.added} of {submissionResult.total} items added successfully.
          </Typography>
        </Box>
      )}
      
      {/* Place selection dialog */}
      {awaitingSelection && placeSelections.length > 0 && currentItem && (
        <PlaceSelectionDialog
          open={awaitingSelection}
          places={placeSelections}
          onSelect={handlePlaceSelection}
          onClose={handlePlaceSelectionCancel}
          item={currentItem}
        />
      )}
    </Box>
  );
};

export default BulkAddPage;
