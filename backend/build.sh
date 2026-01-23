#!/usr/bin/env bash
# Build script for Render deployment
# This script runs migrations automatically before starting the server

set -o errexit  # Exit on error

echo "Starting build process..."

# Run database migrations with retry logic
echo "Running database migrations..."
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if python manage.py migrate --noinput; then
        echo "Migrations completed successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Migration failed, retrying in 5 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        else
            echo "Migration failed after $MAX_RETRIES attempts. Continuing anyway..."
            # Don't fail the build if migrations fail - they can be run manually
            break
        fi
    fi
done

echo "Build completed!"
