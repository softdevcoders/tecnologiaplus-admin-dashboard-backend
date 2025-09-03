###################################################################################
#                                                                                 #
#    🐳 DOCKERFILE - TECNOLOGIA PLUS BACKEND                                     #
#    Multi-stage Docker build for NestJS application                             #
#                                                                                 #
###################################################################################

#==================================================================================
#  STAGE 1: BASE - Common dependencies and setup
#==================================================================================
FROM node:20-alpine AS base

# 📝 Metadata
LABEL maintainer="TecnologiaPlus Team"
LABEL description="Backend API for TecnologiaPlus Dashboard"
LABEL version="1.0"

# 🏷️ Environment variables
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 🔧 Install system dependencies required for native modules
RUN apk add --no-cache \
    # Build dependencies
    python3 \
    make \
    g++ \
    # Runtime dependencies
    libc6-compat \
    # Utilities
    curl \
    && rm -rf /var/cache/apk/*

# 📦 Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# 📁 Set working directory
WORKDIR /app

# 📋 Copy dependency files
COPY package*.json pnpm-lock.yaml ./

# 🚀 Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

#==================================================================================
#  STAGE 2: DEVELOPMENT - Hot reload development environment
#==================================================================================
FROM base AS development

# 🏷️ Override environment for development
ENV NODE_ENV=development

# 📂 Copy source code (volumes will override this in docker-compose)
COPY . .

# 🌡️ Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 🚪 Expose development port
EXPOSE 3001

# 🎯 Development command with hot reload
CMD ["pnpm", "run", "start:dev"]

#==================================================================================
#  STAGE 3: BUILD - Production build stage
#==================================================================================
FROM base AS build

# 🏷️ Build environment
ENV NODE_ENV=production

# 📂 Copy source code
COPY . .

# 🔨 Build the application
RUN pnpm run build && \
    # Create dist/core directory if it doesn't exist
    mkdir -p dist/core && \
    # Copy i18n files to dist for production
    if [ -d "src/core/i18n" ]; then \
        cp -r src/core/i18n dist/core/; \
        echo "i18n files copied to dist/core/"; \
    else \
        echo "i18n directory not found, creating empty directory..."; \
        mkdir -p dist/core/i18n; \
    fi && \
    # Copy seeds data files to dist for production
    if [ -d "src/core/database/seeds/data" ]; then \
        mkdir -p dist/core/database/seeds; \
        cp -r src/core/database/seeds/data dist/core/database/seeds/; \
        echo "Seeds data files copied to dist/core/database/seeds/"; \
    else \
        echo "Seeds data directory not found, skipping..."; \
    fi && \
    # Clean up source files after build
    rm -rf src test && \
    # Keep only necessary files
    ls -la dist/

# 🧹 Cleanup dev dependencies
RUN pnpm prune --prod

#==================================================================================
#  STAGE 4: PRODUCTION - Optimized production image
#==================================================================================
FROM node:20-alpine AS production

# 📝 Metadata for production
LABEL stage="production"
LABEL environment="production"

# 🏷️ Production environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 🔧 Install only essential production dependencies
RUN apk add --no-cache \
    # Essential runtime dependencies
    libc6-compat \
    curl \
    # Process management
    dumb-init \
    && rm -rf /var/cache/apk/*

# 👥 Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs --ingroup nodejs

# 📦 Install pnpm in production stage
RUN corepack enable && corepack prepare pnpm@latest --activate

# 📁 Set working directory
WORKDIR /app

# 🔐 Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# 👤 Switch to non-root user for remaining operations
USER nestjs

# 📋 Copy package files with correct ownership
COPY --chown=nestjs:nodejs package*.json pnpm-lock.yaml ./

# 🚀 Install only production dependencies
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune && \
    rm -rf ~/.pnpm-store

# 📦 Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# 🌡️ Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 🚪 Expose production port
EXPOSE 3001

# 🎯 Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# 🏃 Production startup command
CMD ["node", "dist/main.js"]

#==================================================================================
#  STAGE 5: TESTING - Optional testing stage
#==================================================================================
FROM base AS testing

# 🏷️ Testing environment
ENV NODE_ENV=test

# 📂 Copy source code
COPY . .

# 🧪 Run tests (can be used in CI/CD)
RUN pnpm run test && \
    pnpm run test:e2e

# 📊 Generate test coverage
RUN pnpm run test:cov

#==================================================================================
#  BUILD SUMMARY:
#  
#  📋 Stages Available:
#    • base        - Common dependencies and setup
#    • development - Hot reload development (default for docker-compose)
#    • build       - Production build stage
#    • production  - Optimized production image (default)
#    • testing     - Testing stage for CI/CD
#  
#  🚀 Usage Examples:
#    docker build --target development -t myapp:dev .
#    docker build --target production -t myapp:prod .
#    docker build --target testing -t myapp:test .
#  
#  🎯 Optimizations:
#    ✅ Multi-stage build for smaller production images
#    ✅ Non-root user for security
#    ✅ Proper signal handling with dumb-init
#    ✅ Health checks for container orchestration
#    ✅ Efficient layer caching
#    ✅ Production dependencies only in final stage
#  
#==================================================================================
