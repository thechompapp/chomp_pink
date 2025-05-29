// Import Cypress commands
import './commands'

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on certain uncaught exceptions we want to ignore
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  return true
})

// Before each test
beforeEach(() => {
  // Mock external APIs by default
  cy.intercept('GET', '**/api/places/search**', { fixture: 'places/search-results.json' }).as('placesSearch')
  cy.intercept('GET', '**/api/places/details/**', { fixture: 'places/place-details.json' }).as('placeDetails')
  cy.intercept('GET', '**/api/neighborhoods/**', { fixture: 'neighborhoods/nyc-neighborhoods.json' }).as('neighborhoods')
  
  // Set default viewport
  cy.viewport(1280, 720)
  
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage()
  cy.clearCookies()
})

// After each test
afterEach(() => {
  // Take screenshot on failure
  cy.screenshot({ capture: 'runner', onlyOnFailure: true })
  
  // Log any console errors
  cy.window().then((win) => {
    if (win.console && win.console.error) {
      const errors = win.console.error.args || []
      if (errors.length > 0) {
        cy.log('Console errors detected:', errors)
      }
    }
  })
}) 