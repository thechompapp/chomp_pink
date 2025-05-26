#!/bin/bash

# Script to consolidate test directories in the Chomp application
# This script moves tests from src/__tests__ to the consolidated tests directory

# Create consolidated test directories if they don't exist
mkdir -p /Users/naf/Downloads/doof/tests/consolidated/{e2e,integration,unit,setup}

# Copy e2e tests from src/__tests__/e2e to tests/consolidated/e2e
echo "Copying e2e tests from src/__tests__/e2e to tests/consolidated/e2e..."
cp -r /Users/naf/Downloads/doof/src/__tests__/e2e/* /Users/naf/Downloads/doof/tests/consolidated/e2e/ 2>/dev/null || echo "No e2e tests found in src/__tests__/e2e"

# Copy integration tests from src/__tests__/integration to tests/consolidated/integration
echo "Copying integration tests from src/__tests__/integration to tests/consolidated/integration..."
cp -r /Users/naf/Downloads/doof/src/__tests__/integration/* /Users/naf/Downloads/doof/tests/consolidated/integration/ 2>/dev/null || echo "No integration tests found in src/__tests__/integration"

# Copy unit tests from src/__tests__/unit to tests/consolidated/unit
echo "Copying unit tests from src/__tests__/unit to tests/consolidated/unit..."
cp -r /Users/naf/Downloads/doof/src/__tests__/unit/* /Users/naf/Downloads/doof/tests/consolidated/unit/ 2>/dev/null || echo "No unit tests found in src/__tests__/unit"

# Copy setup files from src/__tests__/setup to tests/consolidated/setup
echo "Copying setup files from src/__tests__/setup to tests/consolidated/setup..."
cp -r /Users/naf/Downloads/doof/src/__tests__/setup/* /Users/naf/Downloads/doof/tests/consolidated/setup/ 2>/dev/null || echo "No setup files found in src/__tests__/setup"

# Copy e2e tests from e2e directory to tests/consolidated/e2e
echo "Copying e2e tests from e2e directory to tests/consolidated/e2e..."
cp -r /Users/naf/Downloads/doof/e2e/*.js /Users/naf/Downloads/doof/tests/consolidated/e2e/ 2>/dev/null || echo "No e2e tests found in e2e directory"
cp -r /Users/naf/Downloads/doof/e2e/features/* /Users/naf/Downloads/doof/tests/consolidated/e2e/ 2>/dev/null || echo "No feature tests found in e2e directory"

echo "Test consolidation complete!"
