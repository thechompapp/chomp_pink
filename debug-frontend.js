// Simple frontend debug test using Puppeteer
import puppeteer from 'puppeteer';

async function testFrontend() {
  let browser;
  try {
    console.log('🚀 Starting frontend debug test...');
    
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/lists')) {
        console.log(`[API RESPONSE]: ${response.url()} - Status: ${response.status()}`);
      }
    });
    
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2' });
    
    // Wait a bit for React to hydrate
    await page.waitForFunction(() => document.readyState === 'complete');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page Title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Check if we're on the login page
    const isOnLoginPage = url.includes('/login');
    console.log(`Is on login page: ${isOnLoginPage}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/current-state.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/current-state.png');
    
    if (isOnLoginPage) {
      console.log('🔑 User not authenticated - attempting to login...');
      
      // Look for login form
      try {
        await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email"]', { timeout: 5000 });
        await page.type('input[type="email"], input[name="email"], input[placeholder*="email"]', 'test@example.com');
        
        await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 5000 });
        await page.type('input[type="password"], input[name="password"]', 'testpassword');
        
        await page.click('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
        
        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        
        console.log('✅ Login successful, new URL:', page.url());
      } catch (error) {
        console.log('⚠️ Could not login automatically:', error.message);
        console.log('💡 You may need to login manually in the browser');
      }
    }
    
    // Check API data by making a direct call
    console.log('🔍 Testing API directly from browser...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/lists?limit=3');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Check what's actually in the DOM
    console.log('🔍 Checking DOM content...');
    const domContent = await page.evaluate(() => {
      const lists = [];
      
      // Look for any elements that might contain list data
      const possibleListElements = document.querySelectorAll('div, article, section');
      
      let foundListCards = 0;
      let foundItemCounts = 0;
      
      possibleListElements.forEach((el, index) => {
        const text = el.textContent || '';
        
        // Look for list-like content
        if (text.includes('List') && text.length > 10 && text.length < 200) {
          foundListCards++;
          lists.push({
            index,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            className: el.className,
            tagName: el.tagName
          });
        }
        
        // Look for item count patterns
        if (/\d+\s*(item|Item)/.test(text) || /\d+\s*$/.test(text.trim())) {
          foundItemCounts++;
        }
      });
      
      return {
        totalElements: possibleListElements.length,
        foundListCards,
        foundItemCounts,
        sampleLists: lists.slice(0, 5),
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('DOM Analysis:', JSON.stringify(domContent, null, 2));
    
    // Wait for user to inspect
    console.log('⏳ Browser will stay open for 60 seconds for manual inspection...');
    console.log('💡 Please login manually if needed to see the lists');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testFrontend().catch(console.error); 