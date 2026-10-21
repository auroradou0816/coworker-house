# Public deployment on AWS Lightsail

CoWorker House runs as the existing Docker Compose stack. Caddy provides automatic HTTPS and proxies the app (including Socket.IO/WSS) and S3-compatible media service. PostgreSQL, Redis, SeaweedFS, and workers have no public host ports. The verified demo is [coworker-house-app.duckdns.org](https://coworker-house-app.duckdns.org/) with media on `coworker-house-douzi.duckdns.org`. **Never run `docker compose down -v`.**

## 1. Register two free DuckDNS names

1. Open [DuckDNS](https://www.duckdns.org/), sign in using an available account provider, and note the account token shown on the dashboard. Keep the token private.
2. In **Domains**, register two available labels. The current deployment uses `coworker-house-app` and `coworker-house-douzi`, resulting in `coworker-house-app.duckdns.org` and `coworker-house-douzi.duckdns.org`. If either label is unavailable, choose names you control and update the environment values below.
3. Set both IPv4 addresses to the Lightsail static IP `16.144.4.15`. Do not add a paid domain or DNS provider. Check the records:

   ```bash
   dig +short coworker-house-app.duckdns.org A
   dig +short coworker-house-douzi.duckdns.org A
   ```

   Both should return `16.144.4.15`. Replace the example labels in all commands below with the labels you actually registered. The repository includes `ops/duckdns/update.sh` to set both A records in one request; its token is read from `DUCKDNS_TOKEN`, not stored in the repository. A Lightsail static IP normally needs only this one update. If the instance's IP changes, rerun the update script with the new IPv4 address.

## 2. Set the Lightsail firewall

In the instance's **Networking** tab, allow inbound TCP ports **80** and **443** from all IPv4 addresses; allow UDP **443** optionally for HTTP/3. Keep SSH (TCP 22) restricted to your current IP. Do not create public rules for 3012, 3013, 5432, 6379, 8333, or Caddy's admin port 2019. The app host port mappings are loopback-only; internal containers share the private Compose network.

## 3. Configure the existing server safely

Connect over SSH and preserve the existing `.env.compose`, database password, SeaweedFS credentials, object-storage directory, and Docker volumes. Back up the env file before editing; do not create a replacement over it. Update only the domain/origin settings:

```dotenv
PUBLIC_DOMAIN=YOUR_APP.duckdns.org
MEDIA_DOMAIN=YOUR_MEDIA.duckdns.org
CLIENT_URL=https://YOUR_APP.duckdns.org
CLIENT_URLS=https://YOUR_APP.duckdns.org
MEDIA_CORS_ALLOWED_ORIGINS=https://YOUR_APP.duckdns.org
MEDIA_STORAGE_PUBLIC_ENDPOINT=https://YOUR_MEDIA.duckdns.org
TRUST_PROXY_HOPS=1
METRICS_TOKEN=<existing-or-new-long-random-secret>
CODE_AGENT_ENABLED=false
CODEX_CONNECTIONS_ENABLED=false
GITHUB_CONNECTIONS_ENABLED=false
```

Set `YOUR_APP` and `YOUR_MEDIA` to the labels actually registered. `CLIENT_URL(S)` controls the frontend origin and backend/Socket.IO CORS; `MEDIA_CORS_ALLOWED_ORIGINS` permits that app origin to make browser PUT/GET requests to SeaweedFS through the media hostname. Caddy preserves the media `Host` and request URI because S3 Signature V4 signs the host/path/query. Keep AI provider keys absent and code-agent/E2B options disabled until their credentials, quotas, and access controls have been reviewed.

Store DuckDNS credentials in the SSH session environment only. Do not paste the token into a command, shell history, `.env.compose`, or a GitHub issue:

```bash
read -rsp 'DuckDNS token: ' DUCKDNS_TOKEN; echo
export DUCKDNS_TOKEN
export DUCKDNS_APP_SUBDOMAIN=YOUR_APP
export DUCKDNS_MEDIA_SUBDOMAIN=YOUR_MEDIA
export DUCKDNS_IPV4=16.144.4.15
bash ops/duckdns/update.sh
unset DUCKDNS_TOKEN
```

Run that from the repository root after the script has been pulled. The response must say both subdomains were updated. Verify both with `dig` again before starting Caddy. Protect the env file:

```bash
sudo chmod 600 .env.compose
sudo install -m 600 .env.compose ".env.compose.pre-public-$(date -u +%Y%m%dT%H%M%SZ)"
```

The existing Lightsail account has a running stack and persistent data. Do not use the first-install env generator on it. Verify `CODE_AGENT_ENABLED=false`, and leave provider keys and E2B configuration unset for the initial public trial.

## 4. Back up, deploy, and verify HTTPS

Only deploy a reviewed and pushed commit. First capture the existing database and object storage, then save the running application image for rollback. The Compose backup profile uses the existing deployment configuration and does not remove volumes.

```bash
cd ~/coworker-house
sudo docker compose --env-file .env.compose config --quiet
sudo docker compose --env-file .env.compose --profile public config --quiet
sudo docker compose --env-file .env.compose --profile ops run --rm postgres-backup
sudo docker image tag roomtalk-local:dev roomtalk-local:pre-public

git fetch origin
git checkout master
git pull --ff-only origin master
sudo docker compose --env-file .env.compose --profile public up -d --build app ai-worker caddy
sudo docker compose --env-file .env.compose --profile public ps -a
curl -fsS http://127.0.0.1:3012/api/health/ready
curl -fsSI https://YOUR_APP.duckdns.org/
curl -sS -o /dev/null -w 'media HTTP %{http_code}; TLS verify %{ssl_verify_result}\n' https://YOUR_MEDIA.duckdns.org/
```

Caddy obtains certificates automatically when both DuckDNS names resolve to this instance and inbound TCP 80/443 reach it. It renews them and persists certificate state in the named `caddy_data` volume. No manual certificate or DNS challenge setup is required. The media root may return an S3 error HTTP status; `TLS verify 0` confirms its certificate, but verify media by uploading and opening an actual file from the app.

## 5. Public end-to-end checklist

The current Lightsail deployment passed the browser-facing checks on 2026-10-21: HTTPS page load, two independent WSS clients joining a room, real-time message delivery, persisted history after reconnect, and signed media upload and download. A one-off test message arrived in about 71 ms; this is a single smoke-test observation, not a benchmark result. Temporary test rooms and media were removed.

Use two independent browsers, preferably different browser profiles or devices:

1. Open `https://YOUR_APP.duckdns.org/`; confirm the browser shows a valid certificate and the page loads.
2. Create a room in browser A, then join it from browser B using its invitation/link and password if enabled.
3. Send messages in both directions and confirm each arrives without refreshing. Browser developer tools should show a Socket.IO websocket connection using `wss://` (polling fallback may appear before upgrade).
4. Refresh both pages; confirm room membership and persisted message history return.
5. Temporarily take one browser offline, restore the network, and confirm the socket reconnects and missed room events appear.
6. Upload an image/file where supported. Confirm its URL is HTTPS under `YOUR_MEDIA.duckdns.org`, and open it from the second browser. This exercises S3 CORS, signature, and Caddy host/path preservation.
7. On the instance, check `sudo docker compose --env-file .env.compose --profile public ps` and `curl -fsS http://127.0.0.1:3012/api/health/ready`. The latter reports database, Redis, media, Socket.IO adapter, assistant queue, and worker readiness.
8. From a machine outside Lightsail, run `nmap -Pn -p 22,80,443,2019,3012,3013,5432,54329,6379,63799,8333 16.144.4.15`. For the current deployment, 80, 443, and 22 responded; the app, database, Redis, object-storage, and Caddy admin ports were closed externally. The Lightsail SSH rule currently allows any IPv4/IPv6 source; restrict TCP 22 to your current IP in the console when you have confirmed your SSH access path. Verify `https://YOUR_APP.duckdns.org/api/health/ready` and `/api/internal/metrics` return 404.

Do not enable AI/E2B during this initial anonymous trial. Confirm authentication, room permissions, AI quotas, and sandbox limits separately before adding credentials or setting `CODE_AGENT_ENABLED=true`.

## 6. Operations

The app writes structured logs to Docker stdout. Internal metrics (HTTP p50/p95/p99 and 5xx rate, active sockets, BullMQ counts, worker heartbeat) are available only on the instance at `/api/internal/metrics` with a bearer token; Caddy blocks that route publicly. Metrics are process-local and reset on restart.

```bash
sudo docker compose --env-file .env.compose --profile public ps
sudo docker compose --env-file .env.compose logs --since=15m app ai-worker caddy
curl -fsS http://127.0.0.1:3012/api/health/ready
sudo docker compose --env-file .env.compose exec -T app node -e 'fetch("http://127.0.0.1:3012/api/internal/metrics", {headers: {authorization: `Bearer ${process.env.METRICS_TOKEN}`}}).then(r => r.text()).then(console.log)'
sudo docker stats --no-stream
```

For a later reviewed update, repeat the backup, image tag, fast-forward pull, and `compose up` steps. Persistent volumes are reused; never use `down -v`.

## 7. Roll back

If the new app fails its health check, restore the prior app image and stop Caddy to return to the previous loopback-only state. Keep the backup files and all named volumes:

```bash
sudo docker image tag roomtalk-local:pre-public roomtalk-local:dev
sudo docker compose --env-file .env.compose up -d app ai-worker
sudo docker compose --env-file .env.compose --profile public stop caddy
sudo docker compose --env-file .env.compose ps -a
curl -fsS http://127.0.0.1:3012/api/health/ready
```

This restores the old application image, not database contents. Retain and verify the database/object-store backup before rollout; never run destructive migrations or delete production data as part of rollback.

## Troubleshooting

- **Caddy has no certificate:** check both `dig ... A` results, Lightsail TCP 80/443 rules, `docker compose ... logs caddy`, and that the domain labels are real DuckDNS registrations.
- **502 from app:** inspect app/migrate health and `docker compose ... logs app migrate`; test local `/api/health/ready`.
- **Socket.IO does not connect:** ensure `CLIENT_URL` and `CLIENT_URLS` exactly use the app's `https://` origin, `TRUST_PROXY_HOPS=1`, and browser WebSocket traffic is not blocked.
- **Media PUT/GET fails with CORS:** set `MEDIA_CORS_ALLOWED_ORIGINS` to the exact app origin (no trailing slash), and verify `MEDIA_STORAGE_PUBLIC_ENDPOINT` and `MEDIA_DOMAIN` are the same media host. Check that Caddy is preserving the request host/path and inspect object-storage logs.
- **Public scan shows an internal port open:** remove its Lightsail firewall rule and confirm the Compose binding is loopback-only; do not rely on obscurity.
