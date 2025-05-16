// test-admin-frontend.js
// Add this script to public/ directory to test admin panel functionality

console.log("===== ADMIN PANEL FRONTEND TEST STARTED =====");

// Function to check if a component is properly initialized
function checkComponentState(componentName, stateObj) {
  console.log(`\n[Test] Checking ${componentName} state:`);
  
  // Check if state object exists
  if (!stateObj) {
    console.error(`❌ ${componentName} state object is missing`);
    return false;
  }
  
  // For AdminPanel component
  if (componentName === 'AdminPanel') {
    // Check if data arrays are initialized
    console.log(`- usersData: ${Array.isArray(stateObj.usersData) ? '✅ Array' : '❌ Not an array'} (${stateObj.usersData?.length || 0} items)`);
    console.log(`- dishesData: ${Array.isArray(stateObj.dishesData) ? '✅ Array' : '❌ Not an array'} (${stateObj.dishesData?.length || 0} items)`);
    console.log(`- restaurantsData: ${Array.isArray(stateObj.restaurantsData) ? '✅ Array' : '❌ Not an array'} (${stateObj.restaurantsData?.length || 0} items)`);
    console.log(`- citiesData: ${Array.isArray(stateObj.citiesData) ? '✅ Array' : '❌ Not an array'} (${stateObj.citiesData?.length || 0} items)`);
    console.log(`- neighborhoodsData: ${Array.isArray(stateObj.neighborhoodsData) ? '✅ Array' : '❌ Not an array'} (${stateObj.neighborhoodsData?.length || 0} items)`);
    
    // Check loading state
    console.log(`- isLoading: ${stateObj.isLoading === false ? '✅ Not loading' : '❌ Still loading'}`);
    
    // Check if filters were properly loaded
    const filtersLoaded = stateObj.citiesData?.length > 0;
    console.log(`- Filters loaded: ${filtersLoaded ? '✅ Yes' : '❌ No'}`);
    
    return Array.isArray(stateObj.citiesData) && stateObj.citiesData.length > 0;
  }
  
  // For GenericAdminTableTab component
  if (componentName === 'GenericAdminTableTab') {
    // Check if the component has data and columns
    console.log(`- data: ${Array.isArray(stateObj.data) ? '✅ Array' : '❌ Not an array'} (${stateObj.data?.length || 0} items)`);
    console.log(`- columns: ${Array.isArray(stateObj.columns) ? '✅ Array' : '❌ Not an array'} (${stateObj.columns?.length || 0} columns)`);
    console.log(`- resourceType: ${stateObj.resourceType ? '✅ ' + stateObj.resourceType : '❌ Missing'}`);
    
    return Array.isArray(stateObj.data) && Array.isArray(stateObj.columns);
  }
  
  return false;
}

// Function to find admin components in the DOM
function findAdminComponents() {
  console.log("\n[Test] Searching for admin components in DOM...");
  
  // 1. Try to find the AdminPanel component
  let adminPanelFound = false;
  let adminTableFound = false;
  
  const allNodes = document.querySelectorAll('*');
  allNodes.forEach(node => {
    // Look for React Fiber properties
    const keys = Object.keys(node);
    const fiberKey = keys.find(key => key.startsWith('__reactFiber$'));
    
    if (fiberKey) {
      const fiber = node[fiberKey];
      if (fiber && fiber.type && fiber.type.name) {
        if (fiber.type.name === 'AdminPanel') {
          console.log('✅ Found AdminPanel component!');
          adminPanelFound = true;
          
          // Try to access props and state
          const componentState = fiber.memoizedState?.memoizedState;
          if (componentState) {
            checkComponentState('AdminPanel', componentState);
          } else {
            console.log('❌ AdminPanel state not accessible');
          }
        }
        
        if (fiber.type.name === 'GenericAdminTableTab') {
          console.log('✅ Found GenericAdminTableTab component!');
          adminTableFound = true;
          
          // Try to access props
          const props = node[keys.find(key => key.startsWith('__reactProps$'))];
          if (props) {
            checkComponentState('GenericAdminTableTab', props);
          } else {
            console.log('❌ GenericAdminTableTab props not accessible');
          }
        }
      }
    }
  });
  
  if (!adminPanelFound) {
    console.log('❌ AdminPanel component not found in DOM!');
    console.log('👉 Make sure you are on the admin panel page. Navigate to /admin if not already there.');
  }
  
  if (!adminTableFound) {
    console.log('❌ GenericAdminTableTab component not found in DOM!');
  }
  
  return adminPanelFound && adminTableFound;
}

// Check for the AdminStore
function checkAdminStore() {
  console.log("\n[Test] Checking AdminStore initialization...");
  
  if (!window.useAdminStore) {
    console.log('❌ useAdminStore not exposed globally');
    return false;
  }
  
  const adminStore = window.useAdminStore.getState();
  if (!adminStore) {
    console.log('❌ AdminStore state not accessible');
    return false;
  }
  
  console.log('✅ AdminStore found! State:', adminStore);
  
  // Check store state
  const dataProperties = ['users', 'dishes', 'restaurants', 'cities', 'neighborhoods', 'hashtags'];
  dataProperties.forEach(prop => {
    console.log(`- ${prop}: ${Array.isArray(adminStore[prop]) ? '✅ Array' : '❌ Not an array'} (${adminStore[prop]?.length || 0} items)`);
  });
  
  return true;
}

// API test: Make a basic call to admin API
async function testAdminApi() {
  console.log("\n[Test] Testing admin API connectivity...");
  
  try {
    const response = await fetch('/api/admin/cities');
    console.log(`- API Response status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`- Got data: ${data.success ? '✅' : '❌'} (${data?.data?.length || 0} items)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n===== RUNNING ALL ADMIN PANEL TESTS =====");
  
  const apiTestResult = await testAdminApi();
  const storeTestResult = checkAdminStore();
  const componentTestResult = findAdminComponents();
  
  console.log("\n===== TEST RESULTS =====");
  console.log(`API Test: ${apiTestResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Store Test: ${storeTestResult ? '✅ PASSED' : '❌ FAILED'}`);  
  console.log(`Component Test: ${componentTestResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const overallResult = apiTestResult && storeTestResult && componentTestResult;
  console.log(`\nOverall Result: ${overallResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  return overallResult;
}

// Expose the test runner globally
window.testAdminPanel = runAllTests;

// Execute the test after a short delay
setTimeout(() => {
  console.log("[Test] Auto-running tests in 3 seconds...");
  setTimeout(runAllTests, 3000);
}, 1000);

console.log("Admin panel test initialized! Navigate to the admin panel and run window.testAdminPanel() to test manually."); 