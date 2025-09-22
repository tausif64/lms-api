#!/bin/sh

# This script is the container's entrypoint.
# It waits for the database to be ready, then runs migrations,
# and finally starts the main application.

echo "Running Prisma migrations..."
# Run the command to sync the schema with the database
npx prisma db push

echo "Migrations complete. Starting the application..."
# Execute the command passed to this script (the Dockerfile's CMD)
exec "$@"