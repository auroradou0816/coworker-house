#!/usr/bin/env node
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../client-heroui/package.json', import.meta.url));
const { io } = require('socket.io-client');

const target = process.env.BENCHMARK_URL || 'http://127.0.0.1:3012';
const clientCount = positiveInteger(process.env.BENCHMARK_CLIENTS, 5, 100);
const messageCount = positiveInteger(process.env.BENCHMARK_MESSAGES, 20, 500);
const timeoutMs = positiveInteger(process.env.BENCHMARK_TIMEOUT_MS, 15_000, 120_000);
const sockets = [];
const connectionSamples = [];
const deliverySamples = [];
let roomId;

function positiveInteger(value, fallback, maximum) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) return fallback;
  return parsed;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
}

function emitAck(socket, event, payload, timeout = timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} timed out`)), timeout);
    socket.emit(event, payload, response => {
      clearTimeout(timer);
      if (response?.success === false) reject(new Error(response.error || `${event} failed`));
      else resolve(response);
    });
  });
}

async function connectAndRegister(index) {
  const started = performance.now();
  const socket = io(target, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: timeoutMs,
  });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Socket.IO connect timed out')), timeoutMs);
    socket.once('connect', () => { clearTimeout(timer); resolve(); });
    socket.once('connect_error', error => { clearTimeout(timer); reject(error); });
  });
  connectionSamples.push(performance.now() - started);
  await emitAck(socket, 'register', {
    clientId: `bench-${randomUUID()}`,
    browserInstanceId: randomUUID(),
    username: `Benchmark ${index + 1}`,
  });
  return socket;
}

async function main() {
  const startedAt = new Date().toISOString();
  try {
    const connected = await Promise.all(Array.from({ length: clientCount }, (_, index) => connectAndRegister(index)));
    const owner = connected[0];
    const created = await emitAck(owner, 'create_room', { name: `load-${Date.now()}` });
    roomId = created.roomId;
    if (!roomId) throw new Error('create_room did not return a room ID');
    await Promise.all(connected.map(socket => emitAck(socket, 'join_room', { roomId })));

    for (let index = 0; index < messageCount; index += 1) {
      const eventWaits = connected.map(socket => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          socket.off('room_event_available', onEvent);
          reject(new Error(`message ${index + 1} was not delivered to every connected client`));
        }, timeoutMs);
        const onEvent = event => {
          if (event?.roomId !== roomId) return;
          clearTimeout(timer);
          socket.off('room_event_available', onEvent);
          resolve();
        };
        socket.on('room_event_available', onEvent);
      }));
      const sendStarted = performance.now();
      await emitAck(owner, 'send_message', {
        roomId,
        content: `benchmark-${index + 1}-${randomUUID()}`,
        username: 'Benchmark',
        clientMessageId: randomUUID(),
      });
      await Promise.all(eventWaits);
      deliverySamples.push(performance.now() - sendStarted);
    }

    const result = {
      status: 'completed',
      target,
      localOrPublic: new URL(target).hostname === '127.0.0.1' || new URL(target).hostname === 'localhost' ? 'local' : 'public-target',
      startedAt,
      finishedAt: new Date().toISOString(),
      clients: clientCount,
      messages: messageCount,
      deliveryAcksPerMessage: clientCount,
      connectionLatencyMs: { p50: percentile(connectionSamples, 0.5), p95: percentile(connectionSamples, 0.95), p99: percentile(connectionSamples, 0.99) },
      messageAndFanoutLatencyMs: { p50: percentile(deliverySamples, 0.5), p95: percentile(deliverySamples, 0.95), p99: percentile(deliverySamples, 0.99) },
      note: 'These are measurements from this run only; they are not production capacity claims.',
    };
    const output = JSON.stringify(result, null, 2);
    if (process.env.BENCHMARK_OUTPUT) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(process.env.BENCHMARK_OUTPUT, `${output}\n`, { flag: 'wx' });
    }
    process.stdout.write(`${output}\n`);
  } finally {
    for (const socket of sockets) socket.disconnect();
  }
}

main().catch(error => {
  process.stderr.write(`Benchmark failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
