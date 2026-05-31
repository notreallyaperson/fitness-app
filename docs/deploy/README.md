# Deploying to EC2 (Docker Compose behind existing nginx)

This app runs as a single standalone Next.js container, bound to
`127.0.0.1:3001`. Your existing nginx stays the only public entry point on
`:80/:443` and reverse-proxies a subdomain to the container. Supabase is the
managed cloud service — no database runs on the instance.

```
Internet :443 ──► nginx (existing) ──► 127.0.0.1:3001 ──► exercise-app container :3000
                                   └──► your other app
```

There are two ways to deploy:

- **CI/CD (recommended):** GitHub Actions builds the image and pushes it to
  GHCR, then SSHes in and restarts the container — see
  [CI/CD with GitHub Actions](#cicd-with-github-actions). Building never happens
  on the instance, so a small box won't OOM.
- **Manual:** build on the instance with `docker compose ... up --build` — see
  [Manual build & start](#2-build--start). Kept as a fallback.

## CI/CD with GitHub Actions

`.github/workflows/deploy.yml` runs on push to `main` (and via the **Run
workflow** button): **verify** (typecheck + tests) → **build-push** (image to
`ghcr.io/notreallyaperson/fitness-app`) → **deploy** (SSH into EC2, pull, restart).

### One-time setup

**1. GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | baked into the client bundle at build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | baked into the client bundle at build |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://fitness.qworky.tech` |
| `EC2_HOST` | instance public IP / DNS |
| `EC2_USER` | SSH user (e.g. `ubuntu` / `ec2-user`) |
| `EC2_SSH_KEY` | **private** key; its public half is in EC2 `~/.ssh/authorized_keys` |

Optional repo **variable** `EC2_APP_DIR` (default `~/fitness-app`).
`SUPABASE_SERVICE_ROLE_KEY` is **not** a CI secret — it stays only in EC2's
`.env.production`.

**2. On the EC2 instance:**

```bash
# repo cloned at EC2_APP_DIR with .env.production present (see step 1 below)
git clone git@github.com:notreallyaperson/fitness-app.git ~/fitness-app
cd ~/fitness-app
cp .env.production.example .env.production   # fill in real values
```

**3. Security group:** allow inbound `22` from the runner (key-only auth; either
`0.0.0.0/0` or GitHub's published IP ranges). For tighter access, AWS SSM or
Tailscale are alternatives (not covered here).

### Deploying

Push to `main` (or click **Run workflow**). The pipeline builds and rolls out
automatically. The image is tagged `latest` and `sha-<short>`.

**Rollback** — on the instance, pin a previous build:

```bash
IMAGE_TAG=sha-1a2b3c4 docker compose -f docker-compose.prod.yml up -d
```

> The GHCR package is private; the deploy step logs in with the workflow token.
> If the EC2 pull ever fails on auth, make the package public
> (repo → Packages → package → visibility) or add a read-only PAT.

---

## Manual build & start (fallback)

## 1. Configure environment

On the server, from the repo root:

```bash
cp .env.production.example .env.production
# edit .env.production with your real Supabase URL, anon key, app URL,
# and service-role key
```

`NEXT_PUBLIC_*` values are compiled into the client bundle at build time;
`SUPABASE_SERVICE_ROLE_KEY` is used only at runtime and never reaches the
browser.

## 2. Build & start

```bash
docker compose --env-file .env.production up -d --build
curl -s localhost:3001/api/health    # -> {"ok":true}
```

> **Always pass `--env-file .env.production`.** The `NEXT_PUBLIC_*` values are
> read at build time from that file. A plain `docker compose up --build` (no
> `--env-file`) leaves them blank — compose now fails fast telling you to add
> the flag, rather than crashing deep inside `next build`.

> **Small instances (t2/t3.micro):** a Next.js build can run out of memory.
> Either add swap, or build elsewhere and pull the image:
>
> ```bash
> # locally / in CI
> docker build \
>   --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
>   --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
>   --build-arg NEXT_PUBLIC_APP_URL=https://exercise.example.com \
>   -t <registry>/exercise-app:latest .
> docker push <registry>/exercise-app:latest
> # on the server (set `image:` to the same ref, drop --build)
> docker compose --env-file .env.production up -d
> ```

## 3. nginx server block (add to your existing nginx)

Create `/etc/nginx/sites-available/exercise` (or add a `server {}` to your
existing config) — this does **not** touch your other app:

```nginx
server {
    listen 80;
    server_name exercise.example.com;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/exercise /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 4. TLS

```bash
sudo certbot --nginx -d exercise.example.com
```

certbot rewrites the `server` block to listen on 443 and adds the certificate;
renewal is handled by its systemd timer.

## 5. Update / rollback

```bash
# update
git pull
docker compose --env-file .env.production up -d --build

# logs
docker compose logs -f web

# rollback: redeploy a previous image tag, or
git checkout <previous-sha> && docker compose --env-file .env.production up -d --build
```

## Notes

- Change the host port `3001` in `docker-compose.yml` if your other app uses it.
- DNS: point an `A` record for `exercise.example.com` at the instance's IP.
- Open only ports 80/443 in the EC2 security group; `3001` stays on localhost.
