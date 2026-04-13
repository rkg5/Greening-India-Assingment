#!/bin/bash
set -e

echo "Waiting for database..."
while ! (echo > /dev/tcp/db/5432) 2>/dev/null; do
    sleep 1
done
echo "Database ready."

echo "Starting TaskFlow server..."
exec java -jar app.jar
