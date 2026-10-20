# CoWorker House deployment

[中文](部署指南.md)

Maintainer: Yijia Dou. This guide targets **your own** Linux host and repository. It does not use the upstream author's infrastructure.

## Current stage

The maintainer's AWS Lightsail instance runs Ubuntu 24.04, Docker Engine and Docker Compose. The base chat stack has passed container and `/api/status` health checks. Access is through SSH forwarding; public DNS, TLS, provider credentials and E2B are separate follow-up steps. Do not assume the latest source commit is already running on the server.

## Prepare configuration

Clone `https://github.com/auroradou0816/coworker-house.git` and enter its directory. Generate configuration once; do not overwrite existing database passwords on an initialized stack:

```bash
python3 - <<'PY'
from pathlib import Path
import os
import secrets
p = Path('.env.compose')
values = {
    'POSTGRES_PASSWORD': secrets.token_hex(32),
    'LOCAL_S3_ACCESS_KEY_ID': secrets.token_hex(16),
    'LOCAL_S3_SECRET_ACCESS_KEY': secrets.token_hex(32),
    'CLIENT_URL': 'http://localhost:3012',
    'CLIENT_URLS': 'http://localhost:3012',
    'MEDIA_STORAGE_PUBLIC_ENDPOINT': 'http://localhost:8333',
}
lines = []
for line in Path('.env.compose.example').read_text().splitlines():
    key = line.split('=', 1)[0]
    lines.append(f'{key}={values[key]}' if key in values else line)
fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w') as f:
    f.write('\n'.join(lines) + '\n')
print('Private configuration created.')
PY
```

Google login is disabled by default. Set your own frontend Google client ID before building if needed. Provider keys belong in `.env.compose`. Keep Code Agent disabled until your own E2B template, credentials and required connection encryption keys are ready.

## Start and verify

```bash
sudo docker compose --env-file .env.compose config --quiet
sudo docker compose --env-file .env.compose up -d --build app ai-worker
sudo docker compose --env-file .env.compose ps -a
curl -fsS http://127.0.0.1:3012/api/status
```

App, Worker, PostgreSQL, Redis and object storage should be healthy. `migrate` should exit with status 0. Check `ready: true` and dependency statuses, then test room creation, messages after refresh and image upload. AI Worker health alone does not prove a provider key has been configured.

## Access through SSH

On your own computer, substitute your actual key path and server address:

```bash
ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -i /path/to/your-key.pem \
  -L 127.0.0.1:3012:127.0.0.1:3012 \
  -L 127.0.0.1:8333:127.0.0.1:8333 \
  ubuntu@YOUR_SERVER_IP
```

Open `http://localhost:3012`. Both forwards are required for the configured image upload/download flow. These loopback services are not public website endpoints.

## Source updates and public access

Keep `.env.compose` and persistent volumes. Fetch reviewed updates, rebuild the app image and repeat health checks. Source pushes do not deploy the server. Do not use `docker compose down -v` to update: it deletes database and Redis volumes.

For public access, configure your domain, TLS reverse proxy, allowed client origins and an externally reachable object-storage endpoint. Keep database/Redis private. Configure backups outside the instance and test recovery before relying on it for important data.

The optional `edge` profile and macOS Keychain scripts are inherited tooling, not required for Lightsail. The former Fly workflow is archived and cannot run automatically. Internal `roomtalk` package, database and volume identifiers remain for compatibility; renaming them is a separate data migration.
