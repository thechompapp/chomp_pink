# Admin Panel Access Fix

This document provides instructions for fixing admin panel access in the Doof application.

## Backend Setup

1. Start the backend server with the proper environment variables:

```bash
cd /Users/naf/Downloads/doof/doof-backend
./start-with-admin.sh
```

This script will:
- Create a proper `.env` file with all required variables
- Kill any existing server process on port 5001
- Start the server with admin access enabled

## Frontend Admin Access

To enable admin access in the frontend, you have two options:

### Option 1: Copy-Paste Script in Browser Console

1. Go to the admin panel page in your browser (e.g., http://localhost:5173/admin)
2. Open Developer Tools (F12 or Right-click > Inspect)
3. Select the Console tab
4. Copy and paste the entire contents of `admin-browser-fix.js` into the console
5. Press Enter to execute
6. Refresh the page

### Option 2: Use force-online-mode.js Script

1. Go to the admin panel page in your browser
2. Open Developer Tools (F12 or Right-click > Inspect)
3. Select the Console tab
4. Copy and paste the entire contents of `force-online-mode.js` into the console
5. Press Enter to execute
6. Refresh the page

## Verify Admin Access

After following the steps above:

1. You should see the admin panel with data from the backend
2. All 403 Forbidden errors should be resolved
3. You should have full access to manage submissions, restaurants, dishes, etc.

## Troubleshooting

If you still encounter authentication issues:

1. Check the browser console for any error messages
2. Verify the backend server is running
3. Make sure the admin API key matches between frontend and backend
4. Try clearing browser cache and local storage
5. Check that the backend server logs for authentication-related errors

## Technical Details

The admin authentication works by:

1. Setting the correct admin API key header (`X-Admin-API-Key`) in all admin requests
2. Adding supplementary authentication headers for admin routes
3. Forcing the application into online mode to allow real API requests
4. Clearing any stale cache data from previous sessions

All necessary authentication headers are configured by the scripts provided. 