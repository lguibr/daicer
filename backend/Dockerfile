# Multi-stage build for production
# Note: Build from repo root with: docker build -f backend/Dockerfile .

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /build

# Copy backend directory
COPY backend/ ./

# Copy root yarn.lock
COPY yarn.lock ./

# Install ALL dependencies (including devDependencies)
RUN yarn install --frozen-lockfile

# Build TypeScript (use production tsconfig with looser checks)
RUN ./node_modules/.bin/tsc --project tsconfig.build.json

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json ./
COPY yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /build/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "dist/server.js"]
