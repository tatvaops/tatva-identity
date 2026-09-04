type MemoryEntry = { value: string; expiresAt: number };

const memory = new Map<string, MemoryEntry>();

function prune(now: number) {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
}

async function redis(): Promise<import("ioredis").default | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  const g = globalThis as typeof globalThis & { __tatvaRedis?: import("ioredis").default };
  if (g.__tatvaRedis) return g.__tatvaRedis;
  const Redis = (await import("ioredis")).default;
  g.__tatvaRedis = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  return g.__tatvaRedis;
}

export async function kvGet(key: string) {
  const client = await redis();
  if (client) return client.get(key);
  const now = Date.now();
  prune(now);
  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= now) return null;
  return entry.value;
}

export async function kvSet(key: string, value: string, ttlMs: number) {
  const client = await redis();
  if (client) {
    await client.psetex(key, ttlMs, value);
    return;
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function kvDel(key: string) {
  const client = await redis();
  if (client) {
    await client.del(key);
    return;
  }
  memory.delete(key);
}

export async function kvIncr(key: string, ttlMs: number) {
  const client = await redis();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) await client.pexpire(key, ttlMs);
    return count;
  }
  const now = Date.now();
  prune(now);
  const current = memory.get(key);
  if (!current || current.expiresAt <= now) {
    memory.set(key, { value: "1", expiresAt: now + ttlMs });
    return 1;
  }
  const next = Number(current.value) + 1;
  memory.set(key, { value: String(next), expiresAt: current.expiresAt });
  return next;
}
