/**
 * Real Data Rendering Diagnostic Tool
 * 
 * This script diagnoses why real data from the database isn't rendering on the frontend.
 * It can run without servers and identifies the specific issues in the data flow.
 */

import * as fs from 'fs/promises';
import path from 'path';

// Diagnostic results
const diagnostics = {
  issues: [],
  warnings: [],
  recommendations: []
};

// Helper to add issues
function addIssue(category, description, file = null, line = null) {
  diagnostics.issues.push({
    category,
    description,
    file,
    line,
    severity: 'HIGH'
  });
}

function addWarning(category, description, file = null) {
  diagnostics.warnings.push({
    category,
    description,
    file,
    severity: 'MEDIUM'
  });
}

function addRecommendation(description) {
  diagnostics.recommendations.push(description);
}

// Check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Read file content safely
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

// Analyze API client configuration
async function analyzeApiClient() {
  console.log('🔍 Analyzing API Client Configuration...');
  
  const apiClientPath = 'src/services/apiClient.js';
  const content = await readFile(apiClientPath);
  
  if (!content) {
    addIssue('API_CLIENT', 'API client file not found', apiClientPath);
    return;
  }
  
  // Check for common API client issues
  if (!content.includes('baseURL') && !content.includes('baseUrl')) {
    addIssue('API_CLIENT', 'No baseURL configured in API client', apiClientPath);
  }
  
  if (!content.includes('timeout')) {
    addWarning('API_CLIENT', 'No timeout configured in API client', apiClientPath);
  }
  
  // Check for authentication handling
  if (!content.includes('Authorization') && !content.includes('token')) {
    addWarning('API_CLIENT', 'No authentication token handling found', apiClientPath);
  }
  
  // Check for error handling
  if (!content.includes('catch') && !content.includes('error')) {
    addIssue('API_CLIENT', 'No error handling in API client', apiClientPath);
  }
  
  console.log('✅ API Client analysis complete');
}

// Analyze data fetching services
async function analyzeDataServices() {
  console.log('🔍 Analyzing Data Fetching Services...');
  
  const servicePaths = [
    'src/services/listService.js',
    'src/services/dishService.js',
    'src/services/restaurantService.js',
    'src/services/searchService.js'
  ];
  
  for (const servicePath of servicePaths) {
    const content = await readFile(servicePath);
    if (!content) {
      addWarning('DATA_SERVICES', `Service file not found: ${servicePath}`, servicePath);
      continue;
    }
    
    // Check for proper API calls
    if (!content.includes('api.get') && !content.includes('axios.get') && !content.includes('fetch')) {
      addIssue('DATA_SERVICES', `No API calls found in ${servicePath}`, servicePath);
    }
    
    // Check for error handling
    if (!content.includes('catch') && !content.includes('error')) {
      addWarning('DATA_SERVICES', `No error handling in ${servicePath}`, servicePath);
    }
    
    // Check for data transformation
    if (content.includes('data.data') || content.includes('response.data.data')) {
      addWarning('DATA_SERVICES', `Potential double data wrapping in ${servicePath}`, servicePath);
    }
  }
  
  console.log('✅ Data Services analysis complete');
}

// Analyze React components for data rendering
async function analyzeComponents() {
  console.log('🔍 Analyzing React Components...');
  
  const componentPaths = [
    'src/pages/Home/index.jsx',
    'src/pages/Lists/index.jsx',
    'src/pages/Lists/ListDetail.jsx',
    'src/components/UI/DishCard.jsx',
    'src/components/UI/RestaurantCard.jsx'
  ];
  
  for (const componentPath of componentPaths) {
    const content = await readFile(componentPath);
    if (!content) {
      addWarning('COMPONENTS', `Component file not found: ${componentPath}`, componentPath);
      continue;
    }
    
    // Check for data fetching hooks
    if (!content.includes('useEffect') && !content.includes('useQuery')) {
      addWarning('COMPONENTS', `No data fetching found in ${componentPath}`, componentPath);
    }
    
    // Check for loading states
    if (!content.includes('loading') && !content.includes('isLoading')) {
      addWarning('COMPONENTS', `No loading state handling in ${componentPath}`, componentPath);
    }
    
    // Check for error states
    if (!content.includes('error') && !content.includes('isError')) {
      addWarning('COMPONENTS', `No error state handling in ${componentPath}`, componentPath);
    }
    
    // Check for empty data handling
    if (!content.includes('length === 0') && !content.includes('empty') && !content.includes('no data')) {
      addWarning('COMPONENTS', `No empty data handling in ${componentPath}`, componentPath);
    }
    
    // Check for conditional rendering
    if (!content.includes('&&') && !content.includes('?')) {
      addIssue('COMPONENTS', `No conditional rendering found in ${componentPath}`, componentPath);
    }
  }
  
  console.log('✅ Component analysis complete');
}

// Analyze state management
async function analyzeStateManagement() {
  console.log('🔍 Analyzing State Management...');
  
  const storePaths = [
    'src/stores/useAuthStore.js',
    'src/stores/useUserListStore.js',
    'src/stores/useSubmissionStore.js',
    'src/stores/useUIStateStore.js'
  ];
  
  for (const storePath of storePaths) {
    const content = await readFile(storePath);
    if (!content) {
      addWarning('STATE_MANAGEMENT', `Store file not found: ${storePath}`, storePath);
      continue;
    }
    
    // Check for Zustand usage
    if (!content.includes('create') && !content.includes('zustand')) {
      addWarning('STATE_MANAGEMENT', `No Zustand store found in ${storePath}`, storePath);
    }
    
    // Check for async actions
    if (!content.includes('async') && !content.includes('await')) {
      addWarning('STATE_MANAGEMENT', `No async actions in ${storePath}`, storePath);
    }
    
    // Check for error handling in stores
    if (!content.includes('error') && !content.includes('catch')) {
      addWarning('STATE_MANAGEMENT', `No error handling in ${storePath}`, storePath);
    }
  }
  
  console.log('✅ State Management analysis complete');
}

// Analyze configuration files
async function analyzeConfiguration() {
  console.log('🔍 Analyzing Configuration...');
  
  // Check main config
  const configContent = await readFile('src/config.js');
  if (!configContent) {
    addIssue('CONFIGURATION', 'Main config file not found', 'src/config.js');
  } else {
    // Check for API URL configuration
    if (!configContent.includes('API_URL') && !configContent.includes('BACKEND_URL')) {
      addIssue('CONFIGURATION', 'No API URL configured', 'src/config.js');
    }
    
    // Check for environment handling
    if (!configContent.includes('process.env')) {
      addWarning('CONFIGURATION', 'No environment variable usage', 'src/config.js');
    }
  }
  
  // Check environment files
  const envExists = await fileExists('.env.local');
  if (!envExists) {
    addWarning('CONFIGURATION', 'No .env.local file found');
  }
  
  console.log('✅ Configuration analysis complete');
}

// Analyze network and API issues
async function analyzeNetworkIssues() {
  console.log('🔍 Analyzing Potential Network Issues...');
  
  // Check for CORS configuration
  const backendServerContent = await readFile('doof-backend/server.js');
  if (backendServerContent) {
    if (!backendServerContent.includes('cors')) {
      addIssue('NETWORK', 'No CORS configuration found in backend', 'doof-backend/server.js');
    }
  }
  
  // Check for proxy configuration in Vite
  const viteConfigContent = await readFile('vite.config.js');
  if (viteConfigContent) {
    if (!viteConfigContent.includes('proxy') && !viteConfigContent.includes('server')) {
      addWarning('NETWORK', 'No proxy configuration in Vite config', 'vite.config.js');
    }
  }
  
  console.log('✅ Network analysis complete');
}

// Generate specific recommendations based on findings
function generateRecommendations() {
  console.log('🔍 Generating Recommendations...');
  
  // API Client recommendations
  const apiIssues = diagnostics.issues.filter(i => i.category === 'API_CLIENT');
  if (apiIssues.length > 0) {
    addRecommendation('Fix API client configuration - ensure baseURL and error handling are properly set up');
  }
  
  // Data Services recommendations
  const serviceIssues = diagnostics.issues.filter(i => i.category === 'DATA_SERVICES');
  if (serviceIssues.length > 0) {
    addRecommendation('Review data service implementations - ensure API calls are made and responses are handled correctly');
  }
  
  // Component recommendations
  const componentIssues = diagnostics.issues.filter(i => i.category === 'COMPONENTS');
  if (componentIssues.length > 0) {
    addRecommendation('Add proper data fetching, loading states, and conditional rendering to React components');
  }
  
  // Configuration recommendations
  const configIssues = diagnostics.issues.filter(i => i.category === 'CONFIGURATION');
  if (configIssues.length > 0) {
    addRecommendation('Set up proper configuration with API URLs and environment variables');
  }
  
  // Network recommendations
  const networkIssues = diagnostics.issues.filter(i => i.category === 'NETWORK');
  if (networkIssues.length > 0) {
    addRecommendation('Configure CORS and proxy settings to allow frontend-backend communication');
  }
  
  // General recommendations
  addRecommendation('Run the enhanced test suite with servers running to get detailed data flow verification');
  addRecommendation('Check browser developer tools Network tab for failed API requests');
  addRecommendation('Verify database has actual data by running direct SQL queries');
  
  console.log('✅ Recommendations generated');
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting Real Data Rendering Diagnostics...\n');
  
  try {
    await analyzeApiClient();
    await analyzeDataServices();
    await analyzeComponents();
    await analyzeStateManagement();
    await analyzeConfiguration();
    await analyzeNetworkIssues();
    generateRecommendations();
    
    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSTIC REPORT: Real Data Rendering Issues');
    console.log('='.repeat(80));
    
    console.log(`\n🔴 CRITICAL ISSUES (${diagnostics.issues.length}):`);
    diagnostics.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category}] ${issue.description}`);
      if (issue.file) console.log(`   📁 File: ${issue.file}`);
    });
    
    console.log(`\n🟡 WARNINGS (${diagnostics.warnings.length}):`);
    diagnostics.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. [${warning.category}] ${warning.description}`);
      if (warning.file) console.log(`   📁 File: ${warning.file}`);
    });
    
    console.log(`\n💡 RECOMMENDATIONS (${diagnostics.recommendations.length}):`);
    diagnostics.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Save detailed report
    const reportPath = `diagnostic-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
    await fs.writeFile(reportPath, JSON.stringify(diagnostics, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(80));
    
    // Provide immediate next steps
    console.log('\n🎯 IMMEDIATE NEXT STEPS:');
    console.log('1. Review the critical issues above');
    console.log('2. Check browser developer tools for network errors');
    console.log('3. Verify backend API endpoints are working');
    console.log('4. Run enhanced tests with servers running for complete verification');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run diagnostics
runDiagnostics();
