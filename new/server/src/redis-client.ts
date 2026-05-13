import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

/**
 * Prefer REDIS_URL, e.g. redis://default:PASSWORD@HOST:PORT
 * Or set REDIS_HOST, REDIS_PORT, REDIS_USERNAME (optional), REDIS_PASSWORD (optional).
 */
function buildUrl(): string {
  const url = process.env.REDIS_URL?.trim();
  if (url) return url;
  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = process.env.REDIS_PORT ?? "6379";
  const user = process.env.REDIS_USERNAME ?? "";
  const pass = process.env.REDIS_PASSWORD ?? "";
  const auth =
    user && pass
      ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`
      : pass
        ? `:${encodeURIComponent(pass)}@`
        : "";
  return `redis://${auth}${host}:${port}`;
}

export async function getRedis(): Promise<RedisClientType> {
  if (client?.isOpen) return client;
  const url = buildUrl();
  client = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
      connectTimeout: 10_000,
    },
  });
  client.on("error", (err) => console.error("Redis:", err.message));
  await client.connect();
  return client;
}
