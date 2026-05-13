/**
 * Thin wrapper around Upstash Redis REST API.
 * Falls back to an in-memory Map when env vars are absent (local dev).
 */

const BASE_URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN    = process.env.UPSTASH_REDIS_REST_TOKEN;

declare global { var _kvLocal: Map<string, string> | undefined }
const _local: Map<string, string> = global._kvLocal ?? (global._kvLocal = new Map());

async function redisCmd(parts: (string | number)[]): Promise<unknown> {
  // Local dev fallback
  if (!BASE_URL || !TOKEN) {
    const [op, key] = parts as [string, string, ...unknown[]];
    if (op === 'GET') return _local.get(key) ?? null;
    if (op === 'SET') { _local.set(key, parts[2] as string); return 'OK'; }
    if (op === 'DEL') { _local.delete(key); return 1; }
    return null;
  }

  const res = await fetch(BASE_URL, {
    method:  'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(parts),
    cache:   'no-store',
  });
  const data = await res.json() as { result?: unknown; error?: string };
  if (data.error) throw new Error(`KV: ${data.error}`);
  return data.result ?? null;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const raw = await redisCmd(['GET', key]) as string | null;
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function kvSet(key: string, value: unknown, ttlSec = 86400): Promise<void> {
  await redisCmd(['SET', key, JSON.stringify(value), 'EX', ttlSec]);
}

export async function kvDel(...keys: string[]): Promise<void> {
  await Promise.all(keys.map(k => redisCmd(['DEL', k])));
}
