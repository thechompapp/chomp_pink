// Filename: /doof-backend/models/listModel.test.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import db from '../db/index.js'; // Import the db instance to mock its query method
import ListModel from './listModel.js'; // Import the model to test

// Mock the database query method
vi.mock('../db/index.js', () => {
    // Mock the default export which contains the query method
    return {
        default: {
            query: vi.fn(),
            // Mock getClient if transactions are used and need mocking
             getClient: vi.fn(() => ({
                 query: vi.fn(),
                 release: vi.fn(),
             })),
        }
    };
});

// Mock the formatters used within the model (optional, but good practice)
// If formatters are complex, test them separately. Here we assume they work.
vi.mock('../utils/formatters.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual, // Keep actual implementations unless specific mocking needed
    formatList: vi.fn((list) => list ? ({ ...list, formatted: true }) : null), // Example: add a marker
    formatListItem: vi.fn((item) => item ? ({ ...item, formatted: true }) : null),
  };
});


describe('ListModel', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    describe('createList', () => {
        const userId = 1;
        const userHandle = 'tester';
        const listData = {
            name: 'My Test List',
            description: 'A list for testing',
            is_public: true,
            list_type: 'mixed',
            tags: ['tag1', 'test'],
            city_name: 'Test City'
        };
        const mockDbResponse = {
             rows: [{ // Simulate the RETURNING * row from the DB
                 id: 123,
                 name: 'My Test List',
                 description: 'A list for testing',
                 is_public: true,
                 list_type: 'mixed',
                 tags: ['tag1', 'test'],
                 user_id: userId,
                 creator_handle: userHandle,
                 city_name: 'Test City',
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString(),
                 saved_count: 0, // Example default values
                 item_count: 0
             }]
        };

        it('should execute insert query with correct parameters', async () => {
            db.query.mockResolvedValue(mockDbResponse); // Mock successful DB query

            await ListModel.createList(listData, userId, userHandle);

            expect(db.query).toHaveBeenCalledTimes(1);
            const queryArgs = db.query.mock.calls[0]; // Get arguments of the first call
            const queryString = queryArgs[0];
            const queryParams = queryArgs[1];

            // Check query structure (basic check)
            expect(queryString).toContain('INSERT INTO Lists');
            expect(queryString).toContain('RETURNING *');
            expect(queryString).toContain('(name, description, is_public, list_type, tags, user_id, creator_handle, city_name, updated_at, created_at)');
            expect(queryString).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())');

            // Check query parameters
            expect(queryParams).toEqual([
                listData.name,
                listData.description,
                listData.is_public,
                listData.list_type,
                listData.tags, // Assuming tags are passed directly
                userId,
                userHandle,
                listData.city_name
            ]);
        });

        it('should return formatted list data on successful creation', async () => {
             db.query.mockResolvedValue(mockDbResponse);

             const result = await ListModel.createList(listData, userId, userHandle);

             // Check if the result is based on the DB response and formatted
             expect(result).toBeDefined();
             expect(result.id).toBe(mockDbResponse.rows[0].id);
             expect(result.name).toBe(mockDbResponse.rows[0].name);
             expect(result.formatted).toBe(true); // Check if mock formatter was called
        });

        it('should throw error if database query fails', async () => {
            const dbError = new Error('DB connection failed');
            db.query.mockRejectedValue(dbError); // Mock DB query failure

            await expect(ListModel.createList(listData, userId, userHandle))
                .rejects.toThrow(dbError); // Should propagate the DB error
        });

        it('should throw error if list name is missing', async () => {
            const invalidData = { ...listData, name: null };
            await expect(ListModel.createList(invalidData, userId, userHandle))
                 .rejects.toThrow(/requires name and valid 'list_type'/);
            expect(db.query).not.toHaveBeenCalled();
        });

         it('should throw error if list_type is missing or invalid', async () => {
             const invalidData1 = { ...listData, list_type: null };
             const invalidData2 = { ...listData, list_type: 'invalid_type' };
             await expect(ListModel.createList(invalidData1, userId, userHandle))
                  .rejects.toThrow(/requires name and valid 'list_type'/);
             await expect(ListModel.createList(invalidData2, userId, userHandle))
                   .rejects.toThrow(/requires name and valid 'list_type'/);
             expect(db.query).not.toHaveBeenCalled();
         });

         it('should throw error if user ID is invalid', async () => {
              await expect(ListModel.createList(listData, null, userHandle))
                   .rejects.toThrow("Invalid User ID.");
              await expect(ListModel.createList(listData, 'abc', userHandle))
                   .rejects.toThrow("Invalid User ID.");
              expect(db.query).not.toHaveBeenCalled();
         });

    });

    // --- Add tests for other ListModel functions ---
    // describe('findListByIdRaw', () => { ... });
    // describe('findListsByUser', () => { ... });
    // describe('findListItemsByListId', () => { ... });
    // describe('addItemToList', () => { ... }); // Requires mocking getClient for transactions
    // etc.

});