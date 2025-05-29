// End-to-End Tests for Card Components
// These tests verify the complete user workflows involving cards

describe('Card Components E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock_token');
      win.localStorage.setItem('user_data', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Intercept API calls
    cy.intercept('GET', '/api/restaurants*', {
      fixture: 'restaurants.json'
    }).as('getRestaurants');

    cy.intercept('GET', '/api/dishes*', {
      fixture: 'dishes.json'
    }).as('getDishes');

    cy.intercept('GET', '/api/lists*', {
      fixture: 'lists.json'
    }).as('getLists');

    cy.intercept('POST', '/api/lists/*/items', {
      statusCode: 201,
      body: { id: 123, message: 'Item added successfully' }
    }).as('addToList');
  });

  describe('TDD: Restaurant Card Workflows', () => {
    it('should display restaurant cards with standardized layout on trending page', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Verify standardized card layout
      cy.get('[data-testid^="restaurant-card-"]').should('exist');
      cy.get('[data-testid^="restaurant-card-"]').first().should('have.class', 'h-64');
      cy.get('[data-testid^="restaurant-card-"]').first().should('have.class', 'p-4');
      cy.get('[data-testid^="restaurant-card-"]').first().should('have.class', 'border-black');

      // Verify grid layout
      cy.get('.grid').should('have.class', 'grid-cols-1');
      cy.get('.grid').should('have.class', 'sm:grid-cols-2');
      cy.get('.grid').should('have.class', 'md:grid-cols-3');
      cy.get('.grid').should('have.class', 'lg:grid-cols-4');
      cy.get('.grid').should('have.class', 'xl:grid-cols-5');
    });

    it('should allow users to add restaurants to lists', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Click add to list button on first restaurant
      cy.get('[data-testid^="restaurant-card-"]').first().within(() => {
        cy.get('[data-testid="add-to-list-button"]').should('be.visible');
        cy.get('[data-testid="add-to-list-button"]').click();
      });

      // Verify AddToList modal opens
      cy.get('[data-testid="add-to-list-modal"]').should('be.visible');
      cy.get('[data-testid="modal-title"]').should('contain', 'Add to List');

      // Select a list and confirm
      cy.get('[data-testid="list-option"]').first().click();
      cy.get('[data-testid="confirm-add-button"]').click();

      // Verify API call
      cy.wait('@addToList');

      // Verify success feedback
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="add-to-list-modal"]').should('not.exist');
    });

    it('should navigate to restaurant detail page when card is clicked', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Get the first restaurant card and its name
      cy.get('[data-testid^="restaurant-card-"]').first().within(() => {
        cy.get('h3').invoke('text').as('restaurantName');
      });

      // Click the card link (not the add button)
      cy.get('[data-testid^="restaurant-card-"]').first().within(() => {
        cy.get('a').first().click();
      });

      // Verify navigation to restaurant detail page
      cy.url().should('include', '/restaurant/');
      
      // Verify restaurant detail page loads
      cy.get('[data-testid="restaurant-detail"]').should('exist');
    });

    it('should handle external website links correctly', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Find a restaurant card with a website link
      cy.get('[data-testid="external-link-button"]').first().should('exist');

      // Mock window.open to prevent actual navigation
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      // Click the external link button
      cy.get('[data-testid="external-link-button"]').first().click();

      // Verify window.open was called
      cy.get('@windowOpen').should('have.been.calledWith', Cypress.sinon.match.string, '_blank');
    });

    it('should display restaurant badges correctly', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      cy.get('[data-testid^="restaurant-card-"]').first().within(() => {
        // Verify restaurant type badge
        cy.get('[data-testid="restaurant-type-badge"]').should('contain', 'Restaurant');
        cy.get('[data-testid="restaurant-type-badge"]').should('have.class', 'bg-orange-100');

        // Check for optional badges if they exist
        cy.get('body').then($body => {
          if ($body.find('[data-testid="trending-badge"]').length > 0) {
            cy.get('[data-testid="trending-badge"]').should('contain', 'Trending');
          }
          if ($body.find('[data-testid="featured-badge"]').length > 0) {
            cy.get('[data-testid="featured-badge"]').should('contain', 'Featured');
          }
        });
      });
    });
  });

  describe('TDD: Dish Card Workflows', () => {
    beforeEach(() => {
      cy.visit('/trending');
      cy.get('button').contains('Dishes').click();
      cy.wait('@getDishes');
    });

    it('should display dish cards with standardized layout', () => {
      // Verify standardized card layout
      cy.get('[data-testid^="dish-card-"]').should('exist');
      cy.get('[data-testid^="dish-card-"]').first().should('have.class', 'h-64');
      cy.get('[data-testid^="dish-card-"]').first().should('have.class', 'p-4');
      cy.get('[data-testid^="dish-card-"]').first().should('have.class', 'border-black');
    });

    it('should allow users to add dishes to lists', () => {
      // Click add to list button on first dish
      cy.get('[data-testid^="dish-card-"]').first().within(() => {
        cy.get('[data-testid="add-to-list-button"]').click();
      });

      // Verify AddToList modal opens
      cy.get('[data-testid="add-to-list-modal"]').should('be.visible');

      // Select a list and confirm
      cy.get('[data-testid="list-option"]').first().click();
      cy.get('[data-testid="confirm-add-button"]').click();

      // Verify API call
      cy.wait('@addToList');
    });

    it('should display dish type badge correctly', () => {
      cy.get('[data-testid^="dish-card-"]').first().within(() => {
        cy.get('[data-testid="dish-type-badge"]').should('contain', 'Dish');
        cy.get('[data-testid="dish-type-badge"]').should('have.class', 'bg-green-100');
      });
    });

    it('should show dietary badges when applicable', () => {
      cy.get('[data-testid^="dish-card-"]').each($card => {
        cy.wrap($card).within(() => {
          // Check for dietary badges if they exist
          cy.get('body').then($body => {
            if ($body.find('[data-testid="vegetarian-badge"]').length > 0) {
              cy.get('[data-testid="vegetarian-badge"]').should('contain', 'Vegetarian');
            }
            if ($body.find('[data-testid="vegan-badge"]').length > 0) {
              cy.get('[data-testid="vegan-badge"]').should('contain', 'Vegan');
            }
            if ($body.find('[data-testid="spicy-badge"]').length > 0) {
              cy.get('[data-testid="spicy-badge"]').should('contain', 'Spicy');
            }
          });
        });
      });
    });

    it('should navigate to restaurant page when restaurant link is clicked', () => {
      cy.get('[data-testid^="dish-card-"]').first().within(() => {
        cy.get('[data-testid="restaurant-link"]').should('exist');
        cy.get('[data-testid="restaurant-link"]').click();
      });

      cy.url().should('include', '/restaurant/');
    });
  });

  describe('TDD: Search Page Card Integration', () => {
    beforeEach(() => {
      cy.visit('/search');
    });

    it('should display mixed card types in search results with SEARCH grid layout', () => {
      // Perform a search
      cy.get('[data-testid="search-input"]').type('pizza');
      cy.get('[data-testid="search-button"]').click();

      cy.wait('@getRestaurants');
      cy.wait('@getDishes');

      // Verify SEARCH grid layout (4 columns max)
      cy.get('.grid').should('have.class', 'grid-cols-1');
      cy.get('.grid').should('have.class', 'sm:grid-cols-2');
      cy.get('.grid').should('have.class', 'md:grid-cols-3');
      cy.get('.grid').should('have.class', 'lg:grid-cols-4');
      cy.get('.grid').should('not.have.class', 'xl:grid-cols-5'); // Search grid stops at 4 columns

      // Verify mixed content types
      cy.get('[data-testid^="restaurant-card-"]').should('exist');
      cy.get('[data-testid^="dish-card-"]').should('exist');
    });

    it('should allow filtering search results by type', () => {
      cy.get('[data-testid="search-input"]').type('pizza');
      cy.get('[data-testid="search-button"]').click();

      // Filter to only restaurants
      cy.get('[data-testid="filter-restaurants"]').click();
      
      cy.get('[data-testid^="restaurant-card-"]').should('exist');
      cy.get('[data-testid^="dish-card-"]').should('not.exist');

      // Filter to only dishes
      cy.get('[data-testid="filter-dishes"]').click();
      
      cy.get('[data-testid^="dish-card-"]').should('exist');
      cy.get('[data-testid^="restaurant-card-"]').should('not.exist');
    });
  });

  describe('TDD: Home Page Results Integration', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display cards with PRIMARY grid layout in results', () => {
      // Wait for initial data load
      cy.wait('@getRestaurants');

      // Verify PRIMARY grid layout (5 columns max)
      cy.get('.grid').should('have.class', 'grid-cols-1');
      cy.get('.grid').should('have.class', 'sm:grid-cols-2');
      cy.get('.grid').should('have.class', 'md:grid-cols-3');
      cy.get('.grid').should('have.class', 'lg:grid-cols-4');
      cy.get('.grid').should('have.class', 'xl:grid-cols-5');
    });

    it('should handle infinite scroll loading', () => {
      cy.wait('@getRestaurants');

      // Scroll to bottom to trigger more loading
      cy.scrollTo('bottom');

      // Verify more cards are loaded
      cy.get('[data-testid^="restaurant-card-"]').should('have.length.gt', 5);
    });

    it('should maintain card functionality during infinite scroll', () => {
      cy.wait('@getRestaurants');

      // Scroll and load more content
      cy.scrollTo('bottom');

      // Click add to list on a card that was loaded later
      cy.get('[data-testid^="restaurant-card-"]').eq(10).within(() => {
        cy.get('[data-testid="add-to-list-button"]').click();
      });

      // Verify modal still works
      cy.get('[data-testid="add-to-list-modal"]').should('be.visible');
    });
  });

  describe('TDD: CardFactory E2E Integration', () => {
    it('should handle dynamic card type switching', () => {
      cy.visit('/trending');

      // Start with restaurants
      cy.wait('@getRestaurants');
      cy.get('[data-testid^="restaurant-card-"]').should('exist');

      // Switch to dishes
      cy.get('button').contains('Dishes').click();
      cy.wait('@getDishes');
      cy.get('[data-testid^="dish-card-"]').should('exist');
      cy.get('[data-testid^="restaurant-card-"]').should('not.exist');

      // Switch to lists
      cy.get('button').contains('Lists').click();
      cy.wait('@getLists');
      cy.get('[data-testid^="dish-card-"]').should('not.exist');
    });

    it('should maintain consistent interactions across card types', () => {
      cy.visit('/trending');

      // Test restaurant card
      cy.wait('@getRestaurants');
      cy.get('[data-testid^="restaurant-card-"]').first().within(() => {
        cy.get('[data-testid="add-to-list-button"]').should('be.visible');
      });

      // Switch to dishes and test
      cy.get('button').contains('Dishes').click();
      cy.wait('@getDishes');
      cy.get('[data-testid^="dish-card-"]').first().within(() => {
        cy.get('[data-testid="add-to-list-button"]').should('be.visible');
      });
    });
  });

  describe('TDD: Accessibility E2E Tests', () => {
    beforeEach(() => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');
    });

    it('should support keyboard navigation across cards', () => {
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'add-to-list-button');

      // Continue tabbing through cards
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'add-to-list-button');
    });

    it('should support screen readers with proper ARIA labels', () => {
      cy.get('[data-testid^="restaurant-card-"]').first().should('have.attr', 'role', 'article');
      cy.get('[data-testid="add-to-list-button"]').first().should('have.attr', 'aria-label');
      cy.get('[data-testid="rating-display"]').first().should('have.attr', 'aria-label');
    });

    it('should allow keyboard activation of add to list functionality', () => {
      // Tab to first add button
      cy.get('[data-testid="add-to-list-button"]').first().focus();
      
      // Press Enter to activate
      cy.focused().type('{enter}');

      // Verify modal opens
      cy.get('[data-testid="add-to-list-modal"]').should('be.visible');
    });
  });

  describe('TDD: Responsive Layout E2E Tests', () => {
    it('should adapt grid layout for mobile viewport', () => {
      cy.viewport(375, 667); // iPhone SE size
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Should show single column on mobile
      cy.get('[data-testid^="restaurant-card-"]').should('be.visible');
      
      // Verify cards stack vertically
      cy.get('[data-testid^="restaurant-card-"]').first().then($first => {
        cy.get('[data-testid^="restaurant-card-"]').eq(1).then($second => {
          expect($second[0].offsetTop).to.be.greaterThan($first[0].offsetTop + $first[0].offsetHeight - 50);
        });
      });
    });

    it('should adapt grid layout for tablet viewport', () => {
      cy.viewport(768, 1024); // iPad size
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Should show 3 columns on tablet
      cy.get('[data-testid^="restaurant-card-"]').should('have.length.gte', 3);
      
      // Verify cards are arranged horizontally
      cy.get('[data-testid^="restaurant-card-"]').first().then($first => {
        cy.get('[data-testid^="restaurant-card-"]').eq(1).then($second => {
          cy.get('[data-testid^="restaurant-card-"]').eq(2).then($third => {
            // All three should be roughly on the same row
            expect(Math.abs($second[0].offsetTop - $first[0].offsetTop)).to.be.lessThan(50);
            expect(Math.abs($third[0].offsetTop - $first[0].offsetTop)).to.be.lessThan(50);
          });
        });
      });
    });

    it('should adapt grid layout for desktop viewport', () => {
      cy.viewport(1920, 1080); // Desktop size
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Should show 5 columns on large desktop
      cy.get('[data-testid^="restaurant-card-"]').should('have.length.gte', 5);
      
      // Verify 5 cards fit horizontally
      cy.get('[data-testid^="restaurant-card-"]').first().then($first => {
        const firstTop = $first[0].offsetTop;
        let horizontalCount = 1;
        
        for (let i = 1; i < 5; i++) {
          cy.get('[data-testid^="restaurant-card-"]').eq(i).then($card => {
            if (Math.abs($card[0].offsetTop - firstTop) < 50) {
              horizontalCount++;
            }
          });
        }
        
        expect(horizontalCount).to.equal(5);
      });
    });
  });

  describe('TDD: Performance E2E Tests', () => {
    it('should load cards efficiently with large datasets', () => {
      // Mock large dataset
      cy.intercept('GET', '/api/restaurants*', {
        fixture: 'large_restaurants.json'
      }).as('getLargeRestaurants');

      cy.visit('/trending');
      cy.wait('@getLargeRestaurants');

      // Verify initial load is fast (should render within 2 seconds)
      cy.get('[data-testid^="restaurant-card-"]', { timeout: 2000 }).should('have.length.gte', 25);

      // Verify smooth scrolling performance
      cy.scrollTo('bottom', { duration: 1000 });
      cy.get('[data-testid^="restaurant-card-"]').should('have.length.gte', 50);
    });

    it('should handle rapid user interactions without performance degradation', () => {
      cy.visit('/trending');
      cy.wait('@getRestaurants');

      // Rapidly click through multiple add buttons
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid^="restaurant-card-"]').eq(i).within(() => {
          cy.get('[data-testid="add-to-list-button"]').click();
        });
        cy.get('[data-testid="add-to-list-modal"]').should('be.visible');
        cy.get('[data-testid="close-modal-button"]').click();
        cy.get('[data-testid="add-to-list-modal"]').should('not.exist');
      }

      // Verify the page is still responsive
      cy.get('[data-testid^="restaurant-card-"]').first().should('be.visible');
    });
  });

  describe('TDD: Error Handling E2E Tests', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/restaurants*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getRestaurantsError');

      cy.visit('/trending');
      cy.wait('@getRestaurantsError');

      // Verify error state is displayed
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Test retry functionality
      cy.intercept('GET', '/api/restaurants*', {
        fixture: 'restaurants.json'
      }).as('getRestaurantsRetry');

      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@getRestaurantsRetry');

      // Verify cards load after retry
      cy.get('[data-testid^="restaurant-card-"]').should('exist');
    });

    it('should handle network timeout gracefully', () => {
      cy.intercept('GET', '/api/restaurants*', {
        delay: 30000, // 30 second delay to simulate timeout
        fixture: 'restaurants.json'
      }).as('getRestaurantsTimeout');

      cy.visit('/trending');

      // Verify loading state is shown
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');

      // Verify timeout handling (adjust timeout as needed)
      cy.get('[data-testid="error-message"]', { timeout: 35000 }).should('be.visible');
    });
  });
}); 