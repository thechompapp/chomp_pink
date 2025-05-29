describe('Admin Workflow E2E', () => {
  beforeEach(() => {
    // Login as admin user
    cy.loginAsAdmin()
    
    // Clear test data and seed admin data
    cy.clearTestData()
    cy.seedTestData()
    
    // Setup admin API mocks
    cy.intercept('GET', '**/api/admin/users**', { fixture: 'admin/users-list.json' }).as('getUsers')
    cy.intercept('GET', '**/api/admin/restaurants**', { fixture: 'admin/restaurants-admin.json' }).as('getAdminRestaurants')
    cy.intercept('GET', '**/api/admin/analytics**', { fixture: 'admin/analytics-data.json' }).as('getAnalytics')
    cy.intercept('POST', '**/api/admin/users/*/ban', { success: true }).as('banUser')
    cy.intercept('POST', '**/api/admin/restaurants/*/approve', { success: true }).as('approveRestaurant')
    
    // Navigate to admin dashboard
    cy.navigateTo('admin')
    cy.url().should('include', '/admin')
  })

  describe('Admin Dashboard Overview', () => {
    it('should display comprehensive admin dashboard', () => {
      cy.log('Testing admin dashboard overview')
      
      // Verify admin dashboard loads
      cy.get('[data-testid="admin-dashboard"]').should('be.visible')
      cy.get('[data-testid="admin-header"]').should('contain', 'Admin Dashboard')
      
      // Check quick stats cards
      cy.get('[data-testid="stats-grid"]').should('be.visible')
      cy.get('[data-testid="total-users-stat"]').should('be.visible')
      cy.get('[data-testid="total-restaurants-stat"]').should('be.visible')
      cy.get('[data-testid="pending-approvals-stat"]').should('be.visible')
      cy.get('[data-testid="active-sessions-stat"]').should('be.visible')
      
      // Verify navigation menu
      cy.get('[data-testid="admin-nav"]').should('be.visible')
      cy.get('[data-testid="nav-users"]').should('be.visible')
      cy.get('[data-testid="nav-restaurants"]').should('be.visible')
      cy.get('[data-testid="nav-analytics"]').should('be.visible')
      cy.get('[data-testid="nav-system"]').should('be.visible')
      
      // Check recent activity feed
      cy.get('[data-testid="recent-activity"]').should('be.visible')
      cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1)
      
      // Verify alerts and notifications
      cy.get('[data-testid="admin-alerts"]').should('be.visible')
      cy.get('[data-testid="alert-item"]').each($alert => {
        cy.wrap($alert).should('have.attr', 'data-severity')
      })
    })

    it('should display real-time analytics charts', () => {
      cy.log('Testing analytics dashboard')
      
      cy.waitForApiCall('getAnalytics')
      
      // Check analytics widgets
      cy.get('[data-testid="user-growth-chart"]').should('be.visible')
      cy.get('[data-testid="restaurant-additions-chart"]').should('be.visible')
      cy.get('[data-testid="search-activity-chart"]').should('be.visible')
      cy.get('[data-testid="popular-cuisines-chart"]').should('be.visible')
      
      // Test date range selector
      cy.get('[data-testid="date-range-selector"]').select('last-30-days')
      cy.waitForApiCall('getAnalytics')
      
      // Verify charts update
      cy.get('[data-testid="chart-loading"]').should('not.exist')
      cy.get('[data-testid="chart-data-points"]').should('be.visible')
      
      // Test export functionality
      cy.get('[data-testid="export-analytics"]').click()
      cy.get('[data-testid="export-options"]').should('be.visible')
      cy.get('[data-testid="export-csv"]').click()
      cy.get('[data-testid="download-success"]').should('be.visible')
    })
  })

  describe('User Management', () => {
    it('should manage user accounts comprehensively', () => {
      cy.log('Testing user management functionality')
      
      // Navigate to users section
      cy.get('[data-testid="nav-users"]').click()
      cy.waitForApiCall('getUsers')
      
      // Verify users list
      cy.get('[data-testid="users-table"]').should('be.visible')
      cy.get('[data-testid="user-row"]').should('have.length.at.least', 1)
      
      // Test user search
      cy.get('[data-testid="user-search"]').type('john@example.com')
      cy.get('[data-testid="user-row"]').should('have.length', 1)
      cy.get('[data-testid="user-email"]').should('contain', 'john@example.com')
      
      // Clear search
      cy.get('[data-testid="clear-user-search"]').click()
      cy.get('[data-testid="user-row"]').should('have.length.at.least', 5)
      
      // Test user filtering
      cy.get('[data-testid="user-status-filter"]').select('active')
      cy.get('[data-testid="user-row"]').each($row => {
        cy.wrap($row).within(() => {
          cy.get('[data-testid="user-status"]').should('contain', 'Active')
        })
      })
      
      // Test user role filter
      cy.get('[data-testid="user-role-filter"]').select('premium')
      cy.get('[data-testid="filtered-results"]').should('be.visible')
    })

    it('should handle user moderation actions', () => {
      cy.log('Testing user moderation')
      
      cy.get('[data-testid="nav-users"]').click()
      cy.waitForApiCall('getUsers')
      
      // Select a user for moderation
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-actions"]').click()
        cy.get('[data-testid="view-user-details"]').click()
      })
      
      // Verify user details modal
      cy.get('[data-testid="user-details-modal"]').should('be.visible')
      cy.get('[data-testid="user-profile"]').should('be.visible')
      cy.get('[data-testid="user-activity-log"]').should('be.visible')
      cy.get('[data-testid="user-lists"]').should('be.visible')
      
      // Test user suspension
      cy.get('[data-testid="suspend-user"]').click()
      cy.get('[data-testid="suspension-form"]').should('be.visible')
      cy.get('[data-testid="suspension-reason"]').select('spam')
      cy.get('[data-testid="suspension-duration"]').select('7-days')
      cy.get('[data-testid="suspension-notes"]').type('Reported for spam activity')
      cy.get('[data-testid="confirm-suspension"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'User suspended')
      cy.closeModal()
      
      // Verify status change in table
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-status"]').should('contain', 'Suspended')
      })
    })

    it('should manage user permissions and roles', () => {
      cy.log('Testing user role management')
      
      cy.get('[data-testid="nav-users"]').click()
      cy.waitForApiCall('getUsers')
      
      // Select user for role change
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-role-select"]').select('moderator')
      })
      
      // Confirm role change
      cy.get('[data-testid="role-change-modal"]').should('be.visible')
      cy.get('[data-testid="role-permissions-preview"]').should('be.visible')
      cy.get('[data-testid="confirm-role-change"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Role updated')
      
      // Verify permissions update
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="user-role"]').should('contain', 'Moderator')
        cy.get('[data-testid="user-permissions"]').should('contain', 'Can moderate content')
      })
    })
  })

  describe('Restaurant Management and Approval', () => {
    it('should manage restaurant approval workflow', () => {
      cy.log('Testing restaurant approval system')
      
      // Navigate to restaurants admin section
      cy.get('[data-testid="nav-restaurants"]').click()
      cy.waitForApiCall('getAdminRestaurants')
      
      // Check pending approvals
      cy.get('[data-testid="pending-approvals-tab"]').click()
      cy.get('[data-testid="pending-restaurant"]').should('have.length.at.least', 1)
      
      // Review first pending restaurant
      cy.get('[data-testid="pending-restaurant"]').first().within(() => {
        cy.get('[data-testid="review-restaurant"]').click()
      })
      
      // Verify restaurant review modal
      cy.get('[data-testid="restaurant-review-modal"]').should('be.visible')
      cy.get('[data-testid="restaurant-details"]').should('be.visible')
      cy.get('[data-testid="google-places-info"]').should('be.visible')
      cy.get('[data-testid="submitted-by"]').should('be.visible')
      cy.get('[data-testid="submission-notes"]').should('be.visible')
      
      // Check for data quality issues
      cy.get('[data-testid="data-quality-checks"]').should('be.visible')
      cy.get('[data-testid="address-verification"]').should('contain', 'Verified')
      cy.get('[data-testid="duplicate-check"]').should('contain', 'No duplicates found')
      
      // Approve restaurant
      cy.get('[data-testid="approve-restaurant"]').click()
      cy.get('[data-testid="approval-notes"]').type('Restaurant looks good, approved for listing')
      cy.get('[data-testid="confirm-approval"]').click()
      
      cy.waitForApiCall('approveRestaurant')
      cy.get('[data-testid="success-message"]').should('contain', 'Restaurant approved')
      cy.closeModal()
    })

    it('should handle restaurant data quality issues', () => {
      cy.log('Testing data quality management')
      
      cy.get('[data-testid="nav-restaurants"]').click()
      cy.get('[data-testid="data-quality-tab"]').click()
      
      // Check quality issues dashboard
      cy.get('[data-testid="quality-issues"]').should('be.visible')
      cy.get('[data-testid="missing-photos"]').should('be.visible')
      cy.get('[data-testid="incomplete-addresses"]').should('be.visible')
      cy.get('[data-testid="duplicate-candidates"]').should('be.visible')
      
      // Handle duplicate detection
      cy.get('[data-testid="duplicate-candidates"]').click()
      cy.get('[data-testid="duplicate-pairs"]').should('be.visible')
      
      cy.get('[data-testid="duplicate-pair"]').first().within(() => {
        cy.get('[data-testid="restaurant-a"]').should('be.visible')
        cy.get('[data-testid="restaurant-b"]').should('be.visible')
        cy.get('[data-testid="similarity-score"]').should('be.visible')
        
        // Merge duplicates
        cy.get('[data-testid="merge-restaurants"]').click()
      })
      
      cy.get('[data-testid="merge-modal"]').should('be.visible')
      cy.get('[data-testid="merge-preview"]').should('be.visible')
      cy.get('[data-testid="confirm-merge"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Restaurants merged')
    })

    it('should moderate restaurant reviews and content', () => {
      cy.log('Testing content moderation')
      
      cy.get('[data-testid="nav-restaurants"]').click()
      cy.get('[data-testid="content-moderation-tab"]').click()
      
      // Review flagged content
      cy.get('[data-testid="flagged-reviews"]').should('be.visible')
      cy.get('[data-testid="flagged-review"]').first().within(() => {
        cy.get('[data-testid="review-content"]').should('be.visible')
        cy.get('[data-testid="flag-reason"]').should('be.visible')
        cy.get('[data-testid="reporter-info"]').should('be.visible')
        
        cy.get('[data-testid="moderate-review"]').click()
      })
      
      // Moderation decision
      cy.get('[data-testid="moderation-modal"]').should('be.visible')
      cy.get('[data-testid="review-text"]').should('be.visible')
      cy.get('[data-testid="moderation-action"]').select('remove')
      cy.get('[data-testid="moderation-reason"]').type('Inappropriate language')
      cy.get('[data-testid="confirm-moderation"]').click()
      
      cy.get('[data-testid="success-message"]').should('contain', 'Review removed')
    })
  })

  describe('System Analytics and Monitoring', () => {
    it('should display comprehensive system analytics', () => {
      cy.log('Testing system analytics')
      
      // Navigate to analytics
      cy.get('[data-testid="nav-analytics"]').click()
      cy.waitForApiCall('getAnalytics')
      
      // User analytics
      cy.get('[data-testid="user-analytics"]').should('be.visible')
      cy.get('[data-testid="user-registration-chart"]').should('be.visible')
      cy.get('[data-testid="user-engagement-metrics"]').should('be.visible')
      cy.get('[data-testid="user-retention-chart"]').should('be.visible')
      
      // Restaurant analytics
      cy.get('[data-testid="restaurant-analytics"]').should('be.visible')
      cy.get('[data-testid="restaurant-growth-chart"]').should('be.visible')
      cy.get('[data-testid="cuisine-distribution"]').should('be.visible')
      cy.get('[data-testid="neighborhood-coverage"]').should('be.visible')
      
      // Search analytics
      cy.get('[data-testid="search-analytics"]').should('be.visible')
      cy.get('[data-testid="popular-searches"]').should('be.visible')
      cy.get('[data-testid="search-trends"]').should('be.visible')
      cy.get('[data-testid="no-results-queries"]').should('be.visible')
      
      // Performance metrics
      cy.get('[data-testid="performance-metrics"]').should('be.visible')
      cy.get('[data-testid="api-response-times"]').should('be.visible')
      cy.get('[data-testid="error-rates"]').should('be.visible')
      cy.get('[data-testid="uptime-status"]').should('be.visible')
    })

    it('should generate and export reports', () => {
      cy.log('Testing report generation')
      
      cy.get('[data-testid="nav-analytics"]').click()
      cy.get('[data-testid="reports-section"]').click()
      
      // Generate user activity report
      cy.get('[data-testid="generate-report"]').click()
      cy.get('[data-testid="report-type"]').select('user-activity')
      cy.get('[data-testid="date-range"]').select('last-month')
      cy.get('[data-testid="report-format"]').select('pdf')
      cy.get('[data-testid="create-report"]').click()
      
      // Wait for report generation
      cy.get('[data-testid="report-generating"]').should('be.visible')
      cy.get('[data-testid="report-ready"]').should('be.visible', { timeout: 30000 })
      
      // Download report
      cy.get('[data-testid="download-report"]').click()
      cy.get('[data-testid="download-success"]').should('be.visible')
      
      // Verify report appears in history
      cy.get('[data-testid="report-history"]').should('be.visible')
      cy.get('[data-testid="report-item"]').first().should('contain', 'user-activity')
    })
  })

  describe('System Configuration and Maintenance', () => {
    it('should manage system configuration', () => {
      cy.log('Testing system configuration')
      
      // Navigate to system settings
      cy.get('[data-testid="nav-system"]').click()
      cy.get('[data-testid="configuration-tab"]').click()
      
      // API settings
      cy.get('[data-testid="api-settings"]').should('be.visible')
      cy.get('[data-testid="google-places-config"]').should('be.visible')
      cy.get('[data-testid="rate-limiting-config"]').should('be.visible')
      
      // Update rate limiting
      cy.get('[data-testid="api-rate-limit"]').clear().type('1000')
      cy.get('[data-testid="save-api-settings"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'API settings updated')
      
      // Feature flags
      cy.get('[data-testid="feature-flags"]').should('be.visible')
      cy.get('[data-testid="bulk-add-enabled"]').should('be.checked')
      cy.get('[data-testid="social-features-enabled"]').click()
      cy.get('[data-testid="save-feature-flags"]').click()
      
      // Email templates
      cy.get('[data-testid="email-templates"]').should('be.visible')
      cy.get('[data-testid="welcome-email-template"]').click()
      cy.get('[data-testid="template-editor"]').should('be.visible')
    })

    it('should handle system maintenance tasks', () => {
      cy.log('Testing system maintenance')
      
      cy.get('[data-testid="nav-system"]').click()
      cy.get('[data-testid="maintenance-tab"]').click()
      
      // Database maintenance
      cy.get('[data-testid="database-maintenance"]').should('be.visible')
      cy.get('[data-testid="run-cleanup"]').click()
      cy.get('[data-testid="cleanup-options"]').should('be.visible')
      cy.get('[data-testid="cleanup-old-sessions"]').check()
      cy.get('[data-testid="cleanup-expired-tokens"]').check()
      cy.get('[data-testid="start-cleanup"]').click()
      
      cy.get('[data-testid="cleanup-progress"]').should('be.visible')
      cy.get('[data-testid="cleanup-complete"]').should('be.visible', { timeout: 60000 })
      
      // Cache management
      cy.get('[data-testid="cache-management"]').should('be.visible')
      cy.get('[data-testid="clear-search-cache"]').click()
      cy.get('[data-testid="confirm-cache-clear"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'Cache cleared')
      
      // System health check
      cy.get('[data-testid="health-check"]').click()
      cy.get('[data-testid="health-results"]').should('be.visible')
      cy.get('[data-testid="database-status"]').should('contain', 'Healthy')
      cy.get('[data-testid="api-status"]').should('contain', 'Healthy')
      cy.get('[data-testid="storage-status"]').should('contain', 'Healthy')
    })
  })

  describe('Security and Audit', () => {
    it('should display security monitoring dashboard', () => {
      cy.log('Testing security monitoring')
      
      cy.get('[data-testid="nav-system"]').click()
      cy.get('[data-testid="security-tab"]').click()
      
      // Security alerts
      cy.get('[data-testid="security-alerts"]').should('be.visible')
      cy.get('[data-testid="failed-login-attempts"]').should('be.visible')
      cy.get('[data-testid="suspicious-activity"]').should('be.visible')
      
      // Audit log
      cy.get('[data-testid="audit-log"]').should('be.visible')
      cy.get('[data-testid="audit-entry"]').should('have.length.at.least', 1)
      
      // Filter audit log
      cy.get('[data-testid="audit-filter-user"]').type('admin@doof.app')
      cy.get('[data-testid="audit-filter-action"]').select('user-login')
      cy.get('[data-testid="apply-audit-filter"]').click()
      
      cy.get('[data-testid="filtered-audit-entries"]').should('be.visible')
      
      // Export audit log
      cy.get('[data-testid="export-audit-log"]').click()
      cy.get('[data-testid="audit-export-format"]').select('csv')
      cy.get('[data-testid="confirm-audit-export"]').click()
      cy.get('[data-testid="download-success"]').should('be.visible')
    })

    it('should manage user sessions and security', () => {
      cy.log('Testing session management')
      
      cy.get('[data-testid="nav-system"]').click()
      cy.get('[data-testid="security-tab"]').click()
      cy.get('[data-testid="active-sessions"]').click()
      
      // View active sessions
      cy.get('[data-testid="sessions-table"]').should('be.visible')
      cy.get('[data-testid="session-row"]').should('have.length.at.least', 1)
      
      // Terminate suspicious session
      cy.get('[data-testid="session-row"]').first().within(() => {
        cy.get('[data-testid="session-location"]').should('be.visible')
        cy.get('[data-testid="session-device"]').should('be.visible')
        cy.get('[data-testid="terminate-session"]').click()
      })
      
      cy.get('[data-testid="confirm-terminate"]').click()
      cy.get('[data-testid="success-message"]').should('contain', 'Session terminated')
      
      // Security policy updates
      cy.get('[data-testid="security-policies"]').click()
      cy.get('[data-testid="password-policy"]').should('be.visible')
      cy.get('[data-testid="session-timeout"]').clear().type('3600')
      cy.get('[data-testid="save-security-policies"]').click()
    })
  })

  describe('Admin Error Handling and Edge Cases', () => {
    it('should handle admin API failures gracefully', () => {
      cy.log('Testing admin error handling')
      
      // Setup API failure
      cy.intercept('GET', '**/api/admin/users**', { statusCode: 500 }).as('usersError')
      
      cy.get('[data-testid="nav-users"]').click()
      cy.wait('@usersError')
      
      // Verify error handling
      cy.get('[data-testid="admin-error"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load users')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Test retry
      cy.intercept('GET', '**/api/admin/users**', { fixture: 'admin/users-list.json' }).as('usersRetry')
      cy.get('[data-testid="retry-button"]').click()
      cy.waitForApiCall('usersRetry')
      
      cy.get('[data-testid="users-table"]').should('be.visible')
    })

    it('should maintain admin permissions throughout workflow', () => {
      cy.log('Testing admin permission verification')
      
      // Verify admin-only elements are visible
      cy.get('[data-testid="admin-dashboard"]').should('be.visible')
      cy.get('[data-testid="danger-zone"]').should('be.visible')
      cy.get('[data-testid="system-settings"]').should('be.visible')
      
      // Test permission-gated actions
      cy.get('[data-testid="nav-users"]').click()
      cy.get('[data-testid="user-row"]').first().within(() => {
        cy.get('[data-testid="admin-actions"]').should('be.visible')
        cy.get('[data-testid="suspend-user"]').should('be.enabled')
        cy.get('[data-testid="delete-user"]').should('be.enabled')
      })
    })
  })
}) 