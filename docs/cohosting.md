# Co-hosting Forge behind an existing reverse proxy

Forge can run in two hosting modes:

| Mode | Who terminates TLS? | Public port | Use when |
|------|--------------------|-------------|----------|
| **standalone** (default) | The `forge-ui` container (nginx in the image) | `:443` (or `:80` plain) on `0.0.0.0` | The host has no other web services, or you're running locally. |
| **cohost** | An existing host-level reverse proxy (nginx, Caddy, cloudflared, …) | Owned by that proxy | The host already serves another site, or you want Cloudflare Tunnel to front the app. |

For a one-command standalone-with-HTTPS install on a fresh host, see `./setup.sh --public` — it implies `--standalone --ssl` and runs a system-side preflight (detects port 80/443 conflicts, offers to stop system nginx/apache, configures UFW, picks the cert hostname). Documented in the deploy repo's `CONTRIBUTING.md` § Public deploy. The rest of *this* doc covers cohost mode end-to-end.

---

## What cohost mode actually does

All it changes is **how ports are exposed** and **who owns TLS**:

- Every container binds to `127.0.0.1` on the host (never `0.0.0.0`), so nothing leaks out past your loopback interface.
- `setup.sh` does **not** generate a self-signed cert, and does **not** rewrite `UI_PORT` to 443.
- `docker-compose.override.yml` does **not** get SSL directives baked in (memory tuning still works on low-RAM hosts).
- An extra overlay `docker-compose.cohost.yml` is layered in and tagged via the `COMPOSE_FILE` env var in `.env`, mainly as a marker (and a place to park future cohost-only tweaks).
- `refresh.sh`'s maintenance-dragon container also stays on `127.0.0.1` and never tries to claim `:443` during the swap, so it can't fight the host proxy.

The app itself is unchanged.

### Port binding: standalone vs cohost

The base `docker-compose.yml` defaults every service's host-side bind to `127.0.0.1` (via `${UI_BIND:-127.0.0.1}`, `${API_BIND:-127.0.0.1}`, etc.). Cohost mode is therefore safe by default — no stray `0.0.0.0` binds. `setup.sh` handles the two modes like this:

| Mode | What `setup.sh` writes to `.env` | Effective bind |
|------|----------------------------------|----------------|
| **standalone** | `UI_BIND=0.0.0.0`, `API_BIND=0.0.0.0`, `POSTGRES_BIND=0.0.0.0`, `MINIO_BIND=0.0.0.0`, `AI_BIND=0.0.0.0`, `TTS_BIND=0.0.0.0`, `DOCUSEAL_BIND=0.0.0.0`, `DEMO_BIND=0.0.0.0` | Every service on `0.0.0.0` — same as pre-cohost behavior (DBeaver on `5432`, MinIO console on `9001`, direct API hits from a LAN device, etc. all keep working). |
| **cohost** | Strips any `*_BIND` keys from `.env` | Compose default of `127.0.0.1` takes over on every service. |

Flipping `./setup.sh --standalone` ↔ `./setup.sh --cohost` rewrites `.env` accordingly — no manual cleanup. If you want a tighter standalone install (say, keep Postgres off the LAN), override any individual bind in `.env` after setup:

```bash
# .env — standalone install that only exposes the UI publicly
UI_BIND=0.0.0.0
API_BIND=127.0.0.1
POSTGRES_BIND=127.0.0.1
MINIO_BIND=127.0.0.1
AI_BIND=127.0.0.1
TTS_BIND=127.0.0.1
DOCUSEAL_BIND=127.0.0.1
```

The dev overlay (`docker-compose.dev.yml`) sidesteps this entirely — it uses `!override` to republish every service on `0.0.0.0` regardless of mode, so device testing over LAN works in dev even when your cohost .env has loopback defaults.

---

## Activating cohost mode

Three ways to flip the switch; they stack in this order of precedence:

1. **CLI flag** on the script:
   ```bash
   ./setup.sh --cohost
   ./setup.sh --standalone  # force back
   ```
2. **`QBE_HOSTING_MODE` in `.env`** (set once by `setup.sh`, read by `refresh.sh` thereafter):
   ```
   QBE_HOSTING_MODE=cohost
   ```
3. **Auto-detection**. Any of the following flips to cohost:
   - `/etc/nginx/sites-enabled/forge*.conf` exists (or the `conf.d` variant)
   - `cloudflared` is running as a systemd service
   - `/etc/cloudflared/config.yml` (or `.yaml`) exists

Once resolved, the mode is persisted to `.env` as `QBE_HOSTING_MODE=cohost|standalone`. `refresh.sh` only reads that value — it never re-detects, so a one-off `cloudflared` install can't silently flip a prod stack.

---

## After setup: configure your public hostname

`setup.sh` in cohost mode does **not** guess your public hostname. You need to edit `.env` and set:

```bash
# Example for forge.com fronted by host nginx + Let's Encrypt:
FRONTEND_BASE_URL=https://forge.com
CORS_ORIGINS=https://forge.com
MINIO_PUBLIC_ENDPOINT=forge.com
```

Then `docker compose up -d --force-recreate forge-api` to pick up the env change.

If MinIO needs to be reachable externally (download links, etc.) add a second vhost or path-route on the proxy pointing at `127.0.0.1:9000`.

---

## Host-level nginx (TLS via Let's Encrypt)

Typical vhost for `forge.com`, terminating TLS and proxying to the UI container on the loopback:

```nginx
# /etc/nginx/sites-available/forge.com.conf
server {
    listen 80;
    listen [::]:80;
    server_name forge.com www.forge.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name forge.com www.forge.com;

    ssl_certificate     /etc/letsencrypt/live/forge.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forge.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass         http://127.0.0.1:4200;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # SignalR / WebSocket upgrade
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/forge.com.conf \
           /etc/nginx/sites-enabled/forge.com.conf
sudo nginx -t && sudo systemctl reload nginx
```

Certs via certbot:

```bash
sudo certbot --nginx -d forge.com -d www.forge.com
```

---

## Cloudflare Tunnel (cloudflared)

Secondary hostnames (e.g. `demo.forge.com`) can route through a Cloudflare Tunnel instead of direct DNS + Let's Encrypt. The tunnel daemon is a separate systemd service and **its config lives outside this repo**: edit by hand and reload.

```yaml
# /etc/cloudflared/config.yml
tunnel: <your-tunnel-uuid>
credentials-file: /etc/cloudflared/<your-tunnel-uuid>.json

ingress:
  - hostname: demo.forge.com
    service: http://127.0.0.1:4203   # the demo container
  - hostname: forge.com
    service: http://127.0.0.1:4200   # (optional — usually handled by host nginx)
  - service: http_status:404
```

Apply:

```bash
sudo systemctl restart cloudflared
```

Cloudflare DNS: add a `CNAME` from `demo.forge.com` → `<tunnel-uuid>.cfargotunnel.com`.

Setup auto-detects an active `cloudflared` service and selects cohost mode on first run.

---

## Port conflicts and `docker-proxy`

If `docker compose up` complains that a port is already allocated, **never blind-`kill` a `docker-proxy` process** — you may be killing the proxy for a co-hosted site's container. See the "Port Conflicts — Never Blind-Kill `docker-proxy`" section of `CLAUDE.md` for the diagnostic flow. The short version:

```bash
sudo ss -tlnp 'sport = :4200'              # find the PID
cat /proc/<pid>/cmdline | tr '\0' ' '; echo  # check argv for -container-id
docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' | grep <id>
```

Only take remediation action once you've confirmed the container belongs to *this* project.

---

## Switching modes later

```bash
./setup.sh --standalone      # back to self-hosted TLS on 443
./setup.sh --cohost          # back to loopback-only + host proxy
```

Each invocation rewrites `QBE_HOSTING_MODE` and `COMPOSE_FILE` in `.env` and regenerates `docker-compose.override.yml` as appropriate. Your data (Postgres volume, MinIO volume) is preserved across mode flips.

---

## Troubleshooting

**Browser gets "connection refused" on the public hostname.**
The host proxy is misrouted or the app isn't up. `curl -I http://127.0.0.1:4200` from the host should return `200` (or a redirect) from the UI container.

**Browser loads but API calls 502 / hang.**
Proxy is reaching the UI, but `/api/*` isn't routing. In cohost mode the UI container proxies `/api` internally to the API container — the public proxy only needs to point at `127.0.0.1:4200`. If you set up a second location for `/api`, remove it.

**SignalR keeps dropping with 1006.**
Missing WebSocket upgrade headers on the host proxy. See the nginx config above — `Upgrade` and `Connection "upgrade"` are mandatory.

**`setup.sh` didn't detect my host nginx.**
The detection globs on `forge*.conf` under `sites-enabled` and `conf.d`. If your vhost file is named differently, pass `--cohost` explicitly (once is enough; it's persisted to `.env`).

**I want both modes on the same box (dev + cohost test).**
Use separate clones in separate directories with separate `.env` files.
