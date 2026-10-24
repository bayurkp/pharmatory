# ----------------------------------------------------
# Stage 1: Build stage (compile TypeScript & Tailwind CSS)
# ----------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools for compiling better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

# Build minified Tailwind CSS and compile TypeScript
RUN npm run build

# ----------------------------------------------------
# Stage 2: Production runtime stage
# ----------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install build tools temporarily to compile better-sqlite3 production native addon
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Remove compilation tools to minimize attack surface and reduce image size
RUN apk del python3 make g++

# Copy compiled backend dist and public static presentation assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Prepare data directory and set non-root ownership
RUN mkdir -p /app/data && chown -R node:node /app

# Enforce least-privilege security by running as non-root user
USER node

EXPOSE 3000

# Start production server
CMD ["node", "dist/server.js"]

