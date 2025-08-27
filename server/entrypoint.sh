#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run seed || echo "No seed script defined"

echo "Starting application..."
exec node dist/src/index.js
