# syntax=docker/dockerfile:1

# ---------- Base ----------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---------- Prune ----------
# Produce a partial monorepo containing only what `api` needs.
FROM base AS pruner
COPY . .
RUN corepack prepare pnpm@9.12.0 --activate
RUN pnpm dlx turbo@^2.5.0 prune api --docker

# ---------- Install + Build ----------
FROM base AS builder
RUN corepack prepare pnpm@9.12.0 --activate

# Install all deps (incl. dev) for the Nest build.
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build.
COPY --from=pruner /app/out/full/ .
RUN pnpm dlx turbo@^2.5.0 run build --filter=api

# Strip dev dependencies for the runtime image.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

USER nestjs
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
