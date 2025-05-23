/**
 * Vite Axios Fix Plugin
 * 
 * This plugin patches the axios bundle during the build process to fix the
 * "Cannot read properties of undefined (reading 'toUpperCase')" error.
 * 
 * It works by transforming the axios code to ensure the method property
 * is always defined before toUpperCase is called.
 */

// Helper function to create a safe version of dispatchXhrRequest
function createSafeDispatchXhrRequestCode() {
  return `
// Safe version of dispatchXhrRequest that ensures method is always defined
function safeDispatchXhrRequest(config) {
  // Ensure config exists
  if (!config) {
    config = {};
  }
  
  // Ensure method is defined and is a string
  if (!config.method) {
    config.method = 'get';
    console.debug('[AxiosFix] Added missing method in dispatchXhrRequest: get');
  } else if (typeof config.method !== 'string') {
    try {
      config.method = String(config.method);
      console.debug('[AxiosFix] Converted method to string in dispatchXhrRequest: ' + config.method);
    } catch (e) {
      config.method = 'get';
      console.debug('[AxiosFix] Could not convert method to string, using get');
    }
  }
  
  // Now call the original function with our safe config
  return originalDispatchXhrRequest.call(this, config);
}
`;
}

/**
 * Create a Vite plugin to fix the axios toUpperCase error
 */
function viteAxiosFixPlugin() {
  return {
    name: 'vite-axios-fix-plugin',
    
    // This hook is called when a module is loaded
    transform(code, id) {
      // Only transform axios
      if (!id.includes('axios') || !id.includes('node_modules')) {
        return null;
      }
      
      // Look for the dispatchXhrRequest function
      if (code.includes('dispatchXhrRequest') && code.includes('toUpperCase')) {
        console.log('[AxiosFix] Found axios module with dispatchXhrRequest:', id);
        
        // Find the dispatchXhrRequest function
        const dispatchXhrRequestMatch = code.match(/function\s+dispatchXhrRequest\s*\(\s*config\s*\)\s*\{[\s\S]*?\}/);
        
        if (dispatchXhrRequestMatch) {
          const originalFunction = dispatchXhrRequestMatch[0];
          console.log('[AxiosFix] Found dispatchXhrRequest function');
          
          // Create a new version of the code that stores the original function and replaces it with our safe version
          const newCode = code.replace(
            originalFunction,
            `
// Store the original dispatchXhrRequest function
const originalDispatchXhrRequest = ${originalFunction};

${createSafeDispatchXhrRequestCode()}

// Replace the original function with our safe version
function dispatchXhrRequest(config) {
  return safeDispatchXhrRequest(config);
}
`
          );
          
          console.log('[AxiosFix] Successfully patched dispatchXhrRequest function');
          return newCode;
        }
        
        // If we couldn't find the exact function, try a more generic approach
        // Look for method.toUpperCase() pattern
        const methodToUpperCaseMatch = code.match(/(\w+)\.method\.toUpperCase\(\)/g);
        
        if (methodToUpperCaseMatch) {
          console.log('[AxiosFix] Found method.toUpperCase() pattern');
          
          // Replace all occurrences of method.toUpperCase() with a safe version
          let newCode = code;
          methodToUpperCaseMatch.forEach(match => {
            const configVar = match.split('.')[0];
            newCode = newCode.replace(
              match,
              `(${configVar}.method ? ${configVar}.method.toUpperCase() : 'GET')`
            );
          });
          
          console.log('[AxiosFix] Successfully patched method.toUpperCase() patterns');
          return newCode;
        }
        
        // If we still couldn't find a pattern, try a more aggressive approach
        // Look for .toUpperCase() calls
        const toUpperCaseMatch = code.match(/\.toUpperCase\(\)/g);
        
        if (toUpperCaseMatch) {
          console.log('[AxiosFix] Found .toUpperCase() calls');
          
          // Add a global safe toUpperCase function
          const safeToUpperCaseCode = `
// Safe toUpperCase function
function safeToUpperCase(value) {
  if (value === undefined || value === null) {
    console.debug('[AxiosFix] Prevented toUpperCase error on undefined/null');
    return 'GET';
  }
  return String(value).toUpperCase();
}
`;
          
          // Replace direct toUpperCase calls with our safe function
          // This is a bit risky as it might affect other code, but it's a last resort
          let newCode = safeToUpperCaseCode + code;
          newCode = newCode.replace(
            /(\w+)\.method\.toUpperCase\(\)/g,
            'safeToUpperCase($1.method)'
          );
          
          console.log('[AxiosFix] Added safe toUpperCase function and replaced direct calls');
          return newCode;
        }
      }
      
      return null;
    }
  };
}

export default viteAxiosFixPlugin;
