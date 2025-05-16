// test-frontend.js
// This script adds some temporary console.log statements to verify data flow in the frontend
console.log("Running frontend data flow tests...");

// Add console.logs to verify admin store state
const originalStore = window.localStorage.getItem('admin-state');
console.log('[Test] Admin store state:', originalStore ? JSON.parse(originalStore) : 'Not found');

// Check if API requests are working
fetch('/api/admin/submissions')
  .then(response => {
    console.log('[Test] API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('[Test] API Response Data:', data);
    
    // Verify data structure
    if (data.success && Array.isArray(data.data)) {
      console.log('[Test] ✅ API data structure is correct');
    } else {
      console.log('[Test] ❌ API data structure is incorrect');
    }
  })
  .catch(error => {
    console.error('[Test] ❌ API request failed:', error);
  });

// Add global inspector for React components
window.__inspectComponent = function(componentName) {
  console.log(`[Test] Inspecting component: ${componentName}`);
  
  // Find all elements that might be React components
  const elements = Array.from(document.querySelectorAll('*'));
  
  // Look for React internal properties
  elements.forEach(el => {
    const key = Object.keys(el).find(key => 
      key.startsWith('__reactFiber$') || 
      key.startsWith('__reactProps$')
    );
    
    if (key) {
      const fiberNode = el[key];
      if (fiberNode && fiberNode.return && fiberNode.return.type) {
        const name = fiberNode.return.type.name || fiberNode.return.type.displayName;
        if (name === componentName) {
          console.log('[Test] Found component:', name, el);
          console.log('[Test] Props:', el[key.replace('Fiber', 'Props')]);
        }
      }
    }
  });
};

// Inspect the admin components after a short delay
setTimeout(() => {
  console.log('[Test] Inspecting AdminPanel');
  window.__inspectComponent('AdminPanel');
  
  console.log('[Test] Inspecting GenericAdminTableTab');
  window.__inspectComponent('GenericAdminTableTab');
  
  console.log('[Test] Tests completed');
}, 3000);

// Expose this function to run in the browser console
window.runFrontendTests = function() {
  console.log('[Test] Manual frontend test triggered');
  window.__inspectComponent('AdminPanel');
  window.__inspectComponent('GenericAdminTableTab');
};

console.log("Frontend tests initialized. Run window.runFrontendTests() in console to execute tests manually."); 