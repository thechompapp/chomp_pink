describe('Bulk Add Complete Workflow E2E', () => {
  const testRestaurantData = [
    'Dirt Candy; restaurant; New York; Vegetarian',
    'Katz\'s Delicatessen; restaurant; New York; Deli',
    'Joe\'s Pizza; restaurant; New York; Pizza',
    'Xi\'an Famous Foods; restaurant; New York; Chinese',
    'Russ & Daughters; restaurant; New York; Jewish'
  ].join('\n')

  beforeEach(() => {
    // Login as authenticated user
    cy.login()
    
    // Clear any existing data
    cy.clearTestData()
    
    // Setup API mocks with realistic responses
    cy.intercept('POST', '**/api/bulk-add/parse', { fixture: 'bulk-add/parsed-data.json' }).as('parseData')
    cy.intercept('POST', '**/api/bulk-add/validate', { fixture: 'bulk-add/validation-success.json' }).as('validateData')
    cy.intercept('POST', '**/api/bulk-add/submit', { fixture: 'bulk-add/submission-success.json' }).as('submitData')
    
    // Navigate to bulk add page
    cy.navigateTo('bulk-add')
    cy.url().should('include', '/bulk-add')
  })

  describe('Complete Happy Path Workflow', () => {
    it('should complete entire bulk add workflow successfully', () => {
      // Step 1: Input Data
      cy.log('Step 1: Entering bulk restaurant data')
      cy.get('[data-testid="bulk-input-form"]').should('be.visible')
      cy.enterBulkData(testRestaurantData)
      
      // Verify format detection
      cy.get('[data-testid="format-indicator"]').should('contain', 'semicolon')
      cy.get('[data-testid="line-count"]').should('contain', '5 lines')
      
      // Step 2: Process Data
      cy.log('Step 2: Processing bulk data')
      cy.processBulkData()
      cy.waitForApiCall('parseData')
      cy.waitForApiCall('validateData')
      
      // Verify review table appears
      cy.get('[data-testid="bulk-review-table"]').should('be.visible')
      cy.get('[data-testid="review-table-row"]').should('have.length', 5)
      
      // Step 3: Review and Lookup Places
      cy.log('Step 3: Looking up places for restaurants')
      
      // Verify all restaurants are in "new" status
      cy.get('[data-testid="status-new"]').should('have.length', 5)
      
      // Lookup first restaurant
      cy.lookupPlace(1)
      cy.waitForApiCall('placesSearch')
      cy.selectPlace('Dirt Candy')
      cy.waitForApiCall('placeDetails')
      cy.waitForApiCall('neighborhoods')
      
      // Verify status changed to "found"
      cy.get('[data-testid="row-1"]').within(() => {
        cy.get('[data-testid="status-found"]').should('be.visible')
        cy.get('[data-testid="place-name"]').should('contain', 'Dirt Candy')
        cy.get('[data-testid="neighborhood"]').should('contain', 'Lower East Side')
      })
      
      // Batch lookup remaining restaurants
      cy.selectAllTableRows()
      cy.get('[data-testid="batch-lookup-button"]').click()
      
      // Wait for all lookups to complete
      cy.get('[data-testid="batch-processing-indicator"]').should('be.visible')
      cy.get('[data-testid="batch-processing-indicator"]').should('not.exist', { timeout: 15000 })
      
      // Step 4: Review Summary
      cy.log('Step 4: Reviewing summary before submission')
      cy.get('[data-testid="summary-stats"]').within(() => {
        cy.get('[data-testid="total-items"]').should('contain', '5')
        cy.get('[data-testid="ready-to-submit"]').should('contain', '5')
        cy.get('[data-testid="errors"]').should('contain', '0')
      })
      
      // Step 5: Submit Data
      cy.log('Step 5: Submitting bulk data')
      cy.submitBulkData()
      cy.waitForApiCall('submitData')
      
      // Verify success
      cy.get('[data-testid="success-message"]').should('contain', 'Successfully added 5 restaurants')
      cy.get('[data-testid="success-details"]').within(() => {
        cy.get('[data-testid="restaurants-added"]').should('contain', '5')
        cy.get('[data-testid="places-resolved"]').should('contain', '5')
        cy.get('[data-testid="neighborhoods-found"]').should('contain', '5')
      })
      
      // Verify navigation to results
      cy.url().should('include', '/restaurants')
      cy.get('[data-testid="restaurant-list"]').should('be.visible')
      cy.get('[data-testid="restaurant-item"]').should('have.length.at.least', 5)
    })

    it('should handle mixed status workflow (some found, some errors)', () => {
      // Setup mixed validation response
      cy.intercept('POST', '**/api/bulk-add/validate', { fixture: 'bulk-add/validation-mixed.json' }).as('validateMixed')
      
      cy.enterBulkData([
        'Dirt Candy; restaurant; New York; Vegetarian',
        '; restaurant; ; Invalid',  // Invalid entry
        'Valid Restaurant; restaurant; New York; American',
        'Another Invalid; ; ; '     // Another invalid
      ].join('\n'))
      
      cy.processBulkData()
      cy.waitForApiCall('parseData')
      cy.waitForApiCall('validateMixed')
      
      // Verify mixed statuses
      cy.get('[data-testid="status-new"]').should('have.length', 2)
      cy.get('[data-testid="status-error"]').should('have.length', 2)
      
      // Review errors
      cy.get('[data-testid="error-summary"]').should('be.visible')
      cy.get('[data-testid="error-item"]').should('have.length', 2)
      
      // Fix one error by editing
      cy.get('[data-testid="row-2"]').within(() => {
        cy.get('[data-testid="edit-button"]').click()
        cy.get('[data-testid="name-input"]').type('Fixed Restaurant Name')
        cy.get('[data-testid="location-input"]').type('New York')
        cy.get('[data-testid="save-button"]').click()
      })
      
      // Verify error count reduced
      cy.get('[data-testid="summary-stats"]').within(() => {
        cy.get('[data-testid="errors"]').should('contain', '1')
        cy.get('[data-testid="ready-to-submit"]').should('contain', '3')
      })
      
      // Submit only valid items
      cy.get('[data-testid="submit-valid-only"]').click()
      cy.waitForApiCall('submitData')
      
      cy.get('[data-testid="success-message"]').should('contain', 'Successfully added 3 restaurants')
      cy.get('[data-testid="warning-message"]').should('contain', '1 item had errors and was not submitted')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle API failures gracefully', () => {
      // Setup API failure responses
      cy.intercept('GET', '**/api/places/search**', { statusCode: 500 }).as('placesSearchError')
      
      cy.enterBulkData('Test Restaurant; restaurant; New York; American')
      cy.processBulkData()
      
      // Attempt place lookup
      cy.lookupPlace(1)
      cy.wait('@placesSearchError')
      
      // Verify error handling
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to search for places')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Test retry functionality
      cy.intercept('GET', '**/api/places/search**', { fixture: 'places/search-results.json' }).as('placesSearchRetry')
      cy.get('[data-testid="retry-button"]').click()
      cy.waitForApiCall('placesSearchRetry')
      
      // Verify recovery
      cy.get('[data-testid="place-selection-dialog"]').should('be.visible')
    })

    it('should handle network timeouts and retries', () => {
      // Setup slow response that times out
      cy.intercept('POST', '**/api/bulk-add/submit', { delay: 20000 }).as('slowSubmit')
      
      cy.enterBulkData('Test Restaurant; restaurant; New York; American')
      cy.processBulkData()
      
      // Attempt submission
      cy.submitBulkData()
      
      // Verify timeout handling
      cy.get('[data-testid="timeout-warning"]').should('be.visible', { timeout: 15000 })
      cy.get('[data-testid="retry-submission"]').should('be.visible')
      
      // Setup successful retry
      cy.intercept('POST', '**/api/bulk-add/submit', { fixture: 'bulk-add/submission-success.json' }).as('successfulSubmit')
      cy.get('[data-testid="retry-submission"]').click()
      cy.waitForApiCall('successfulSubmit')
      
      cy.get('[data-testid="success-message"]').should('be.visible')
    })
  })

  describe('Large Dataset Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Generate large dataset (100 restaurants)
      const largeDataset = Array.from({ length: 100 }, (_, i) => 
        `Restaurant ${i + 1}; restaurant; New York; Cuisine ${i % 10}`
      ).join('\n')
      
      // Track performance
      cy.measurePageLoad()
      
      cy.enterBulkData(largeDataset)
      
      // Verify performance indicators
      cy.get('[data-testid="performance-warning"]').should('not.exist')
      cy.get('[data-testid="line-count"]').should('contain', '100 lines')
      
      // Process large dataset
      const startTime = Date.now()
      cy.processBulkData()
      cy.waitForApiCall('parseData')
      
      // Verify processing time is reasonable (< 5 seconds)
      cy.then(() => {
        const processingTime = Date.now() - startTime
        expect(processingTime).to.be.lessThan(5000)
      })
      
      // Verify pagination for large results
      cy.get('[data-testid="pagination"]').should('be.visible')
      cy.get('[data-testid="items-per-page"]').should('contain', '20')
      cy.get('[data-testid="total-pages"]').should('contain', '5')
    })
  })

  describe('Accessibility Compliance', () => {
    it('should maintain accessibility throughout workflow', () => {
      // Check initial accessibility
      cy.checkA11y()
      
      cy.enterBulkData(testRestaurantData)
      cy.checkA11y()
      
      cy.processBulkData()
      cy.waitForApiCall('parseData')
      cy.checkA11y()
      
      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'lookup-button-1')
      
      cy.focused().type('{enter}')
      cy.waitForApiCall('placesSearch')
      cy.checkA11y()
      
      // Test screen reader announcements
      cy.get('[role="status"]').should('exist')
      cy.get('[aria-live="polite"]').should('exist')
    })
  })

  describe('Cross-Browser Compatibility', () => {
    ['chrome', 'firefox', 'edge'].forEach(browser => {
      it(`should work correctly in ${browser}`, () => {
        // Note: This would be configured in CI/CD to run across browsers
        cy.enterBulkData('Test Restaurant; restaurant; New York; American')
        cy.processBulkData()
        
        // Verify core functionality works
        cy.get('[data-testid="bulk-review-table"]').should('be.visible')
        cy.get('[data-testid="submit-all-button"]').should('be.visible')
      })
    })
  })

  describe('Data Validation and Edge Cases', () => {
    it('should handle special characters and Unicode', () => {
      const unicodeData = [
        'Café René; restaurant; New York; French',
        'José\'s Tacos; restaurant; New York; Mexican',
        '老北京; restaurant; New York; Chinese',
        'München Haus; restaurant; New York; German'
      ].join('\n')
      
      cy.enterBulkData(unicodeData)
      cy.processBulkData()
      
      // Verify Unicode handling
      cy.get('[data-testid="restaurant-name"]').eq(0).should('contain', 'Café René')
      cy.get('[data-testid="restaurant-name"]').eq(2).should('contain', '老北京')
      cy.get('[data-testid="restaurant-name"]').eq(3).should('contain', 'München Haus')
    })

    it('should handle very long input strings', () => {
      const longName = 'A'.repeat(500)
      const longData = `${longName}; restaurant; New York; American`
      
      cy.enterBulkData(longData)
      cy.processBulkData()
      
      // Verify truncation and handling
      cy.get('[data-testid="validation-warning"]').should('contain', 'Name too long')
      cy.get('[data-testid="truncated-indicator"]').should('be.visible')
    })
  })
}) 