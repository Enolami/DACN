#!/usr/bin/env bash
# Build script for Render deployment
# This script runs migrations automatically before starting the server

set -o errexit  # Exit on error

echo "Starting build process..."

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

echo "Build completed successfully!"
