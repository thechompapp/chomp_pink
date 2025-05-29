// Authentication Commands
Cypress.Commands.add('login', (email = Cypress.env('TEST_USER_EMAIL'), password = Cypress.env('TEST_USER_PASSWORD')) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('not.include', '/login')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Navigation Commands
Cypress.Commands.add('navigateTo', (page) => {
  const routes = {
    'dashboard': '/',
    'bulk-add': '/bulk-add',
    'restaurants': '/restaurants',
    'lists': '/lists',
    'admin': '/admin',
    'search': '/search'
  }
  
  if (routes[page]) {
    cy.visit(routes[page])
  } else {
    cy.visit(page)
  }
})

// Bulk Add Commands
Cypress.Commands.add('enterBulkData', (data) => {
  cy.get('[data-testid="bulk-input-textarea"]').clear().type(data, { delay: 0 })
})

Cypress.Commands.add('processBulkData', () => {
  cy.get('[data-testid="process-data-button"]').click()
  cy.get('[data-testid="bulk-review-table"]').should('be.visible')
})

Cypress.Commands.add('selectAllTableRows', () => {
  cy.get('[data-testid="select-all-checkbox"]').click()
})

Cypress.Commands.add('lookupPlace', (rowId) => {
  cy.get(`[data-testid="lookup-button-${rowId}"]`).click()
  cy.get('[data-testid="place-selection-dialog"]').should('be.visible')
})

Cypress.Commands.add('selectPlace', (placeName) => {
  cy.get('[data-testid="place-selection-dialog"]').within(() => {
    cy.contains(placeName).closest('[data-testid^="place-option"]').within(() => {
      cy.get('[data-testid^="select-place-button"]').click()
    })
  })
  cy.get('[data-testid="place-selection-dialog"]').should('not.exist')
})

Cypress.Commands.add('submitBulkData', () => {
  cy.get('[data-testid="submit-all-button"]').click()
  cy.get('[data-testid="success-message"]').should('be.visible')
})

// Search Commands
Cypress.Commands.add('performSearch', (query) => {
  cy.get('[data-testid="search-input"]').clear().type(query)
  cy.get('[data-testid="search-button"]').click()
})

Cypress.Commands.add('applyFilter', (filterType, value) => {
  cy.get(`[data-testid="filter-${filterType}"]`).click()
  cy.get(`[data-testid="filter-option-${value}"]`).click()
})

// Restaurant Management Commands
Cypress.Commands.add('createRestaurant', (restaurantData) => {
  cy.get('[data-testid="add-restaurant-button"]').click()
  cy.get('[data-testid="restaurant-form"]').within(() => {
    cy.get('[data-testid="name-input"]').type(restaurantData.name)
    cy.get('[data-testid="cuisine-input"]').type(restaurantData.cuisine)
    cy.get('[data-testid="location-input"]').type(restaurantData.location)
    if (restaurantData.description) {
      cy.get('[data-testid="description-input"]').type(restaurantData.description)
    }
    cy.get('[data-testid="save-restaurant-button"]').click()
  })
  cy.get('[data-testid="success-message"]').should('contain', 'Restaurant created')
})

Cypress.Commands.add('editRestaurant', (restaurantId, updates) => {
  cy.get(`[data-testid="restaurant-${restaurantId}"]`).within(() => {
    cy.get('[data-testid="edit-button"]').click()
  })
  
  cy.get('[data-testid="restaurant-form"]').within(() => {
    Object.keys(updates).forEach(field => {
      cy.get(`[data-testid="${field}-input"]`).clear().type(updates[field])
    })
    cy.get('[data-testid="save-restaurant-button"]').click()
  })
  
  cy.get('[data-testid="success-message"]').should('contain', 'Restaurant updated')
})

// List Management Commands
Cypress.Commands.add('createList', (listName, description = '') => {
  cy.get('[data-testid="create-list-button"]').click()
  cy.get('[data-testid="list-form"]').within(() => {
    cy.get('[data-testid="list-name-input"]').type(listName)
    if (description) {
      cy.get('[data-testid="list-description-input"]').type(description)
    }
    cy.get('[data-testid="save-list-button"]').click()
  })
  cy.get('[data-testid="success-message"]').should('contain', 'List created')
})

Cypress.Commands.add('addRestaurantToList', (restaurantId, listId) => {
  cy.get(`[data-testid="restaurant-${restaurantId}"]`).within(() => {
    cy.get('[data-testid="add-to-list-button"]').click()
  })
  cy.get(`[data-testid="list-option-${listId}"]`).click()
  cy.get('[data-testid="success-message"]').should('contain', 'Added to list')
})

// Modal and Dialog Commands
Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close-button"]').click()
  cy.get('[role="dialog"]').should('not.exist')
})

Cypress.Commands.add('confirmAction', () => {
  cy.get('[data-testid="confirm-button"]').click()
})

Cypress.Commands.add('cancelAction', () => {
  cy.get('[data-testid="cancel-button"]').click()
})

// Data Seeding Commands
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase')
})

Cypress.Commands.add('clearTestData', () => {
  cy.task('clearDatabase')
})

// Accessibility Commands
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe()
  cy.checkA11y(null, null, (violations) => {
    violations.forEach(violation => {
      cy.log(`A11y violation: ${violation.id} - ${violation.description}`)
    })
  })
})

// Performance Commands
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    return new Promise((resolve) => {
      win.addEventListener('load', () => {
        const perfData = win.performance.timing
        const loadTime = perfData.loadEventEnd - perfData.navigationStart
        cy.log(`Page load time: ${loadTime}ms`)
        resolve(loadTime)
      })
    })
  })
})

// Wait Commands
Cypress.Commands.add('waitForLoader', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
})

Cypress.Commands.add('waitForApiCall', (alias) => {
  cy.wait(`@${alias}`)
  cy.waitForLoader()
}) 