# Bulk Add Feature Documentation

## Overview

The Bulk Add feature allows users to add multiple restaurants or dishes to the Chomp app in a single operation. The feature has been refactored to improve performance, maintainability, and user experience.

## Architecture

The Bulk Add feature follows a modular architecture with clear separation of concerns:

### Components

1. **BulkAdd Component** (`src/pages/BulkAdd/index.jsx`)
   - Main component that manages the UI and user interactions
   - Handles mode switching between input and review
   - Coordinates with the processor hook for data processing

2. **InputMode Component** (`src/pages/BulkAdd/InputMode.jsx`)
   - Handles raw text input from users
   - Provides instructions and examples

3. **ReviewMode Component** (`src/pages/BulkAdd/ReviewMode.jsx`)
   - Displays processed items for user review
   - Shows status and error messages for each item
   - Allows users to submit reviewed items

4. **PlaceSelectionDialog Component** (`src/pages/BulkAdd/PlaceSelectionDialog.jsx`)
   - Enhanced dialog for selecting the correct place when multiple options are found
   - Provides rich context including ratings, address details, and photos

### Hooks

1. **useBulkAddProcessorV2** (`src/hooks/useBulkAddProcessorV2.js`)
   - Core processing logic for bulk add operations
   - Handles API calls, data transformation, and state management
   - Implements batch processing for improved performance
   - Provides clear error messages and status updates

### Utilities

1. **bulkAddUtils** (`src/utils/bulkAddUtils.js`)
   - Contains utility functions for common operations
   - Handles duplicate detection, address parsing, and data formatting
   - Provides batch processing utilities for performance optimization

## Data Flow

1. User enters raw text in the InputMode component
2. Text is passed to the `processInputData` function in useBulkAddProcessorV2
3. Raw text is parsed into structured items with initial status
4. Items are processed in batches to improve performance
5. For each item:
   - Place lookup is performed using Google Places API
   - If multiple places are found, user is prompted to select the correct one
   - Place details are fetched and processed
   - Address components are extracted and neighborhood information is added
   - Item is marked as ready for submission
6. Processed items are displayed in the ReviewMode component
7. User reviews and submits items
8. Items are submitted in batches to the backend

## Key Features

### Batch Processing

The refactored implementation uses batch processing to improve performance:

```javascript
// Process items in batches for better performance
const batchProcess = async (items, processFn, batchSize = BULK_ADD_CONFIG.batchSize) => {
  // Implementation in bulkAddUtils.js
};
```

### Enhanced Place Selection

The place selection dialog has been enhanced to provide more context for users:

- Restaurant photos
- Ratings and reviews
- Price level indicators
- Detailed address information
- Neighborhood and ZIP code

### Improved Error Handling

The refactored implementation provides more specific error messages based on the error type:

- Network errors
- Authentication errors
- Permission issues
- API quota exceeded
- Server errors

## Usage Examples

### Adding Restaurants

```
Joe's Pizza, 123 Main St, New York, NY 10001
Sushi Palace, 456 Broadway, New York, NY 10002
Taco Heaven, 789 Park Ave, New York, NY 10003
```

### Adding Dishes (Future Implementation)

```
Margherita Pizza, Joe's Pizza
California Roll, Sushi Palace
Carne Asada Taco, Taco Heaven
```

## Best Practices

1. **Input Format**: Each item should be on a separate line with commas separating fields
2. **Address Details**: Include as much address information as possible for accurate place lookup
3. **Batch Size**: The default batch size is 5 items, which balances performance and API usage
4. **Error Handling**: Check the status and message for each item to identify and resolve issues

## Troubleshooting

### Common Issues

1. **Place Not Found**: Ensure the restaurant name and address are accurate
2. **Multiple Places Found**: Use the enhanced place selection dialog to choose the correct place
3. **Missing Neighborhood**: The system will attempt to find the neighborhood based on ZIP code
4. **API Quota Exceeded**: Wait and try again later, or process in smaller batches

### Debugging

The implementation includes extensive logging for debugging:

```javascript
logDebug(`[BulkAddProcessor] Processing item: ${item.name}`);
logError(`[BulkAddProcessor] Error processing place:`, error);
```

## Future Improvements

1. **Dish Processing**: Complete implementation of dish processing functionality
2. **Offline Support**: Add support for queueing bulk add operations when offline
3. **Custom Neighborhoods**: Allow users to specify custom neighborhoods
4. **Bulk Edit**: Add support for bulk editing of existing items
5. **Import/Export**: Add support for importing/exporting items from/to CSV files
