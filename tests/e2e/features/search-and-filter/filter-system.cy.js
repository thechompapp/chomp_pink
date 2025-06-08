/**
 * Filter System E2E Test
 * 
 * This test validates the filter system components:
 * - Tests loading states appear and disappear correctly
 * - Confirms cities and cuisines are loaded and displayed
 * - Tests selection and deselection of filter items
 * - Tests dependent filters (borough shows after city selection)
 * - Tests the filter controls component
 */

describe('Filter System E2E Test', () => {
  beforeEach(() => {
    // Visit the home page where filters are displayed
    cy.visit('/');
    
    // Wait for initial data to load
    cy.intercept('GET', '/api/filters/cities').as('getCities');
    cy.intercept('GET', '/api/filters/cuisines').as('getCuisines');
    
    // Log for debugging during test runs
    cy.log('Starting filter system E2E test');
  });

  it('should display the filter container and load data correctly', () => {
    // Check the filter container exists
    cy.get('.bg-white.border.border-black.rounded-lg').should('exist');
    
    // Verify initial loading states show up
    cy.contains('Loading...').should('exist');
    
    // Wait for API responses
    cy.wait(['@getCities', '@getCuisines']);
    
    // After data loads, loading indicators should disappear
    cy.contains('Loading...').should('not.exist');
    
    // Verify cities data is displayed
    cy.get('.space-y-4').within(() => {
      cy.contains('City').should('exist');
      // Check at least one city is rendered
      cy.get('[type="city"]').should('have.length.at.least', 1);
    });
    
    // Verify cuisines data is displayed
    cy.contains('Cuisines').should('exist');
    cy.get('div').contains('Available Cuisines').parent().within(() => {
      // Check at least one cuisine is rendered
      cy.get('[type="cuisine"]').should('have.length.at.least', 1);
    });
  });

  it('should select and deselect cities and show boroughs when appropriate', () => {
    // Wait for data to load
    cy.wait(['@getCities', '@getCuisines']);
    
    // Select the first city
    cy.get('[type="city"]').first().click();
    
    // Verify the city is selected (has appropriate styling)
    cy.get('[type="city"]').first().should('have.class', 'bg-primary');
    
    // If the city has boroughs, borough section should appear
    cy.intercept('GET', '/api/filters/boroughs*').as('getBoroughs');
    
    // Wait for boroughs to load (if the selected city has boroughs)
    cy.wait('@getBoroughs', { timeout: 10000 }).then((interception) => {
      if (interception.response.statusCode === 200 && interception.response.body.length > 0) {
        // Boroughs should be visible
        cy.contains('Borough').should('exist');
        cy.get('[type="borough"]').should('have.length.at.least', 1);
        
        // Select the first borough
        cy.get('[type="borough"]').first().click();
        
        // Verify the borough is selected
        cy.get('[type="borough"]').first().should('have.class', 'bg-primary');
        
        // Neighborhoods should now load
        cy.intercept('GET', '/api/filters/neighborhoods*').as('getNeighborhoods');
        cy.wait('@getNeighborhoods');
        
        // If there are neighborhoods, they should be visible
        cy.get('body').then($body => {
          if ($body.find('[type="neighborhood"]').length > 0) {
            cy.contains('Neighborhood').should('exist');
            cy.get('[type="neighborhood"]').first().click();
            cy.get('[type="neighborhood"]').first().should('have.class', 'bg-primary');
          }
        });
      }
    });
    
    // Deselect the city by clicking it again (if that's how the UI works)
    // Otherwise, use the filter controls to clear filters
    cy.contains('City').parent().within(() => {
      cy.get('[type="city"]').first().click();
    });
  });

  it('should select and deselect cuisines', () => {
    // Wait for data to load
    cy.wait(['@getCities', '@getCuisines']);
    
    // Select the first cuisine
    cy.contains('Available Cuisines').parent().within(() => {
      cy.get('[type="cuisine"]').first().click();
    });
    
    // Verify the cuisine is selected (has appropriate styling)
    cy.get('[type="cuisine"]').first().should('have.class', 'bg-primary');
    
    // The selected cuisine should also appear in the Selected section
    cy.contains('Selected').should('exist');
    cy.get('.badge').should('have.length.at.least', 1);
    
    // Remove the cuisine by clicking the X in the badge
    cy.get('.badge').first().within(() => {
      cy.get('button').click();
    });
    
    // The Selected section should no longer be visible
    cy.contains('Selected').should('not.exist');
  });

  it('should test cuisine search functionality', () => {
    // Wait for data to load
    cy.wait(['@getCities', '@getCuisines']);
    
    // Type in the search box
    cy.contains('Search Cuisines').parent().within(() => {
      cy.get('input').type('ita');
    });
    
    // Wait for search results
    cy.intercept('GET', '/api/filters/cuisines*').as('searchCuisines');
    cy.wait('@searchCuisines');
    
    // Verify search results contain the query
    cy.get('[type="cuisine"]').each(($el) => {
      cy.wrap($el).invoke('text').then((text) => {
        expect(text.toLowerCase()).to.include('ita');
      });
    });
    
    // Clear the search
    cy.contains('Search Cuisines').parent().within(() => {
      cy.get('button').click();
    });
    
    // Verify original list is restored
    cy.get('[type="cuisine"]').should('have.length.at.least', 1);
  });

  it('should test the filter controls component', () => {
    // Wait for data to load
    cy.wait(['@getCities', '@getCuisines']);
    
    // Select a city and a cuisine to activate filters
    cy.get('[type="city"]').first().click();
    cy.get('[type="cuisine"]').first().click();
    
    // Filter controls should now be visible
    cy.contains('filter active').should('exist');
    
    // Click the Clear All button
    cy.contains('Clear All').click();
    
    // Verify all selections are cleared
    cy.get('[type="city"].bg-primary').should('not.exist');
    cy.get('[type="cuisine"].bg-primary').should('not.exist');
    
    // Filter controls should be hidden again
    cy.contains('filter active').should('not.exist');
  });
}); 