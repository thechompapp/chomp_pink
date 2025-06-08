/**
 * filterConstants.js
 * 
 * Defines action types for the FilterContext to ensure consistency and avoid typos.
 * Separated to comply with React Fast Refresh best practices.
 */

// Filter actions
export const SET_FILTER = 'SET_FILTER';
export const SET_FILTERS = 'SET_FILTERS';
export const CLEAR_FILTER = 'CLEAR_FILTER';
export const CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS';
export const RESET_FILTERS = 'RESET_FILTERS';

// Data actions
export const SET_DATA = 'SET_DATA';
export const SET_DATA_ARRAY = 'SET_DATA_ARRAY';

// Loading actions
export const SET_LOADING = 'SET_LOADING';
export const SET_LOADING_MULTIPLE = 'SET_LOADING_MULTIPLE';

// Error actions
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const CLEAR_ALL_ERRORS = 'CLEAR_ALL_ERRORS';

// Validation actions
export const SET_VALIDATION = 'SET_VALIDATION';

// Meta actions
export const SET_META = 'SET_META';
export const INITIALIZE = 'INITIALIZE';