# Docker Deployment (EC2 + existing nginx)

**Date:** 2026-05-31
**Status:** Approved

## Goal

Deploy this Next.js app to an EC2 instance with Docker Compose, alongside
another app already running there behind nginx. Reuse the existing nginx as the
single front door; this app ships as a standalone container reachable only from
localhost, exposed publicly via an nginx `server` block on a subdomain.

## Decisions

- **Reverse proxy:** reuse the existing nginx (single owner of :80/:443). This
  app's compose has no nginx — just the Next.js service.
- **Routing:** subdomain (e.g. `exercise.example.com`).
- **Supabase:** managed cloud — env vars only, no DB container, no migrations in
  compose.
- **Host port:** `127.0.0.1:3001` → container `:3000` (other app assumed on 3000).
- Stack: Next.js 16 standalone, Node 20 alpine, pnpm.

## Env vars

- Build-time (baked into client bundle; public values):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_APP_URL`.
- Runtime secret (never baked): `SUPABASE_SERVICE_ROLE_KEY`.
- Held in `.env.production` (gitignored); `.env.production.example` documents it.

## Artifacts

1. `next.config.ts` — add `output: "standalone"`.
2. `Dockerfile` — multi-stage:
   - `deps`: `pnpm install --frozen-lockfile`.
   - `build`: `NEXT_PUBLIC_*` as `ARG`→`ENV`, then `pnpm build`.
   - `runner`: copy `.next/standalone`, `.next/static`, `public`; non-root user;
     `node server.js`, `PORT=3000`, `HOSTNAME=0.0.0.0`.
3. `app/api/health/route.ts` — `200 {ok:true}`, `dynamic = "force-dynamic"`.
4. `docker-compose.yml` — one `web` service: `ports 127.0.0.1:3001:3000`,
   `env_file .env.production`, `build.args` wired from env for `NEXT_PUBLIC_*`,
   `restart: unless-stopped`, healthcheck on `/api/health`.
5. `.env.production.example` — the four vars.
6. `.dockerignore` — `node_modules`, `.next`, `.git`, `.env*`, etc.
7. `docs/deploy/README.md` — runbook: nginx server-block snippet
   (`proxy_pass http://127.0.0.1:3001` + `X-Forwarded-*`), `certbot --nginx`,
   deploy/update/rollback steps, small-instance build OOM note + registry
   alternative.

## Deploy flow

```
docker compose --env-file .env.production up -d --build
# existing nginx: add server block for exercise.example.com -> 127.0.0.1:3001
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d exercise.example.com
```

## Error handling / ops

- `restart: unless-stopped` + healthcheck for auto-recovery.
- Container bound to localhost only; nginx is the sole public entry.
- Logs via `docker compose logs`.

## Testing

- `docker build` succeeds locally.
- Container starts; `curl localhost:3001/api/health` → 200.
- `nginx -t` passes for the snippet (manual, on the box).
- Full EC2 + TLS verified by the user on the instance.

## Out of scope

- CI/CD pipeline and registry push (mentioned as an option, not built).
- Changes to the other app or its nginx (snippet is documentation only).
- Self-hosted Supabase.
