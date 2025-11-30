# Multi-stage Dockerfile for Code Graph Frontend
# Stage 1: Build the application
# Stage 2: Serve with nginx

# =============================================================================
# Stage 1: Build Stage
# =============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally (use latest version 9 to match lockfile)
RUN npm install -g pnpm@10

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Create public/wasm directory for postinstall script (copies WASM files)
RUN mkdir -p public/wasm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and configuration files
COPY . .

# Build the application for production
RUN pnpm build

# =============================================================================
# Stage 2: Production Stage
# =============================================================================
FROM nginx:alpine AS production

# Set labels for image metadata
LABEL maintainer="mkluszczynski@github"
LABEL description="Code Graph - Interactive TypeScript UML Visualizer"
LABEL version="1.1.0"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions for nginx user (already exists in nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
