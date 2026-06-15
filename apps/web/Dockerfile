# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---------- Prune ----------
# Produce a partial monorepo containing only what `web` needs.
FROM base AS pruner
COPY . .
RUN corepack prepare pnpm@9.12.0 --activate
RUN pnpm dlx turbo@^2.5.0 prune web --docker

# ---------- Install + Build ----------
FROM base AS builder
RUN corepack prepare pnpm@9.12.0 --activate

# Install dependencies (cached unless the pruned lockfile changes).
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build the project.
COPY --from=pruner /app/out/full/ .

# NEXT_PUBLIC_* vars are inlined at build time, so the API URL must be
# provided here rather than at runtime.
ARG NEXT_PUBLIC_API_URL=https://api.adenijitaoheed.work
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm dlx turbo@^2.5.0 run build --filter=web

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# The standalone output already contains the trimmed node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
