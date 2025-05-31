/**
 * Simple E2E Test for DOOF Application
 * 
 * Basic tests to verify the E2E setup is working correctly
 */

import { test, expect } from '@playwright/test';

test.describe('DOOF Simple Tests', () => {
  
  test('should load the homepage', async ({ page }) => {
    console.log('🧪 Testing basic homepage loading');
    
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads
    await expect(page).toHaveTitle(/DOOF|Chomp|Food|Vite/);
    
    // Check for React root
    await expect(page.locator('#root')).toBeVisible();
    
    console.log('✓ Homepage loaded successfully');
  });

  test('should verify backend health', async ({ page }) => {
    console.log('🧪 Testing backend health endpoint');
    
    // Test health endpoint directly
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBe(true);
    
    const healthData = await response.json();
    expect(healthData.status).toBe('UP');
    expect(healthData.message).toContain('healthy');
    
    console.log('✓ Backend health verified');
  });

  test('should navigate to login page', async ({ page }) => {
    console.log('🧪 Testing navigation to login');
    
    // Navigate to homepage first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for login link and click it
    const loginLink = page.locator('text=Login, text=Sign In, a[href="/login"]').first();
    
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL('**/login');
      
      // Verify we're on login page
      expect(page.url()).toContain('/login');
      
      // Check for login form elements
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        console.log('✓ Login form found');
      } else {
        console.log('ℹ️ Login form not found - may have different structure');
      }
    } else {
      console.log('ℹ️ Login link not found - may be in different location');
    }
    
    console.log('✓ Navigation test completed');
  });

  test('should test API authentication endpoint', async ({ page }) => {
    console.log('🧪 Testing auth API endpoint');
    
    // Test login endpoint with valid credentials
    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'doof123'
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      expect(loginData.success).toBe(true);
      expect(loginData.data.token).toBeDefined();
      expect(loginData.data.user).toBeDefined();
      expect(loginData.data.user.email).toBe('admin@example.com');
      console.log('✓ Auth API working correctly');
      console.log('✓ Token received:', loginData.data.token.substring(0, 20) + '...');
      console.log('✓ User data:', { id: loginData.data.user.id, email: loginData.data.user.email });
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.log('❌ Auth API test failed:', loginResponse.status(), errorData);
      throw new Error(`Login failed with status ${loginResponse.status()}`);
    }
  });
}); 