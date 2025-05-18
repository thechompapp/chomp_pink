#!/bin/bash

# Create or update the .env file with all required variables
cat > .env << EOL
NODE_ENV=development
PORT=5001
JWT_SECRET=your-secret-key-here-please-change-in-production
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION_DAYS=7
DB_CONNECTION_LIMIT=10
ADMIN_API_KEY=doof-admin-secret-key-dev
EOL

echo "✅ Created .env file with all required variables"
echo "🔑 ADMIN_API_KEY set to: doof-admin-secret-key-dev"

# Kill any existing node processes running on port 5001
echo "🔄 Stopping any existing server processes on port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start the server
echo "🚀 Starting server with admin access enabled..."
node server.js 