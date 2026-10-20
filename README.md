# CoWorker House

**A shared space for people, ideas, and AI.** Maintained by [Yijia Dou](https://github.com/auroradou0816).

[中文](README.zh.md) · [Deployment](DeploymentGuide.md) · [Project origin](PROJECT_ORIGIN.md) · [Security](SECURITY.md)

CoWorker House combines real-time chat rooms with optional AI conversations and sandboxed coding workspaces. The creative-studio interface brings room creation, invitations, and shared projects into one responsive home screen.

## What works

- Shared rooms, persistent messages, membership controls, uploads, and reconnect recovery.
- A responsive studio homepage, room cards, light/dark themes, and five UI languages.
- Optional provider-backed AI chat, executed by a separate BullMQ worker.
- Optional E2B coding workspaces with files, terminals, previews, and agent controls.

AI, Google login, and E2B require your own credentials and configuration. They are not enabled just by cloning this repository.

## Architecture

- **Client:** React, TypeScript, Vite, HeroUI.
- **App:** Node.js, Express, Socket.IO; checks access and persists canonical mutations.
- **PostgreSQL:** durable rooms, messages, events, and assistant-run results.
- **Redis / BullMQ:** presence, transient delivery, cache, and task scheduling.
- **AI worker:** provider execution, generation fencing, and terminal result projection.
- **Object storage:** S3-compatible uploads; the bundled Compose stack uses SeaweedFS.
- **Optional E2B sandbox:** room-scoped execution of untrusted coding tasks.

Durable room events repair missed socket updates. AI dispatch intent is committed with the task in PostgreSQL and relayed to BullMQ. Historical architecture notes in `docs/` describe inherited capabilities and are not claims about the current deployment.

## Run and deploy

Use Node.js 24.18.0 or newer for development. The Dockerfile builds both packages and serves the frontend through the app.

Follow [the deployment guide](DeploymentGuide.md) to generate private configuration, start Compose, and access the app. Never commit `.env.compose` or private keys.

Current maintainer deployment: an AWS Lightsail Ubuntu instance, with healthy App, Worker, PostgreSQL, Redis, and SeaweedFS services. Browser access is currently through an SSH tunnel; no public website/domain is announced. AI and E2B integration are not yet enabled there.

## Checks

```bash
cd client-heroui
npm ci
npm run build
npm test
```

The server has focused unit tests and integration tests requiring disposable PostgreSQL/Redis. See package scripts and the historical architecture documentation before running service-dependent tests.

## Ownership and provenance

Maintainer: **Yijia Dou** · contact: **auroradou0816@gmail.com**.

This is an authorized derivative of an existing project. [PROJECT_ORIGIN.md](PROJECT_ORIGIN.md) documents the source and rewritten Git metadata. Third-party license notices remain in their respective directories. Public repository visibility does not itself grant a new blanket license to every included component.
