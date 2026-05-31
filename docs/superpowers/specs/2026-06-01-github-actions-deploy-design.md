# CI/CD: GitHub Actions build → ghcr → SSH deploy to EC2

**Date:** 2026-06-01
**Status:** Approved

## Goal

Move the Docker image build off the EC2 instance (where it OOM-kills on a small
box) into GitHub Actions. CI builds and pushes the image to GHCR; EC2 only pulls
and runs it.

```
push main / manual → verify → build+push (ghcr) → ssh deploy (pull + up -d)
```

## Decisions

- **Registry:** GitHub Container Registry — `ghcr.io/notreallyaperson/fitness-app`.
  Push via the built-in `GITHUB_TOKEN` (`packages: write`); package kept private,
  EC2 authenticates with the workflow token at deploy time (fallback: make the
  package public).
- **Deploy:** SSH from Actions → `docker compose -f docker-compose.prod.yml pull && up -d`.
- **Trigger:** `push` to `main` + `workflow_dispatch`.
- **Verify gate:** typecheck + vitest before build, so broken code never ships.
- `SUPABASE_SERVICE_ROLE_KEY` never enters CI — runtime-only in EC2 `.env.production`.

## Artifacts

1. `.github/workflows/deploy.yml` — three jobs:
   - **verify:** `pnpm install --frozen-lockfile`, `pnpm exec tsc --noEmit`,
     `pnpm test`.
   - **build-push** (needs verify): `docker/login-action` → ghcr with
     `GITHUB_TOKEN`; `docker/metadata-action` tags `latest` + `sha-<short>`;
     `docker/build-push-action` with `NEXT_PUBLIC_*` build args from secrets and
     `cache-from/to: type=gha`.
   - **deploy** (needs build-push): `appleboy/ssh-action` runs on EC2 —
     `docker login ghcr.io`, `git pull`, `docker compose -f docker-compose.prod.yml pull`,
     `up -d`, `docker image prune -f`.
   - `permissions: { contents: read, packages: write }`.
2. `docker-compose.prod.yml` — `image: ghcr.io/notreallyaperson/fitness-app:${IMAGE_TAG:-latest}`,
   **no build**, `env_file: .env.production`, `ports: 127.0.0.1:3001:3000`,
   `restart: unless-stopped`, healthcheck. Existing `docker-compose.yml`
   (local build) and `Dockerfile` unchanged.
3. `docs/deploy/README.md` — CI/CD section: required secrets, flow, first-time
   EC2 setup, manual build retained as fallback.

## GitHub secrets / vars (user adds; cannot be set from code)

- Build: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_APP_URL`.
- Deploy: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (private key; public half in
  EC2 `~/.ssh/authorized_keys`).
- Optional var: `EC2_APP_DIR` (default `~/fitness-app`).

## EC2 prerequisites (one-time)

- Docker + compose plugin installed.
- Repo cloned at `EC2_APP_DIR`, with `.env.production` present.
- Port 22 reachable by the runner (key-only auth; GitHub IP allowlist or
  `0.0.0.0/0`). More locked-down options (AWS SSM, Tailscale) are out of scope.

## Error handling / ops

- `verify` failure blocks build+deploy.
- Deploy is idempotent: re-running pulls latest and restarts.
- Rollback: re-run the workflow on a previous commit, or on EC2
  `IMAGE_TAG=sha-<short> docker compose -f docker-compose.prod.yml up -d`.
- `docker image prune -f` after deploy keeps disk in check.

## Testing / verification

- `docker compose -f docker-compose.prod.yml config` validates locally.
- Workflow YAML parses (actionlint / yaml load).
- End-to-end (push → deploy → site live) verified by the user once secrets exist.

## Out of scope

- Multi-environment (staging/prod) pipelines.
- Blue-green / zero-downtime rollout.
- AWS SSM / Tailscale-based access hardening.
