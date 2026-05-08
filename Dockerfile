# ─── ArthSathi: On-Device Financial Advisor ───
# Multi-stage Dockerfile for one-click panel demo deployment
# Runs Next.js + expects Ollama on the host machine

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Builder Pack for reference (eval sets, regulatory refs)
COPY --from=builder /app/Builder\ Pack ./Builder\ Pack

USER nextjs
EXPOSE 3000

# Health check — confirms the app is serving
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

# Start the Next.js server
CMD ["node", "server.js"]
