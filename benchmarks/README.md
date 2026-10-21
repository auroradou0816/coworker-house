# Benchmarks and reliability checks

`socket-load.mjs` opens concurrent Socket.IO clients, creates a disposable room, joins every client, sends durable messages, and waits for each connected member to receive the committed room-event notification. It reports connection latency and message-plus-fanout latency p50/p95/p99. It does not include browser rendering time or claim production capacity.

Run against a disposable local deployment first:

```bash
cd client-heroui && npm ci && cd ..
BENCHMARK_CLIENTS=5 BENCHMARK_MESSAGES=20 \
  BENCHMARK_OUTPUT=benchmarks/results/local-$(date -u +%Y%m%dT%H%M%SZ).json \
  node benchmarks/socket-load.mjs
```

Set `BENCHMARK_URL=https://your-domain` only for an approved public smoke/benchmark run. Defaults are intentionally small; the script caps clients at 100 and messages at 500. Use a disposable deployment because the script creates a room and persistent messages. Do not benchmark an unapproved production instance.

The test suite also contains focused recovery and idempotency checks:

- Multi-client message delivery and room restoration: `client-heroui` Playwright tests `multi-client-realtime.spec.ts` and `room-restore.spec.ts`.
- PostgreSQL reconnect/persistence: `npm run test:e2e:postgres --prefix client-heroui` and `npm run smoke:persistence --prefix server` (the smoke script needs a disposable configured test stack).
- BullMQ retry/recovery, worker heartbeat, durable dispatch, and duplicate result fencing: server unit/integration tests under `server/src/services/*assistant*`, `server/src/services/taskDispatchRelay*`, and repository assistant-run tests.

## Results

No benchmark measurements have been recorded in this repository yet. CI is a test environment, not a public Lightsail benchmark. Do not present target values as measured results. Save each actual run as JSON under `benchmarks/results/` and record whether it used local Docker or the public Lightsail deployment, plus commit, instance size, region, client count, and duration.
