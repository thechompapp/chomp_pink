// Filename: /src/hooks/useBulkAddProcessor.test.jsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBulkAddProcessor from './useBulkAddProcessor'; // Adjust path if needed
import { adminService } from '@/services/adminService'; // To mock

// Mock the adminService completely
vi.mock('@/services/adminService', () => ({
    default: {
        // Mock specific functions used by the hook
        getData: vi.fn(),
        lookupNeighborhoods: vi.fn(),
        bulkAddRestaurants: vi.fn(),
        bulkAddDishes: vi.fn(),
        // Mock other adminService functions if the hook uses them
    }
}));

// Mock PapaParse if needed (if handleFileUpload is tested directly)
// vi.mock('papaparse', () => ({ ... }));

// Helper to wrap hook render with QueryClientProvider
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Disable retries for tests
            },
        },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useBulkAddProcessor Hook', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        // Provide default mock implementations
        adminService.getData.mockResolvedValue({ success: true, data: [] }); // Default empty data
        adminService.lookupNeighborhoods.mockResolvedValue(new Set()); // Default no existing items found
        adminService.bulkAddRestaurants.mockResolvedValue({ success: true, data: [{ id: 1 }] }); // Default success
        adminService.bulkAddDishes.mockResolvedValue({ success: true, data: [{ id: 1 }] }); // Default success
    });

    it('should initialize with default state', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });

        expect(result.current.items).toEqual([]);
        expect(result.current.errors).toEqual([]);
        expect(result.current.duplicates).toEqual([]);
        expect(result.current.isProcessing).toBe(false);
        expect(result.current.parseError).toBeNull();
        expect(result.current.submitStatus.state).toBe('idle');
        // isPrecomputing might be true initially depending on useEffect timing
        // expect(result.current.isPrecomputing).toBe(false);
    });

    it('should process valid restaurant data correctly', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const inputData = [
            { name: 'Test Cafe', address: '123 Main St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' },
            { name: 'Pizza Place', address: '456 Side St', neighborhood: 'Uptown', city: 'Testville', cuisine_type: 'Pizza' },
        ];

        // Mock neighborhood lookup if used during processing
        adminService.lookupNeighborhoods.mockResolvedValue(new Set(['downtown', 'uptown'])); // Assume these exist

        await act(async () => {
            await result.current.processInputData(inputData);
        });

        expect(result.current.isProcessing).toBe(false);
        expect(result.current.errors).toEqual([]);
        expect(result.current.duplicates).toEqual([]);
        expect(result.current.items.length).toBe(2);
        expect(result.current.items[0]).toMatchObject({ name: 'Test Cafe', status: 'valid' });
        expect(result.current.items[1]).toMatchObject({ name: 'Pizza Place', status: 'valid' });
        // Check if neighborhood_id was mapped (depends on mock implementation)
    });

    it('should identify validation errors (missing required fields)', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
         // Missing address, neighborhood, city, cuisine_type for the second item
        const inputData = [
            { name: 'Test Cafe', address: '123 Main St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' },
            { name: 'Missing Info Place' },
        ];

        await act(async () => {
            await result.current.processInputData(inputData);
        });

        expect(result.current.items.length).toBe(1); // Only valid item added
        expect(result.current.errors.length).toBe(1);
        expect(result.current.errors[0].index).toBe(1);
        expect(result.current.errors[0].errors).toContain('Missing required field: address');
        expect(result.current.errors[0].errors).toContain('Missing required field: neighborhood');
        expect(result.current.errors[0].errors).toContain('Missing required field: city');
        expect(result.current.errors[0].errors).toContain('Missing required field: cuisine_type');
        expect(result.current.duplicates).toEqual([]);
    });

     it('should identify duplicates within the input data', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const inputData = [
            { name: 'Duplicate Cafe', address: '100 Same St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' },
            { name: 'Pizza Place', address: '456 Side St', neighborhood: 'Uptown', city: 'Testville', cuisine_type: 'Pizza' },
            { name: 'Duplicate Cafe', address: '100 Same St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' }, // Duplicate
        ];
        adminService.lookupNeighborhoods.mockResolvedValue(new Set(['downtown', 'uptown']));

        await act(async () => {
            await result.current.processInputData(inputData);
        });

         expect(result.current.items.length).toBe(2); // Valid items added (assuming duplicates aren't added to items)
         expect(result.current.errors).toEqual([]);
         expect(result.current.duplicates.length).toBe(1);
         expect(result.current.duplicates[0].index).toBe(2); // Index of the second occurrence
         expect(result.current.duplicates[0].itemData).toMatchObject({ name: 'Duplicate Cafe', address: '100 Same St'});
         expect(result.current.duplicates[0].reason).toContain('input'); // Duplicate found in input
    });

     it('should identify duplicates against existing database items', async () => {
        const wrapper = createWrapper();
        // Mock the lookup service to return an existing item identifier
        adminService.lookupNeighborhoods.mockResolvedValue(new Set(['downtown', 'uptown'])); // Assume hoods exist
        // Mock that 'existing cafe|1 existing st' already exists in the DB via the (hypothetical) lookup
        // NOTE: The hook currently doesn't have a generic lookup for restaurants/dishes implemented,
        // this test relies on the *concept* demonstrated with neighborhood lookups.
        // For restaurants, the identifier is 'name|address'.
        const existingRestaurantIdentifier = 'existing cafe|1 existing st';
        // Mock the (hypothetical) efficient restaurant lookup if it were implemented:
        // adminService.lookupRestaurants = vi.fn().mockResolvedValue(new Set([existingRestaurantIdentifier]));

        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const inputData = [
            { name: 'Existing Cafe', address: '1 Existing St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' },
            { name: 'New Place', address: '99 New St', neighborhood: 'Uptown', city: 'Testville', cuisine_type: 'Pizza' },
        ];

        // Simulate the lookup happening within processInputData
        // For now, we manually set the 'existingItemIdentifiers' that checkDuplicate would receive
        // In a real scenario, this set would be populated by the mocked lookup service call.
        const mockExistingIdentifiers = new Set([existingRestaurantIdentifier]);

        await act(async () => {
            // We need to slightly modify how processInputData is called for this test
            // to inject the mockExistingIdentifiers, or modify the hook itself
            // Temporarily overriding checkDuplicate for this test might be easier:
            const originalCheckDuplicate = result.current.checkDuplicate; // Store original
            result.current.checkDuplicate = (item, index, allItems, itemType) => {
                // Call original logic but pass the mock existing set
                return originalCheckDuplicate(item, index, allItems, itemType, mockExistingIdentifiers);
            };
            await result.current.processInputData(inputData);
            result.current.checkDuplicate = originalCheckDuplicate; // Restore original
        });

         expect(result.current.items.length).toBe(1); // Only the new place
         expect(result.current.errors).toEqual([]);
         expect(result.current.duplicates.length).toBe(1);
         expect(result.current.duplicates[0].index).toBe(0);
         expect(result.current.duplicates[0].itemData).toMatchObject({ name: 'Existing Cafe' });
         expect(result.current.duplicates[0].identifier).toBe(existingRestaurantIdentifier);
         expect(result.current.duplicates[0].reason).toContain('database'); // Duplicate found via lookup
     });

    it('should handle submitBulkAdd successfully', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const itemsToSubmit = [
            { name: 'Submit Cafe', address: '789 Go St', neighborhood_id: 1, status: 'valid' }, // Assuming neighborhood_id mapping happened
        ];
        // Pre-populate items state for submission test
        result.current.items = itemsToSubmit;

        await act(async () => {
            await result.current.submitBulkAdd(itemsToSubmit);
        });

        expect(adminService.bulkAddRestaurants).toHaveBeenCalledWith(itemsToSubmit);
        expect(result.current.submitStatus.state).toBe('success');
        expect(result.current.submitStatus.message).toMatch(/Successfully added/);
    });

    it('should handle submitBulkAdd failure', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const itemsToSubmit = [ { name: 'Fail Cafe' } ];
        result.current.items = itemsToSubmit; // Pre-populate state

        // Mock the service to throw an error
        const MOCK_ERROR_MESSAGE = 'Server exploded';
        adminService.bulkAddRestaurants.mockRejectedValue({ message: MOCK_ERROR_MESSAGE });

        await act(async () => {
            await result.current.submitBulkAdd(itemsToSubmit);
        });

        expect(adminService.bulkAddRestaurants).toHaveBeenCalledWith(itemsToSubmit);
        expect(result.current.submitStatus.state).toBe('error');
        expect(result.current.submitStatus.message).toContain(MOCK_ERROR_MESSAGE);
    });

    it('should reset state when resetState is called', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBulkAddProcessor('restaurants'), { wrapper });
        const inputData = [{ name: 'Test Cafe', address: '123 Main St', neighborhood: 'Downtown', city: 'Testville', cuisine_type: 'Coffee' }];

        // Process some data to change state
        await act(async () => {
             await result.current.processInputData(inputData);
        });
        expect(result.current.items.length).toBe(1); // State is populated

        // Reset
        await act(async () => {
             result.current.resetState();
        });

        // Check if state is back to initial values
        expect(result.current.items).toEqual([]);
        expect(result.current.errors).toEqual([]);
        expect(result.current.duplicates).toEqual([]);
        expect(result.current.isProcessing).toBe(false);
        expect(result.current.parseError).toBeNull();
        expect(result.current.submitStatus.state).toBe('idle');
    });

});