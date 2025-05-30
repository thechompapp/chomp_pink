/**
 * Authentication Helpers for E2E Tests
 * 
 * Reusable functions for handling authentication in tests
 */

export class AuthHelpers {
  /**
   * Login with credentials and return the page with authenticated state
   */
  static async login(page, email = 'admin@example.com', password = 'doof123') {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    // Submit and wait for response
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() === 200
      ),
      page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    ]);
    
    // Verify successful login
    const loginData = await response.json();
    if (!loginData.success || !loginData.token) {
      throw new Error('Login failed - no token received');
    }
    
    // Wait for token verification
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/status') && response.status() === 200
    );
    
    return loginData;
  }
  
  /**
   * Register a new user
   */
  static async register(page, userData) {
    // Navigate to register page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', userData.email);
    await page.fill('input[name="password"], input[type="password"]', userData.password);
    
    // Fill username if field exists
    const usernameField = page.locator('input[name="username"]');
    if (await usernameField.isVisible()) {
      await usernameField.fill(userData.username);
    }
    
    // Submit and wait for response
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/register') && response.status() === 201
      ),
      page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')
    ]);
    
    const registerData = await response.json();
    if (!registerData.success || !registerData.token) {
      throw new Error('Registration failed - no token received');
    }
    
    return registerData;
  }
  
  /**
   * Logout and verify state
   */
  static async logout(page) {
    // Find and click logout button/link
    await page.click('[data-testid="logout-button"], text=Logout, text="Sign Out"');
    
    // Wait for logout API call
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/logout') && response.status() === 200
      ),
      page.click('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("Confirm")')
    ]);
    
    return await response.json();
  }
  
  /**
   * Check if user is authenticated in UI
   */
  static async isAuthenticated(page) {
    try {
      // Look for authenticated UI elements
      const authElements = await page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"], .user-authenticated, text="My Lists", text="Profile"').count();
      return authElements > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get auth token from localStorage
   */
  static async getToken(page) {
    try {
      return await page.evaluate(() => {
        try {
          const authStorage = localStorage.getItem('auth-storage') || 
                             localStorage.getItem('auth-authentication-storage');
          if (authStorage) {
            const data = JSON.parse(authStorage);
            return data?.state?.token || null;
          }
          return null;
        } catch (error) {
          // Return null if localStorage access is denied
          return null;
        }
      });
    } catch (error) {
      // Return null if page evaluation fails
      return null;
    }
  }
  
  /**
   * Clear all authentication state
   */
  static async clearAuth(page) {
    try {
      await page.evaluate(() => {
        try {
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('auth-authentication-storage');
          sessionStorage.clear();
        } catch (error) {
          // Ignore localStorage access errors
          console.log('localStorage access denied, skipping clear');
        }
      });
    } catch (error) {
      // Ignore page evaluation errors
      console.log('Page evaluation failed, skipping auth clear');
    }
  }
} 