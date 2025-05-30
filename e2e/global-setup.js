/**
 * Global Setup for DOOF E2E Tests
 * 
 * This file runs once before all tests to prepare the test environment.
 * It ensures the backend is ready and sets up any necessary test data.
 */

import { chromium } from '@playwright/test';

export default async function globalSetup() {
  console.log('🚀 Starting global setup for DOOF E2E tests...');
  
  // Verify backend is accessible
  try {
    console.log('📡 Checking backend health...');
    const response = await fetch('http://localhost:5001/api/health');
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    const health = await response.json();
    console.log(`✅ Backend is healthy: ${health.message}`);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    throw new Error('Backend is not accessible. Please ensure it is running on port 5001.');
  }
  
  // Verify frontend is accessible
  try {
    console.log('🌐 Checking frontend accessibility...');
    const response = await fetch('http://localhost:5174');
    if (!response.ok) {
      throw new Error(`Frontend check failed: ${response.status}`);
    }
    console.log('✅ Frontend is accessible');
  } catch (error) {
    console.error('❌ Frontend check failed:', error.message);
    throw new Error('Frontend is not accessible. Please ensure it is running on port 5174.');
  }
  
  // Launch browser to verify basic functionality
  try {
    console.log('🔧 Verifying basic browser functionality...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    // Verify the page loads
    const title = await page.title();
    console.log(`✅ App loaded successfully. Title: ${title}`);
    
    // Check for critical elements
    const hasReactRoot = await page.locator('#root').first().isVisible();
    if (!hasReactRoot) {
      throw new Error('React app root element not found');
    }
    
    await browser.close();
    console.log('✅ Browser functionality verified');
  } catch (error) {
    console.error('❌ Browser verification failed:', error.message);
    throw new Error('Basic browser functionality test failed');
  }
  
  // Set up test database state (if needed)
  try {
    console.log('🗄️ Setting up test database state...');
    
    // Create test user if it doesn't exist
    const testUserResponse = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'e2e-test@doof.com',
        password: 'TestPass123!',
        username: 'e2etest'
      }),
    });
    
    // It's OK if user already exists
    if (testUserResponse.status === 201) {
      console.log('✅ Test user created successfully');
    } else if (testUserResponse.status === 409) {
      console.log('ℹ️ Test user already exists');
    } else {
      console.warn(`⚠️ Unexpected response creating test user: ${testUserResponse.status}`);
    }
    
  } catch (error) {
    console.warn('⚠️ Test database setup had issues:', error.message);
    // Don't fail setup for database issues
  }
  
  console.log('🎉 Global setup completed successfully!');
  console.log('');
} 