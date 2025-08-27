# Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Build source
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || echo "No build step defined"
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Fix permission
RUN chmod +x /app/entrypoint.sh && \
    chown -R expressjs:nodejs /app

USER expressjs
EXPOSE 3001
ENV PORT=3001

ENTRYPOINT ["/app/entrypoint.sh"]
