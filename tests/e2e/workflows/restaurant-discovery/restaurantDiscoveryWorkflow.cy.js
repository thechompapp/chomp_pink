describe('Restaurant Discovery Workflow E2E', () => {
  beforeEach(() => {
    // Login as authenticated user
    cy.login()
    
    // Seed database with test restaurants
    cy.seedTestData()
    
    // Setup API mocks
    cy.intercept('GET', '**/api/restaurants/search**', { fixture: 'restaurants/search-results.json' }).as('searchRestaurants')
    cy.intercept('GET', '**/api/restaurants**', { fixture: 'restaurants/restaurant-list.json' }).as('getRestaurants')
    cy.intercept('POST', '**/api/restaurants', { fixture: 'restaurants/create-success.json' }).as('createRestaurant')
    cy.intercept('PUT', '**/api/restaurants/**', { fixture: 'restaurants/update-success.json' }).as('updateRestaurant')
    
    // Navigate to restaurants page
    cy.navigateTo('restaurants')
    cy.url().should('include', '/restaurants')
  })

  describe('Search and Discovery', () => {
    it('should perform comprehensive restaurant search', () => {
      cy.log('Testing restaurant search functionality')
      
      // Initial load
      cy.waitForApiCall('getRestaurants')
      cy.get('[data-testid="restaurant-list"]').should('be.visible')
      cy.get('[data-testid="restaurant-item"]').should('have.length.at.least', 1)
      
      // Search by name
      cy.performSearch('pizza')
      cy.waitForApiCall('searchRestaurants')
      
      // Verify search results
      cy.get('[data-testid="search-results"]').should('be.visible')
      cy.get('[data-testid="restaurant-item"]').each($item => {
        cy.wrap($item).should('contain.text', 'Pizza').or('contain.text', 'pizza')
      })
      
      // Clear search and verify full list returns
      cy.get('[data-testid="clear-search"]').click()
      cy.waitForApiCall('getRestaurants')
      cy.get('[data-testid="restaurant-item"]').should('have.length.at.least', 5)
    })

    it('should filter restaurants by multiple criteria', () => {
      cy.log('Testing restaurant filtering')
      
      // Filter by cuisine
      cy.applyFilter('cuisine', 'italian')
      cy.waitForApiCall('searchRestaurants')
      
      cy.get('[data-testid="active-filters"]').should('contain', 'Italian')
      cy.get('[data-testid="filter-results-count"]').should('be.visible')
      
      // Add neighborhood filter
      cy.applyFilter('neighborhood', 'lower-east-side')
      cy.waitForApiCall('searchRestaurants')
      
      cy.get('[data-testid="active-filters"]').should('contain', 'Lower East Side')
      
      // Add price range filter
      cy.applyFilter('price', '$$')
      cy.waitForApiCall('searchRestaurants')
      
      cy.get('[data-testid="active-filters"]').should('contain', '$$')
      
      // Verify filtered results
      cy.get('[data-testid="restaurant-item"]').each($item => {
        cy.wrap($item).within(() => {
          cy.get('[data-testid="cuisine"]').should('contain', 'Italian')
          cy.get('[data-testid="neighborhood"]').should('contain', 'Lower East Side')
          cy.get('[data-testid="price"]').should('contain', '$$')
        })
      })
      
      // Clear all filters
      cy.get('[data-testid="clear-all-filters"]').click()
      cy.waitForApiCall('getRestaurants')
      cy.get('[data-testid="active-filters"]').should('not.exist')
    })

    it('should handle advanced search with multiple parameters', () => {
      cy.log('Testing advanced search functionality')
      
      // Open advanced search
      cy.get('[data-testid="advanced-search-toggle"]').click()
      cy.get('[data-testid="advanced-search-panel"]').should('be.visible')
      
      // Fill advanced search form
      cy.get('[data-testid="advanced-search-panel"]').within(() => {
        cy.get('[data-testid="name-input"]').type('famous')
        cy.get('[data-testid="cuisine-select"]').select('Chinese')
        cy.get('[data-testid="neighborhood-select"]').select('East Village')
        cy.get('[data-testid="rating-slider"]').invoke('val', 4).trigger('input')
        cy.get('[data-testid="open-now-checkbox"]').check()
        cy.get('[data-testid="search-button"]').click()
      })
      
      cy.waitForApiCall('searchRestaurants')
      
      // Verify advanced search results
      cy.get('[data-testid="restaurant-item"]').each($item => {
        cy.wrap($item).within(() => {
          cy.get('[data-testid="restaurant-name"]').should('contain', 'Famous')
          cy.get('[data-testid="rating"]').invoke('text').then(text => {
            expect(parseFloat(text)).to.be.at.least(4)
          })
          cy.get('[data-testid="open-indicator"]').should('have.class', 'open')
        })
      })
    })
  })

  describe('Restaurant Details and Management', () => {
    it('should view and interact with restaurant details', () => {
      cy.log('Testing restaurant details view')
      
      // Click on first restaurant
      cy.get('[data-testid="restaurant-item"]').first().click()
      cy.url().should('match', /\/restaurants\/\d+/)
      
      // Verify restaurant details page
      cy.get('[data-testid="restaurant-details"]').should('be.visible')
      cy.get('[data-testid="restaurant-name"]').should('be.visible')
      cy.get('[data-testid="restaurant-address"]').should('be.visible')
      cy.get('[data-testid="restaurant-rating"]').should('be.visible')
      cy.get('[data-testid="restaurant-photos"]').should('be.visible')
      
      // Test photo gallery
      cy.get('[data-testid="photo-thumbnail"]').first().click()
      cy.get('[data-testid="photo-modal"]').should('be.visible')
      cy.get('[data-testid="photo-nav-next"]').click()
      cy.closeModal()
      
      // Test reviews section
      cy.get('[data-testid="reviews-section"]').should('be.visible')
      cy.get('[data-testid="review-item"]').should('have.length.at.least', 1)
      
      // Test map integration
      cy.get('[data-testid="restaurant-map"]').should('be.visible')
      cy.get('[data-testid="map-marker"]').should('be.visible')
      
      // Test directions
      cy.get('[data-testid="get-directions"]').click()
      cy.get('[data-testid="directions-modal"]').should('be.visible')
      cy.closeModal()
    })

    it('should add restaurant to lists', () => {
      cy.log('Testing add to list functionality')
      
      // From restaurant list view
      cy.get('[data-testid="restaurant-item"]').first().within(() => {
        cy.get('[data-testid="add-to-list-button"]').click()
      })
      
      cy.get('[data-testid="list-selection-modal"]').should('be.visible')
      
      // Create new list
      cy.get('[data-testid="create-new-list"]').click()
      cy.get('[data-testid="list-name-input"]').type('My Favorite Restaurants')
      cy.get('[data-testid="list-description-input"]').type('Places I want to try')
      cy.get('[data-testid="create-list-button"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Added to list')
      
      // Verify list was created and restaurant added
      cy.navigateTo('lists')
      cy.get('[data-testid="list-item"]').should('contain', 'My Favorite Restaurants')
      cy.get('[data-testid="list-item"]').first().click()
      cy.get('[data-testid="list-restaurant-item"]').should('have.length', 1)
    })
  })

  describe('Restaurant CRUD Operations', () => {
    it('should create a new restaurant', () => {
      cy.log('Testing restaurant creation')
      
      const newRestaurant = {
        name: 'New Test Restaurant',
        cuisine: 'American',
        location: '123 Test St, New York, NY',
        description: 'A great new restaurant for testing'
      }
      
      cy.createRestaurant(newRestaurant)
      
      // Verify restaurant appears in list
      cy.navigateTo('restaurants')
      cy.waitForApiCall('getRestaurants')
      cy.get('[data-testid="restaurant-item"]').should('contain', newRestaurant.name)
    })

    it('should edit restaurant information', () => {
      cy.log('Testing restaurant editing')
      
      // Get first restaurant ID and edit it
      cy.get('[data-testid="restaurant-item"]').first().within(() => {
        cy.get('[data-testid="restaurant-id"]').invoke('text').then(id => {
          cy.editRestaurant(id, {
            name: 'Updated Restaurant Name',
            description: 'Updated description for testing'
          })
        })
      })
      
      // Verify changes are reflected
      cy.get('[data-testid="restaurant-item"]').first().should('contain', 'Updated Restaurant Name')
    })

    it('should handle restaurant deletion', () => {
      cy.log('Testing restaurant deletion')
      
      // Count initial restaurants
      cy.get('[data-testid="restaurant-item"]').its('length').then(initialCount => {
        // Delete first restaurant
        cy.get('[data-testid="restaurant-item"]').first().within(() => {
          cy.get('[data-testid="delete-button"]').click()
        })
        
        // Confirm deletion
        cy.get('[data-testid="confirm-delete-modal"]').should('be.visible')
        cy.confirmAction()
        
        cy.get('[data-testid="success-message"]').should('contain', 'Restaurant deleted')
        
        // Verify count decreased
        cy.get('[data-testid="restaurant-item"]').should('have.length', initialCount - 1)
      })
    })
  })

  describe('Sorting and Pagination', () => {
    it('should sort restaurants by different criteria', () => {
      cy.log('Testing restaurant sorting')
      
      // Sort by name A-Z
      cy.get('[data-testid="sort-select"]').select('name-asc')
      cy.waitForApiCall('getRestaurants')
      
      // Verify sorting
      cy.get('[data-testid="restaurant-name"]').then($names => {
        const names = [...$names].map(el => el.textContent)
        const sortedNames = [...names].sort()
        expect(names).to.deep.equal(sortedNames)
      })
      
      // Sort by rating (highest first)
      cy.get('[data-testid="sort-select"]').select('rating-desc')
      cy.waitForApiCall('getRestaurants')
      
      // Verify rating sorting
      cy.get('[data-testid="restaurant-rating"]').then($ratings => {
        const ratings = [...$ratings].map(el => parseFloat(el.textContent))
        const sortedRatings = [...ratings].sort((a, b) => b - a)
        expect(ratings).to.deep.equal(sortedRatings)
      })
    })

    it('should handle pagination correctly', () => {
      cy.log('Testing pagination')
      
      // Verify pagination controls
      cy.get('[data-testid="pagination"]').should('be.visible')
      cy.get('[data-testid="page-info"]').should('contain', 'Page 1')
      
      // Go to next page
      cy.get('[data-testid="next-page"]').click()
      cy.waitForApiCall('getRestaurants')
      
      cy.get('[data-testid="page-info"]').should('contain', 'Page 2')
      cy.url().should('include', 'page=2')
      
      // Go to specific page
      cy.get('[data-testid="page-3"]').click()
      cy.waitForApiCall('getRestaurants')
      
      cy.get('[data-testid="page-info"]').should('contain', 'Page 3')
      
      // Change items per page
      cy.get('[data-testid="items-per-page"]').select('50')
      cy.waitForApiCall('getRestaurants')
      
      cy.get('[data-testid="restaurant-item"]').should('have.length.at.most', 50)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle no search results gracefully', () => {
      cy.log('Testing no results scenario')
      
      // Setup empty search results
      cy.intercept('GET', '**/api/restaurants/search**', { data: [], total: 0 }).as('emptySearch')
      
      cy.performSearch('nonexistentrestaurant')
      cy.waitForApiCall('emptySearch')
      
      // Verify no results state
      cy.get('[data-testid="no-results"]').should('be.visible')
      cy.get('[data-testid="no-results-message"]').should('contain', 'No restaurants found')
      cy.get('[data-testid="search-suggestions"]').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.log('Testing network error handling')
      
      // Setup network error
      cy.intercept('GET', '**/api/restaurants**', { statusCode: 500 }).as('networkError')
      
      cy.reload()
      cy.wait('@networkError')
      
      // Verify error state
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Test retry functionality
      cy.intercept('GET', '**/api/restaurants**', { fixture: 'restaurants/restaurant-list.json' }).as('retrySuccess')
      cy.get('[data-testid="retry-button"]').click()
      cy.waitForApiCall('retrySuccess')
      
      cy.get('[data-testid="restaurant-list"]').should('be.visible')
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle large result sets efficiently', () => {
      cy.log('Testing performance with large datasets')
      
      // Setup large dataset response
      cy.intercept('GET', '**/api/restaurants**', { 
        fixture: 'restaurants/large-restaurant-list.json',
        delay: 100 
      }).as('largeDataset')
      
      cy.reload()
      cy.waitForApiCall('largeDataset')
      
      // Verify performance indicators
      cy.get('[data-testid="loading-indicator"]').should('not.exist')
      cy.get('[data-testid="restaurant-list"]').should('be.visible')
      
      // Test scrolling performance
      cy.get('[data-testid="restaurant-list"]').scrollTo('bottom')
      cy.get('[data-testid="load-more-indicator"]').should('be.visible')
      
      // Test search performance with large dataset
      const startTime = Date.now()
      cy.performSearch('test')
      cy.waitForApiCall('searchRestaurants')
      
      cy.then(() => {
        const searchTime = Date.now() - startTime
        expect(searchTime).to.be.lessThan(3000) // Should complete within 3 seconds
      })
    })
  })

  describe('Accessibility and Usability', () => {
    it('should maintain accessibility standards', () => {
      cy.log('Testing accessibility compliance')
      
      // Check initial page accessibility
      cy.checkA11y()
      
      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'search-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'search-button')
      
      // Test screen reader support
      cy.get('[data-testid="search-results-summary"]').should('have.attr', 'aria-live', 'polite')
      
      // Test filter accessibility
      cy.get('[data-testid="cuisine-filter"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="cuisine-filter"]').click()
      cy.checkA11y()
    })

    it('should work well on mobile devices', () => {
      cy.log('Testing mobile responsiveness')
      
      // Switch to mobile viewport
      cy.viewport('iphone-x')
      
      // Verify mobile layout
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible')
      cy.get('[data-testid="desktop-filters"]').should('not.be.visible')
      
      // Test mobile search
      cy.get('[data-testid="mobile-search"]').click()
      cy.get('[data-testid="mobile-search-overlay"]').should('be.visible')
      cy.performSearch('pizza')
      
      // Test mobile filters
      cy.get('[data-testid="mobile-filters-button"]').click()
      cy.get('[data-testid="mobile-filters-drawer"]').should('be.visible')
      cy.applyFilter('cuisine', 'italian')
      cy.get('[data-testid="apply-filters"]').click()
      
      // Verify mobile list view
      cy.get('[data-testid="restaurant-card"]').should('have.class', 'mobile-layout')
    })
  })
}) 