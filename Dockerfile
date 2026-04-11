# Multi-stage build for Vite React frontend
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests first for cache efficiency
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build-time env (Vite bakes VITE_* into the bundle at build)
ARG VITE_COLOR_PALETTE_API_BASE_URL
ARG VITE_COLOR_PALETTE_API_DEV_KEY
ARG VITE_USE_MSW=false
ENV VITE_COLOR_PALETTE_API_BASE_URL=${VITE_COLOR_PALETTE_API_BASE_URL}
ENV VITE_COLOR_PALETTE_API_DEV_KEY=${VITE_COLOR_PALETTE_API_DEV_KEY}
ENV VITE_USE_MSW=${VITE_USE_MSW}

RUN npm run build

# Stage 2: static serve
# Use the `serve` npm package as a tiny static file server with SPA fallback
FROM node:20-alpine AS runtime
WORKDIR /app

# Install only `serve` (no dev deps, no source code)
RUN npm install -g serve@14.2.4

COPY --from=builder /app/dist ./dist

# Railway injects PORT env var; default to 3000 for local docker run
ENV PORT=3000
EXPOSE 3000

# `-s` enables SPA fallback (all routes → index.html)
# `-l` listen address; Railway sets PORT
CMD sh -c "serve -s dist -l tcp://0.0.0.0:${PORT}"
