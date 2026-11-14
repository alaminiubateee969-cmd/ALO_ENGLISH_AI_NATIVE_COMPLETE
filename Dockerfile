FROM node:22-slim AS base

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy lockfiles
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN bun install --frozen-lockfile || npm ci --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate || npx prisma generate

# Build
ENV DATABASE_URL="file::memory:?cache=shared"
ENV AUTH_SECRET="docker-build-secret-not-for-production-32chars"
RUN bun run build

# Production image
FROM node:22-slim AS production

WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy standalone build
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lock ./

# Create directories
RUN mkdir -p /app/db /app/upload /app/storage /app/logs

# Expose port
EXPOSE 3060

# Environment
ENV NODE_ENV=production
ENV PORT=3060
ENV HOSTNAME=0.0.0.0
ENV APP_URL=https://english.alolabs.net

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3060/api/health || exit 1

# Start
CMD ["bun", "run", "start"]
