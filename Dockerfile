# syntax=docker/dockerfile:1

# ---- base: Node 20 + pnpm 9 (matches lockfileVersion 9.0) ----
FROM node:20-alpine AS base
# Next.js on alpine needs libc6-compat for some native binaries.
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- deps: install from a frozen lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: bake the app (NEXT_PUBLIC_* are inlined here) ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public Supabase config is compiled into the client bundle at build time, so
# it must be present now. These are public values (not secrets).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm build

# ---- runner: minimal standalone server ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
