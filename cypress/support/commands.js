// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Reset test database command
Cypress.Commands.add('resetTestDatabase', () => {
  cy.request('POST', 'http://localhost:5001/api/test/reset');
});

// Create test user command
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:5001/api/test/users',
    body: userData,
  });
});

// Custom test ID selectors
Cypress.Commands.add('getByTestId', (testId, ...args) => {
  return cy.get(`[data-testid="${testId}"]`, ...args);
});

Cypress.Commands.add('findByTestId', { prevSubject: 'element' }, (subject, testId, ...args) => {
  return subject.find(`[data-testid="${testId}"]`, ...args);
});
