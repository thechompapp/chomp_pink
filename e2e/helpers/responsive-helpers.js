/**
 * Responsive Test Helpers
 * 
 * Utilities for handling mobile vs desktop differences in E2E tests
 */

export class ResponsiveHelpers {
  /**
   * Check if we're in mobile view
   * @param {Page} page - Playwright page object
   * @returns {Promise<boolean>} True if mobile view detected
   */
  static async isMobileView(page) {
    // Check viewport width
    const viewportSize = page.viewportSize();
    const isMobileSize = viewportSize && viewportSize.width < 768;
    
    // Also check for mobile navigation elements
    const mobileMenuButton = page.locator('[aria-label*="menu"], [aria-label*="Menu"], button[aria-expanded], .mobile-menu-button').first();
    const hasMobileMenu = await mobileMenuButton.isVisible({ timeout: 1000 }).catch(() => false);
    
    return isMobileSize || hasMobileMenu;
  }
  
  /**
   * Open mobile navigation menu if in mobile view
   * @param {Page} page - Playwright page object
   * @returns {Promise<boolean>} True if mobile menu was opened
   */
  static async openMobileMenuIfNeeded(page) {
    const isMobile = await this.isMobileView(page);
    
    if (isMobile) {
      const mobileMenuButton = page.locator('[aria-label*="menu"], [aria-label*="Menu"], button[aria-expanded="false"], .mobile-menu-button').first();
      
      if (await mobileMenuButton.isVisible({ timeout: 2000 })) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500); // Wait for menu animation
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Close mobile navigation menu if open
   * @param {Page} page - Playwright page object
   * @returns {Promise<boolean>} True if mobile menu was closed
   */
  static async closeMobileMenuIfOpen(page) {
    const closeButton = page.locator('[aria-label*="close"], button[aria-expanded="true"], .mobile-menu-close').first();
    
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await page.waitForTimeout(300); // Wait for menu animation
      return true;
    }
    
    return false;
  }
  
  /**
   * Click a navigation link with mobile menu handling
   * @param {Page} page - Playwright page object
   * @param {string} linkText - Text content or href of the link
   * @param {Object} options - Options for the click
   * @returns {Promise<void>}
   */
  static async clickNavLink(page, linkText, options = {}) {
    // Open mobile menu if needed
    const menuWasOpened = await this.openMobileMenuIfNeeded(page);
    
    // Wait a moment for menu to be ready
    if (menuWasOpened) {
      await page.waitForTimeout(300);
    }
    
    // Find and click the link
    const linkSelector = `a[href*="${linkText}"], a:has-text("${linkText}"), [href*="${linkText}"]`;
    const link = page.locator(linkSelector).first();
    
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click(options);
    
    // Close mobile menu after clicking
    if (menuWasOpened) {
      await this.closeMobileMenuIfOpen(page);
    }
  }
  
  /**
   * Wait for React component to stabilize
   * @param {Page} page - Playwright page object
   * @param {number} timeout - Additional timeout after network idle
   * @returns {Promise<void>}
   */
  static async waitForReactStabilization(page, timeout = 1000) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(timeout);
    
    // Wait for any pending React state updates
    await page.evaluate(() => {
      return new Promise(resolve => {
        if (window.React && window.React.version) {
          // If React DevTools are available, wait for scheduler
          setTimeout(resolve, 100);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Fill input field with proper mobile overlay handling
   * @param {Locator} input - The input locator
   * @param {string} value - Value to fill
   * @param {Object} options - Additional options
   */
  static async fillInputStably(input, value, options = {}) {
    const { retries = 3, timeout = 5000 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔧 Filling input (attempt ${attempt}/${retries})`);
        
        // Wait for input to be ready
        await input.waitFor({ state: 'attached' });
        await input.waitFor({ state: 'visible', timeout: 5000 });
        
        // Ensure mobile menu is closed to avoid click interception
        await this.closeMobileMenuIfOpen(input.page());
        
        // Clear any existing value
        await input.click();
        await input.selectText().catch(() => {}); // Ignore if no text to select
        
        // Fill the input
        await input.fill(value);
        
        // Verify the value was filled correctly
        const filledValue = await input.inputValue();
        if (filledValue === value) {
          console.log(`✓ Input filled successfully: "${value}"`);
          return true;
        } else {
          console.log(`⚠️ Input value mismatch. Expected: "${value}", Got: "${filledValue}"`);
          if (attempt === retries) {
            throw new Error(`Failed to fill input with correct value after ${retries} attempts`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Fill input attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          // Last attempt failed, try force approach
          try {
            console.log('🔧 Trying force fill approach...');
            await input.click({ force: true });
            await input.fill(value, { force: true });
            console.log('✓ Force fill successful');
            return true;
          } catch (forceError) {
            console.log('❌ Force fill also failed:', forceError.message);
            throw new Error(`Failed to fill input after all attempts: ${error.message}`);
          }
        }
        
        // Wait before retry
        await input.page().waitForTimeout(500);
      }
    }
    
    return false;
  }
  
  /**
   * Click button with retry logic for React components
   * @param {Page} page - Playwright page object
   * @param {string} selector - Button selector
   * @param {Object} options - Click options
   * @returns {Promise<void>}
   */
  static async clickButtonStably(page, selector, options = {}) {
    const button = page.locator(selector).first();
    
    // Wait for button to be ready
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.waitFor({ state: 'enabled', timeout: 5000 });
    
    // Scroll into view if needed
    await button.scrollIntoViewIfNeeded();
    
    // Click with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await button.click(options);
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        console.warn(`Button click attempt ${attempts} failed, retrying...`);
        await page.waitForTimeout(500);
      }
    }
  }
  
  /**
   * Handle form submission with proper waiting
   * @param {Page} page - Playwright page object
   * @param {string} formSelector - Form selector
   * @param {string} submitSelector - Submit button selector
   * @returns {Promise<void>}
   */
  static async submitFormStably(page, formSelector, submitSelector) {
    // Wait for form to be ready
    await page.locator(formSelector).waitFor({ state: 'visible' });
    
    // Submit the form
    await this.clickButtonStably(page, submitSelector);
    
    // Wait for submission to process
    await page.waitForTimeout(1000);
    
    // Wait for either navigation or UI change
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      // Form submission might not cause navigation, that's ok
      console.log('No navigation detected after form submission');
    }
  }
} 