// High-speed in-memory cache + in-flight request coalescing + background prewarm
// Ensures Always-On Unlimited Network zero-lag performance across simulator apps.

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
let prewarmedOnce = false;

export async function fastFetchJson<T = any>(
  url: string,
  ttlMs = 180_000,
  staleMs = 600_000
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(url) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const refresh = (): Promise<T> => {
    const existing = inFlight.get(url) as Promise<T> | undefined;
    if (existing) return existing;

    const req = fetch(url, {
      keepalive: true,
    })
      .then(async (res) => {
        const json = (await res.json()) as T;
        if (res.ok) {
          const ts = Date.now();
          memoryCache.set(url, {
            data: json,
            expiresAt: ts + ttlMs,
            staleUntil: ts + ttlMs + staleMs,
          });
        }
        return json;
      })
      .finally(() => {
        inFlight.delete(url);
      });

    inFlight.set(url, req);
    return req;
  };

  // Stale-while-revalidate: serve cached response immediately (0ms lag) and refresh in background
  if (cached && cached.staleUntil > now) {
    void refresh().catch(() => {});
    return cached.data;
  }

  return refresh();
}

export async function measureNetworkLatency(): Promise<number | null> {
  try {
    const start = performance.now();
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return null;
    return Math.max(1, Math.round(performance.now() - start));
  } catch {
    return null;
  }
}

export function prewarmNetwork(): void {
  if (prewarmedOnce || typeof window === 'undefined') return;
  prewarmedOnce = true;

  const warmUrls = [
    '/api/playstore/search?category=apps',
    '/api/playstore/search?category=games',
    '/api/youtube/search?q=trending&type=trending',
  ];

  // Defer slightly after initial React hydration so UI remains 60fps
  window.setTimeout(() => {
    for (const url of warmUrls) {
      void fastFetchJson(url, 300_000, 900_000).catch(() => {});
    }
  }, 350);
}

export function clearNetworkCache(): void {
  memoryCache.clear();
  prewarmedOnce = false;
}
