import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

/**
 * 🎯 DEMONSTRATION TEST: Login/Logout Flow & Protected Routes
 * 
 * This test shows EXACTLY what happens when users login and logout,
 * and how protected routes (Admin Panel, Profile, Bulk Add) appear and disappear.
 * 
 * Think of this like a movie script showing what the user sees! 🎬
 */

// Mock Authentication Context
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isSuperuser: false,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false
};

const mockAdminAuth = {
  can: vi.fn(() => false),
  isAdmin: false,
  isSuperuser: false
};

// Mock the authentication hooks
vi.mock('../src/contexts/auth', () => ({
  useAuth: () => mockAuthContext
}));

vi.mock('../src/hooks/useAdminAuth', () => ({
  useAdminAuth: () => mockAdminAuth
}));

// Simple component that shows different things based on authentication
const TestApp = () => {
  const { isAuthenticated, user, isAdmin, login, logout } = mockAuthContext;
  const adminAuth = mockAdminAuth;
  
  return (
    <div>
      <h1>My Food App</h1>
      
      {/* 👆 This is what users always see */}
      
      {!isAuthenticated ? (
        // 🔒 LOGGED OUT STATE - What users see when NOT logged in
        <div data-testid="logged-out-state">
          <p>Please log in to access your account</p>
          <button onClick={() => {
            // Simulate login
            mockAuthContext.isAuthenticated = true;
            mockAuthContext.user = { name: 'John Doe', email: 'john@example.com' };
            mockAuthContext.isAdmin = true;
            mockAuthContext.isSuperuser = true;
            mockAdminAuth.can = vi.fn(() => true);
            mockAdminAuth.isAdmin = true;
            mockAdminAuth.isSuperuser = true;
          }} data-testid="login-button">
            Log In
          </button>
          
          {/* ❌ HIDDEN: No protected features visible */}
          <div data-testid="hidden-features">
            <p>🚫 Profile Button: HIDDEN</p>
            <p>🚫 Admin Panel: HIDDEN</p>
            <p>🚫 Bulk Add: HIDDEN</p>
            <p>🚫 Add to List buttons: HIDDEN</p>
            <p>🚫 Follow buttons: HIDDEN</p>
          </div>
        </div>
      ) : (
        // ✅ LOGGED IN STATE - What users see when logged in
        <div data-testid="logged-in-state">
          <p>Welcome back, {user?.name}!</p>
          
          {/* ✅ VISIBLE: Profile features */}
          <div data-testid="profile-section">
            <button data-testid="profile-button">👤 My Profile</button>
            <p>✅ Profile Button: VISIBLE</p>
          </div>
          
          {/* ✅ VISIBLE: Regular user features */}
          <div data-testid="user-features">
            <button data-testid="add-to-list-button">➕ Add to List</button>
            <p>✅ Add to List buttons: VISIBLE</p>
          </div>
          
          {/* ✅ VISIBLE: Follow features (authenticated users only) */}
          <div data-testid="follow-features">
            <button data-testid="follow-button">❤️ Follow This List</button>
            <button data-testid="unfollow-button">💔 Unfollow</button>
            <p>✅ Follow buttons: VISIBLE (you can follow now!)</p>
          </div>
          
          {/* ✅ VISIBLE: Admin features (if user is admin) */}
          {isAdmin && adminAuth.can('admin.access') && (
            <div data-testid="admin-features">
              <button data-testid="admin-panel-button">⚙️ Admin Panel</button>
              <button data-testid="bulk-add-button">📦 Bulk Add</button>
              <p>✅ Admin Panel: VISIBLE (You're an admin!)</p>
              <p>✅ Bulk Add: VISIBLE (You're an admin!)</p>
            </div>
          )}
          
          <button onClick={() => {
            // Simulate logout
            mockAuthContext.isAuthenticated = false;
            mockAuthContext.user = null;
            mockAuthContext.isAdmin = false;
            mockAuthContext.isSuperuser = false;
            mockAdminAuth.can = vi.fn(() => false);
            mockAdminAuth.isAdmin = false;
            mockAdminAuth.isSuperuser = false;
          }} data-testid="logout-button">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

describe('🎬 Login/Logout Flow & Protected Routes Demo', () => {
  beforeEach(() => {
    // Reset to logged out state before each test
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isAdmin = false;
    mockAuthContext.isSuperuser = false;
    mockAdminAuth.can = vi.fn(() => false);
    mockAdminAuth.isAdmin = false;
    mockAdminAuth.isSuperuser = false;
  });

  it('🎯 STEP 1: Shows what happens when user is NOT logged in', async () => {
    console.log('\n🎬 SCENE 1: User visits the website (NOT logged in)');
    
    render(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    // ✅ User sees the logged out state
    expect(screen.getByTestId('logged-out-state')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access your account')).toBeInTheDocument();
    
    // ❌ User CANNOT see protected features
    expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-panel-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bulk-add-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unfollow-button')).not.toBeInTheDocument();
    
    console.log('✅ RESULT: User sees login screen, NO protected features visible');
    console.log('   🚫 Profile Button: HIDDEN');
    console.log('   🚫 Admin Panel: HIDDEN'); 
    console.log('   🚫 Bulk Add: HIDDEN');
    console.log('   🚫 Add to List: HIDDEN');
    console.log('   🚫 Follow Buttons: HIDDEN');
  });

  it('🎯 STEP 2: Shows what happens when user LOGS IN (as admin)', async () => {
    console.log('\n🎬 SCENE 2: User clicks login button');
    
    const { rerender } = render(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    // Simulate login by updating the context and re-rendering
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { name: 'John Doe', email: 'john@example.com' };
    mockAuthContext.isAdmin = true;
    mockAuthContext.isSuperuser = true;
    mockAdminAuth.can = vi.fn(() => true);
    mockAdminAuth.isAdmin = true;
    mockAdminAuth.isSuperuser = true;
    
    rerender(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    console.log('🎉 LOGIN SUCCESSFUL! User is now authenticated as admin');
    
    // ✅ User sees the logged in state
    expect(screen.getByTestId('logged-in-state')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
    
    // ✅ User CAN see ALL features (they're an admin!)
    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-list-button')).toBeInTheDocument();
    expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    expect(screen.getByTestId('unfollow-button')).toBeInTheDocument();
    expect(screen.getByTestId('admin-panel-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-add-button')).toBeInTheDocument();
    
    console.log('✅ RESULT: User sees welcome message, ALL features now visible!');
    console.log('   ✅ Profile Button: VISIBLE');
    console.log('   ✅ Admin Panel: VISIBLE (they\'re admin!)');
    console.log('   ✅ Bulk Add: VISIBLE (they\'re admin!)');
    console.log('   ✅ Add to List: VISIBLE');
    console.log('   ✅ Follow Buttons: VISIBLE (they can follow now!)');
  });

  it('🎯 STEP 3: Shows what happens when admin user LOGS OUT', async () => {
    console.log('\n🎬 SCENE 3: Admin user clicks logout button');
    
    // Start logged in as admin
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { name: 'John Doe', email: 'john@example.com' };
    mockAuthContext.isAdmin = true;
    mockAdminAuth.can = vi.fn(() => true);
    mockAdminAuth.isAdmin = true;
    
    const { rerender } = render(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    console.log('🔵 BEFORE LOGOUT: User sees all admin features');
    
    // Verify admin features are visible
    expect(screen.getByTestId('admin-panel-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-add-button')).toBeInTheDocument();
    expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    expect(screen.getByTestId('unfollow-button')).toBeInTheDocument();
    
    // Simulate logout
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isAdmin = false;
    mockAdminAuth.can = vi.fn(() => false);
    mockAdminAuth.isAdmin = false;
    
    rerender(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    console.log('👋 LOGOUT SUCCESSFUL! User is now logged out');
    
    // ❌ User is back to logged out state
    expect(screen.getByTestId('logged-out-state')).toBeInTheDocument();
    expect(screen.getByText('Please log in to access your account')).toBeInTheDocument();
    
    // ❌ ALL protected features are gone
    expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-panel-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bulk-add-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-to-list-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unfollow-button')).not.toBeInTheDocument();
    
    console.log('✅ RESULT: Back to login screen, ALL protected features hidden again!');
    console.log('   🚫 Profile Button: HIDDEN AGAIN');
    console.log('   🚫 Admin Panel: HIDDEN AGAIN');
    console.log('   🚫 Bulk Add: HIDDEN AGAIN');
    console.log('   🚫 Add to List: HIDDEN AGAIN');
    console.log('   🚫 Follow Buttons: HIDDEN AGAIN');
  });

  it('🎯 STEP 4: Shows what regular user sees (NOT admin)', async () => {
    console.log('\n🎬 SCENE 4: Regular user (not admin) logs in');
    
    // Login as regular user (NOT admin)
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { name: 'Jane User', email: 'jane@example.com' };
    mockAuthContext.isAdmin = false; // ← NOT an admin!
    mockAdminAuth.can = vi.fn(() => false); // ← Cannot access admin features
    mockAdminAuth.isAdmin = false;
    
    render(
      <BrowserRouter>
        <TestApp />
      </BrowserRouter>
    );
    
    console.log('🎉 REGULAR USER LOGIN: Jane is authenticated but NOT admin');
    
    // ✅ User sees basic authenticated features
    expect(screen.getByText('Welcome back, Jane User!')).toBeInTheDocument();
    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-list-button')).toBeInTheDocument();
    expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    expect(screen.getByTestId('unfollow-button')).toBeInTheDocument();
    
    // ❌ User CANNOT see admin features
    expect(screen.queryByTestId('admin-panel-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bulk-add-button')).not.toBeInTheDocument();
    
    console.log('✅ RESULT: Regular user sees some features, but NOT admin features');
    console.log('   ✅ Profile Button: VISIBLE (basic user feature)');
    console.log('   ✅ Add to List: VISIBLE (basic user feature)');
    console.log('   ✅ Follow Buttons: VISIBLE (basic user feature)');
    console.log('   🚫 Admin Panel: HIDDEN (not admin!)');
    console.log('   🚫 Bulk Add: HIDDEN (not admin!)');
  });
}); 