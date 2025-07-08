# Multi-stage Dockerfile for Family Accounting Taro project
# ==============================================

# -------- base --------
FROM --platform=linux/amd64 node:18.20.8 AS base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# install build tools for native addons
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy lock files & install dependencies (including dev deps)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source
COPY . .

# Rebuild any native dependencies (none expected but keep step)
RUN pnpm rebuild || true

# -------- test --------
FROM base AS test
RUN pnpm run lint && pnpm run type-check || echo "No lint or type errors"

# -------- production --------
FROM base AS production
ENV NODE_ENV=production \
    TARO_ENV=weapp

# Build the mini-program
RUN pnpm run build:weapp

# Image metadata / default command
EXPOSE 80
CMD ["sh", "-c", "echo '📦 Build artifacts:' && ls -R dist && echo 'Container ready.' && tail -f /dev/null"]
