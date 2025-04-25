// Filename: /root/doof-backend/models/searchModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
import db from '../db/index.js';
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js';
import format from 'pg-format';

// searchAll function (can be kept if needed elsewhere, uses named exports)
export const searchAll = async (searchTerm, limit = 10, offset = 0) => { /* ... implementation ... */ };

// performSearch function (uses named exports)
export const performSearch = async ({ query, limit = 10, offset = 0, type = 'all', cityId, neighborhoodId, userId }) => { /* ... implementation ... */ };

// Optional default export
const SearchModel = { searchAll, performSearch };
// export default SearchModel;