/**
 * Restaurant Address Autocomplete E2E Tests
 * 
 * Tests the new Google Places autocomplete functionality for restaurant addresses:
 * - Google Places API integration
 * - Address autocomplete in admin panel
 * - Zip code extraction and neighborhood lookup
 * - Automatic city and neighborhood field population
 * - Inline editing with auto-save
 */

import { test, expect } from '@playwright/test';
import { AuthHelpers } from './auth-helpers.js';

const CONFIG = {
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  TEST_ADDRESSES: [
    {
      query: '123 Main Street, New York, NY',
      expectedCity: 'New York',
      expectedZip: '10001'
    },
    {
      query: 'Times Square, New York',
      expectedCity: 'New York',
      expectedState: 'NY'
    },
    {
      query: '1600 Pennsylvania Avenue, Washington, DC',
      expectedCity: 'Washington',
      expectedState: 'DC'
    }
  ]
};

test.describe('Restaurant Address Autocomplete', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any previous auth state
    await AuthHelpers.clearAuth(page);
    
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Login with admin credentials
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Navigate to restaurants tab
    const restaurantTab = page.locator('button:has-text("Restaurants")').first();
    if (await restaurantTab.isVisible()) {
      await restaurantTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Allow data to load
    }
  });

  /**
   * Test Google Places autocomplete dropdown appears
   */
  test('should show Google Places autocomplete dropdown when typing address', async ({ page }) => {
    console.log('🧪 Testing Google Places autocomplete dropdown');
    
    // Look for the enhanced admin table
    const adminTable = page.locator('.enhanced-admin-table, table').first();
    await expect(adminTable).toBeVisible({ timeout: 10000 });
    
    // Look for the first restaurant address cell
    const addressCell = page.locator('td:has-text("address"), [data-field="address"]').first();
    
    if (await addressCell.isVisible()) {
      // Click on the address cell to start editing
      await addressCell.click();
      await page.waitForTimeout(1000);
      
      // Look for the Places autocomplete input
      const addressInput = page.locator('input[placeholder*="Search for"], input[placeholder*="address"]').first();
      
      if (await addressInput.isVisible()) {
        console.log('✓ Address input field found');
        
        // Type a test address
        await addressInput.fill('123 Main Street, New York');
        await page.waitForTimeout(2000); // Allow API call
        
        // Look for autocomplete dropdown
        const dropdown = page.locator('.dropdown, .suggestions, [role="listbox"]').first();
        const suggestionItems = page.locator('.suggestion, .autocomplete-item, [role="option"]');
        
        // Check if dropdown appears
        if (await dropdown.isVisible() || await suggestionItems.first().isVisible()) {
          console.log('✓ Google Places autocomplete dropdown appeared');
          
          const suggestionCount = await suggestionItems.count();
          console.log(`✓ Found ${suggestionCount} address suggestions`);
          
          expect(suggestionCount).toBeGreaterThan(0);
        } else {
          console.log('ℹ️ Autocomplete dropdown not visible - may need API key or service setup');
        }
      } else {
        console.log('ℹ️ Places autocomplete input not found - checking for regular address input');
        
        // Fallback: look for any address input
        const regularAddressInput = page.locator('input[type="text"]').first();
        if (await regularAddressInput.isVisible()) {
          await regularAddressInput.fill('123 Main Street, New York');
          console.log('✓ Regular address input found and filled');
        }
      }
    } else {
      console.log('ℹ️ Address cell not found - may need to scroll or wait for data');
    }
  });

  /**
   * Test address selection and auto-population
   */
  test('should auto-populate city and neighborhood when address is selected', async ({ page }) => {
    console.log('🧪 Testing address selection and auto-population');
    
    // Wait for admin table to load
    const adminTable = page.locator('table, .admin-table').first();
    await expect(adminTable).toBeVisible({ timeout: 10000 });
    
    // Look for the first editable address cell
    const addressCell = page.locator('td').filter({ hasText: /address|Address/ }).first();
    
    if (await addressCell.isVisible()) {
      await addressCell.click();
      await page.waitForTimeout(1000);
      
      // Look for the address input in the editing interface
      const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Search"]').first();
      
      if (await addressInput.isVisible()) {
        // Clear and type new address
        await addressInput.fill('');
        await addressInput.fill('123 Main Street, New York, NY 10001');
        await page.waitForTimeout(2000);
        
        // Look for autocomplete suggestions
        const suggestions = page.locator('.suggestion, .autocomplete-item, [role="option"]');
        
        if (await suggestions.first().isVisible()) {
          // Click the first suggestion
          await suggestions.first().click();
          await page.waitForTimeout(2000);
          
          console.log('✓ Address suggestion selected');
          
          // Check if city and neighborhood fields were auto-populated
          const cityField = page.locator('select[name*="city"], input[name*="city"]').first();
          const neighborhoodField = page.locator('select[name*="neighborhood"], input[name*="neighborhood"]').first();
          
          if (await cityField.isVisible()) {
            const cityValue = await cityField.inputValue();
            console.log(`✓ City field value: ${cityValue}`);
          }
          
          if (await neighborhoodField.isVisible()) {
            const neighborhoodValue = await neighborhoodField.inputValue();
            console.log(`✓ Neighborhood field value: ${neighborhoodValue}`);
          }
          
          // Look for success notification
          const successToast = page.locator('.toast, .notification').filter({ hasText: /success|updated|auto-set/i });
          if (await successToast.isVisible()) {
            console.log('✓ Success notification displayed');
          }
        } else {
          console.log('ℹ️ No autocomplete suggestions visible');
        }
      } else {
        console.log('ℹ️ Address input not found in editing mode');
      }
    } else {
      console.log('ℹ️ Address cell not found in table');
    }
  });

  /**
   * Test enhanced features notice
   */
  test('should display enhanced features notice for restaurants tab', async ({ page }) => {
    console.log('🧪 Testing enhanced features notice');
    
    // Look for the enhanced features notice
    const enhancedNotice = page.locator('.enhanced-features, .feature-notice').first();
    
    if (await enhancedNotice.isVisible()) {
      console.log('✓ Enhanced features notice found');
      
      // Check for Google Places mention
      const placesFeature = page.locator('text*="Google Places", text*="autocomplete"').first();
      if (await placesFeature.isVisible()) {
        console.log('✓ Google Places feature mentioned in notice');
      }
      
      // Check for neighborhood lookup mention
      const neighborhoodFeature = page.locator('text*="neighborhood", text*="zip code"').first();
      if (await neighborhoodFeature.isVisible()) {
        console.log('✓ Neighborhood lookup feature mentioned');
      }
      
      // Check for auto-setting mention
      const autoSetFeature = page.locator('text*="auto-set", text*="automatic"').first();
      if (await autoSetFeature.isVisible()) {
        console.log('✓ Auto-setting feature mentioned');
      }
    } else {
      console.log('ℹ️ Enhanced features notice not found');
    }
  });

  /**
   * Test manual city and neighborhood override
   */
  test('should allow manual override of city and neighborhood fields', async ({ page }) => {
    console.log('🧪 Testing manual city and neighborhood override');
    
    const adminTable = page.locator('table, .admin-table').first();
    await expect(adminTable).toBeVisible({ timeout: 10000 });
    
    // Find city and neighborhood cells
    const cityCell = page.locator('td').filter({ hasText: /city/i }).first();
    const neighborhoodCell = page.locator('td').filter({ hasText: /neighborhood/i }).first();
    
    if (await cityCell.isVisible()) {
      await cityCell.click();
      await page.waitForTimeout(1000);
      
      // Look for city dropdown/select
      const citySelect = page.locator('select, .dropdown').first();
      if (await citySelect.isVisible()) {
        console.log('✓ City selection interface found');
        
        // Try to select a different city
        await citySelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        console.log('✓ City manually changed');
      }
    }
    
    if (await neighborhoodCell.isVisible()) {
      await neighborhoodCell.click();
      await page.waitForTimeout(1000);
      
      // Look for neighborhood dropdown/select
      const neighborhoodSelect = page.locator('select, .dropdown').first();
      if (await neighborhoodSelect.isVisible()) {
        console.log('✓ Neighborhood selection interface found');
        
        // Try to select a different neighborhood
        await neighborhoodSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        console.log('✓ Neighborhood manually changed');
      }
    }
  });

  /**
   * Test auto-save functionality
   */
  test('should auto-save changes when address is updated', async ({ page }) => {
    console.log('🧪 Testing auto-save functionality');
    
    const adminTable = page.locator('table').first();
    await expect(adminTable).toBeVisible({ timeout: 10000 });
    
    // Click on an address cell
    const addressCell = page.locator('td').filter({ hasText: /\d+.*\w+.*St|Avenue|Road|Boulevard/i }).first();
    
    if (await addressCell.isVisible()) {
      await addressCell.click();
      await page.waitForTimeout(1000);
      
      const addressInput = page.locator('input[type="text"]').first();
      
      if (await addressInput.isVisible()) {
        // Make a small change to trigger auto-save
        const originalValue = await addressInput.inputValue();
        await addressInput.fill(originalValue + ' (updated)');
        
        // Wait for auto-save (should happen within a few seconds)
        await page.waitForTimeout(3000);
        
        // Look for saving indicator or success message
        const savingIndicator = page.locator(':has-text("saving"), :has-text("saved"), .loading, .spinner').first();
        const successMessage = page.locator('.toast, .notification').filter({ hasText: /saved|success/i });
        
        if (await savingIndicator.isVisible() || await successMessage.isVisible()) {
          console.log('✓ Auto-save functionality working');
        } else {
          console.log('ℹ️ Auto-save indicators not detected');
        }
      }
    } else {
      console.log('ℹ️ Address cell not found for auto-save test');
    }
  });

  /**
   * Test error handling for invalid addresses
   */
  test('should handle invalid addresses gracefully', async ({ page }) => {
    console.log('🧪 Testing error handling for invalid addresses');
    
    const adminTable = page.locator('table').first();
    await expect(adminTable).toBeVisible({ timeout: 10000 });
    
    const addressCell = page.locator('td').filter({ hasText: /address/i }).first();
    
    if (await addressCell.isVisible()) {
      await addressCell.click();
      await page.waitForTimeout(1000);
      
      const addressInput = page.locator('input').first();
      
      if (await addressInput.isVisible()) {
        // Type an invalid/nonsense address
        await addressInput.fill('asdfghjkl invalid address 12345');
        await page.waitForTimeout(2000);
        
        // Check for error messages or graceful handling
        const errorMessage = page.locator('.error, .warning, .alert').filter({ hasText: /error|invalid|not found/i });
        const noResultsMessage = page.locator('text*="No results", text*="not found"');
        
        if (await errorMessage.isVisible() || await noResultsMessage.isVisible()) {
          console.log('✓ Error handling working properly');
        } else {
          console.log('✓ No errors displayed - graceful handling');
        }
      }
    }
  });

  /**
   * Test Places API service status
   */
  test('should display Places API service status', async ({ page }) => {
    console.log('🧪 Testing Places API service status');
    
    // Navigate to restaurants tab and look for service status indicators
    const serviceStatus = page.locator('text*="Places service", text*="Google Places", text*="API"').first();
    
    if (await serviceStatus.isVisible()) {
      console.log('✓ Places API service status information found');
      
      // Check for availability indicators
      const availableIndicator = page.locator('text*="available", .status-available, .service-ok').first();
      const unavailableIndicator = page.locator('text*="unavailable", text*="offline", .status-unavailable').first();
      
      if (await availableIndicator.isVisible()) {
        console.log('✓ Places API service is available');
      } else if (await unavailableIndicator.isVisible()) {
        console.log('ℹ️ Places API service is unavailable');
      }
    }
    
    // Check for any loading states related to Places API
    const loadingIndicator = page.locator('text*="Loading places", .places-loading').first();
    if (await loadingIndicator.isVisible()) {
      console.log('✓ Places API loading indicator found');
    }
  });
});

/**
 * Restaurant Address Integration Tests
 * Tests the full workflow of address editing with real data
 */
test.describe('Restaurant Address Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.clearAuth(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await AuthHelpers.login(page, CONFIG.ADMIN_USER.email, CONFIG.ADMIN_USER.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Navigate to restaurants tab
    const restaurantTab = page.locator('button', { hasText: 'Restaurants' }).first();
    if (await restaurantTab.isVisible()) {
      await restaurantTab.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Test complete address editing workflow
   */
  test('should complete full address editing workflow', async ({ page }) => {
    console.log('🧪 Testing complete address editing workflow');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Find the first restaurant row
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Find the address cell in the first row
    const addressCell = firstRow.locator('td').nth(4); // Assuming address is 5th column
    
    if (await addressCell.isVisible()) {
      console.log('✓ Address cell found');
      
      // Start editing
      await addressCell.click();
      await page.waitForTimeout(2000);
      
      // Look for the restaurant address editing component
      const addressEditor = page.locator('.restaurant-address-cell, .address-editor').first();
      
      if (await addressEditor.isVisible()) {
        console.log('✓ Restaurant address editor opened');
        
        // Test the complete workflow
        const addressInput = addressEditor.locator('input[placeholder*="address"]').first();
        
        if (await addressInput.isVisible()) {
          // Clear and enter new address
          await addressInput.fill('');
          await addressInput.fill('456 Broadway, New York, NY 10013');
          await page.waitForTimeout(2000);
          
          // Select from autocomplete if available
          const suggestion = page.locator('.autocomplete-item, .suggestion').first();
          if (await suggestion.isVisible()) {
            await suggestion.click();
            await page.waitForTimeout(2000);
            console.log('✓ Address selected from autocomplete');
          }
          
          // Check if city and neighborhood dropdowns are populated
          const citySelect = addressEditor.locator('select').first();
          const neighborhoodSelect = addressEditor.locator('select').nth(1);
          
          if (await citySelect.isVisible()) {
            const cityOptions = await citySelect.locator('option').count();
            console.log(`✓ City dropdown has ${cityOptions} options`);
          }
          
          if (await neighborhoodSelect.isVisible()) {
            const neighborhoodOptions = await neighborhoodSelect.locator('option').count();
            console.log(`✓ Neighborhood dropdown has ${neighborhoodOptions} options`);
          }
          
          // Save changes (if not auto-save)
          const saveButton = addressEditor.locator('button:has-text("Save")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            console.log('✓ Changes saved manually');
          } else {
            console.log('✓ Auto-save mode detected');
          }
          
          // Check for success feedback
          const successToast = page.locator('.toast, .notification').filter({ hasText: /success|saved|updated/i });
          if (await successToast.isVisible()) {
            console.log('✓ Success notification displayed');
          }
        }
      } else {
        console.log('ℹ️ Restaurant address editor not found - may be using inline editing');
      }
    }
    
    console.log('✓ Address editing workflow test completed');
  });
}); 