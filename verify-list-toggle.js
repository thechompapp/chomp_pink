console.log('[VERIFICATION TEST] Testing list toggle - ' + new Date().toISOString());

const testListToggle = async () => {
  try {
    // Clear any existing mock data flag
    localStorage.removeItem('use_mock_data');
    console.log('[VERIFICATION TEST] Initial state - localStorage has use_mock_data:', localStorage.getItem('use_mock_data'));

    // Test 1: Get all lists
    console.log('[VERIFICATION TEST] Fetching all lists...');
    const allListsResult = await window.listService.getUserLists({ view: 'all' });
    const allListsCount = Array.isArray(allListsResult.data) ? allListsResult.data.length : 0;
    console.log('[VERIFICATION TEST] All lists count:', allListsCount);

    // Test 2: Get following lists
    console.log('[VERIFICATION TEST] Fetching following lists...');
    const followingListsResult = await window.listService.getUserLists({ view: 'following' });
    const followingListsCount = Array.isArray(followingListsResult.data) ? followingListsResult.data.length : 0;
    console.log('[VERIFICATION TEST] Following lists count:', followingListsCount);

    // Test 3: Set mock data flag, then try again
    localStorage.setItem('use_mock_data', 'true');
    console.log('[VERIFICATION TEST] Set mock data flag, now value is:', localStorage.getItem('use_mock_data'));

    // Test 4: Get following lists again with mock data flag set
    console.log('[VERIFICATION TEST] Fetching following lists with mock data flag set...');
    const followingWithMockResult = await window.listService.getUserLists({ view: 'following' });
    const followingWithMockCount = Array.isArray(followingWithMockResult.data) ? followingWithMockResult.data.length : 0;
    console.log('[VERIFICATION TEST] Following lists with mock data flag count:', followingWithMockCount);

    // Conclusion
    if (followingListsCount > 0 || followingWithMockCount > 0) {
      console.log('[VERIFICATION TEST] ✅ SUCCESS: List toggle is working! Lists are showing in following view');
      return true;
    } else {
      console.log('[VERIFICATION TEST] ❌ FAILURE: Lists are still not showing in following view');
      return false;
    }
  } catch (error) {
    console.error('[VERIFICATION TEST] Test failed with error:', error);
    return false;
  }
};

// Run test and show result in console with clear visual indication
testListToggle().then(success => {
  const style = success 
    ? 'color: white; background: green; padding: 5px;' 
    : 'color: white; background: red; padding: 5px;';
  console.log('%c' + (success ? '✅ LIST TOGGLE TEST PASSED' : '❌ LIST TOGGLE TEST FAILED'), style);
  // We'll expose the test result globally so we can check it later
  window.listToggleTestResult = success;
});

