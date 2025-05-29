/// <reference types="cypress" />

import { TEST_USERS } from '../utils/auth';

describe('Authentication E2E', () => {
  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Start from the home page
    cy.visit('/');
  });

  it('should allow user to log in with valid credentials', () => {
    // Intercept the login API call
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    
    // Navigate to login page
    cy.visit('/login');
    
    // Fill in login form
    cy.get('input[name="email"]').type(TEST_USERS.user.email);
    cy.get('input[name="password"]').type(TEST_USERS.user.password);
    cy.get('button[type="submit"]').click();
    
    // Wait for login request to complete
    cy.wait('@loginRequest').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('token');
    });
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user menu shows logged in state
    cy.get('[data-testid="user-menu"]').should('contain', TEST_USERS.user.username);
  });

  it('should show error with invalid credentials', () => {
    // Intercept the login API call
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');
    
    // Navigate to login page
    cy.visit('/login');
    
    // Fill in login form with invalid credentials
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Verify error message is shown
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });

  it('should redirect authenticated users away from auth pages', () => {
    // Login first
    cy.login(TEST_USERS.user.email, TEST_USERS.user.password);
    
    // Try to visit login page again
    cy.visit('/login');
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should allow user to log out', () => {
    // Login first
    cy.login(TEST_USERS.user.email, TEST_USERS.user.password);
    
    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    
    // Verify redirected to login page
    cy.url().should('include', '/login');
    
    // Verify protected route redirects to login
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
