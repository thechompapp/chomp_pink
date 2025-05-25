// jsx-loader.js - Handles JSX file loading for the test runner
console.log('[JSX Loader] Initializing JSX loader');

// Intercept import requests for JSX files
const originalImport = window.importScripts;
window.importScripts = function(url) {
  if (url.endsWith('.jsx')) {
    console.log(`[JSX Loader] Converting JSX import: ${url}`);
    // Convert JSX to JS for import
    url = url.replace('.jsx', '.js');
  }
  return originalImport.call(this, url);
};

console.log('[JSX Loader] JSX loader initialized');
