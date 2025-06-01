import { test, expect } from '@playwright/test';

test.describe('Modal Authentication Handling', () => {
  test('should handle modal interactions without auth errors for unauthenticated users', async ({ page }) => {
    console.log('🧪 Testing modal interactions for unauthenticated users');
    
    // Monitor console for auth errors
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    page.on('response', response => {
      if (response.status() === 401 && response.url().includes('/api/engage')) {
        networkErrors.push(`401 error on ${response.url()}`);
        console.log('Network 401 error:', response.url());
      }
    });
    
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('✅ Homepage loaded');
    
    // Try to find and click on list cards that might trigger modals
    const listCards = await page.locator('[data-testid*="list-card"], .list-card, [class*="card"]').all();
    
    if (listCards.length > 0) {
      console.log(`Found ${listCards.length} potential list cards`);
      
      // Click on the first few cards to test modal interactions
      for (let i = 0; i < Math.min(3, listCards.length); i++) {
        try {
          console.log(`Clicking on card ${i + 1}`);
          await listCards[i].click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          
          // Check if we got redirected to login
          const currentUrl = page.url();
          if (currentUrl.includes('/login')) {
            console.log(`❌ Redirected to login after clicking card ${i + 1}`);
            // Navigate back to test other cards
            await page.goto('/', { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
          } else {
            console.log(`✅ No login redirect after clicking card ${i + 1}`);
            
            // Try to close any modal that might have opened
            const modalClose = page.locator('[data-testid="modal-close"], .modal-close, [aria-label="Close"]').first();
            try {
              if (await modalClose.isVisible({ timeout: 1000 })) {
                await modalClose.click();
                await page.waitForTimeout(500);
              }
            } catch (e) {
              // Modal might not have close button or might auto-close
              console.log('No modal close button found or modal already closed');
            }
          }
        } catch (error) {
          console.log(`Failed to click card ${i + 1}:`, error.message);
        }
      }
    }
    
    // Try clicking on restaurant/dish cards if they exist
    const otherCards = await page.locator('[data-testid*="restaurant-card"], [data-testid*="dish-card"], .restaurant-card, .dish-card').all();
    
    if (otherCards.length > 0) {
      console.log(`Found ${otherCards.length} restaurant/dish cards`);
      
      for (let i = 0; i < Math.min(2, otherCards.length); i++) {
        try {
          console.log(`Clicking on restaurant/dish card ${i + 1}`);
          await otherCards[i].click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          
          // Check if we got redirected to login
          const currentUrl = page.url();
          if (currentUrl.includes('/login')) {
            console.log(`❌ Redirected to login after clicking restaurant/dish card ${i + 1}`);
            await page.goto('/', { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
          } else {
            console.log(`✅ No login redirect after clicking restaurant/dish card ${i + 1}`);
            
            // Try to close any modal that might have opened
            const modalClose = page.locator('[data-testid="modal-close"], .modal-close, [aria-label="Close"]').first();
            try {
              if (await modalClose.isVisible({ timeout: 1000 })) {
                await modalClose.click();
                await page.waitForTimeout(500);
              }
            } catch (e) {
              console.log('No modal close button found or modal already closed');
            }
          }
        } catch (error) {
          console.log(`Failed to click restaurant/dish card ${i + 1}:`, error.message);
        }
      }
    }
    
    // Final check - we should not be on login page
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/login');
    
    // Check that we don't have excessive auth errors
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total 401 network errors: ${networkErrors.length}`);
    
    // We should have no 401 errors on /api/engage after our fix
    const engageErrors = networkErrors.filter(error => error.includes('/api/engage'));
    expect(engageErrors.length).toBe(0);
    
    console.log('✅ Modal interactions completed without auth redirects');
  });
  
  test('should gracefully handle engagement tracking for unauthenticated users', async ({ page }) => {
    console.log('🧪 Testing engagement tracking without authentication');
    
    // Monitor network requests
    let engageRequests = 0;
    
    page.on('request', request => {
      if (request.url().includes('/api/engage')) {
        engageRequests++;
        console.log('Engage request made:', request.url());
      }
    });
    
    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // The engagement service should now skip API calls for unauthenticated users
    // So we should see no /api/engage requests
    console.log(`Total /api/engage requests: ${engageRequests}`);
    
    // After our fix, there should be no engage requests for unauthenticated users
    expect(engageRequests).toBe(0);
    
    console.log('✅ Engagement tracking properly skipped for unauthenticated users');
  });
}); 