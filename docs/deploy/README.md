# Deploying to EC2 (Docker Compose behind existing nginx)

This app runs as a single standalone Next.js container, bound to
`127.0.0.1:3001`. Your existing nginx stays the only public entry point on
`:80/:443` and reverse-proxies a subdomain to the container. Supabase is the
managed cloud service — no database runs on the instance.

```
Internet :443 ──► nginx (existing) ──► 127.0.0.1:3001 ──► exercise-app container :3000
                                   └──► your other app
```

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
