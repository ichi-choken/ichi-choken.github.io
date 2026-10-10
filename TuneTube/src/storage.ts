// ===== ブラウザ内の保存（localStorage）とキャッシュ =====
// localStorage が使えない環境（プライベートブラウズ等）でも動作は続ける．
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, STORE_PREFIX } from './config.js';

const CACHE_NS = 'cache:';

export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(STORE_PREFIX + key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* 容量超過などは無視 */
  }
}

export function remove(key: string): void {
  try { localStorage.removeItem(STORE_PREFIX + key); } catch { /* noop */ }
}

function allKeys(): string[] {
  try { return Object.keys(localStorage).filter((k) => k.startsWith(STORE_PREFIX)); } catch { return []; }
}

interface CacheEntry<T> { t: number; v: T }

function cacheEntries(): { key: string; t: number }[] {
  const prefix = STORE_PREFIX + CACHE_NS;
  return allKeys()
    .filter((k) => k.startsWith(prefix))
    .map((k) => {
      let t = 0;
      try { t = (JSON.parse(localStorage.getItem(k) ?? '{}') as CacheEntry<unknown>).t || 0; } catch { /* 壊れたものは古い扱い */ }
      return { key: k, t };
    });
}

export function cacheGet<T>(key: string): T | null {
  const e = load<CacheEntry<T> | null>(CACHE_NS + key, null);
  if (!e) return null;
  if (Date.now() - e.t > CACHE_TTL_MS) { remove(CACHE_NS + key); return null; }
  return e.v;
}

export function cacheSet(key: string, value: unknown): void {
  save(CACHE_NS + key, { t: Date.now(), v: value });
  const entries = cacheEntries().sort((a, b) => a.t - b.t);
  for (const e of entries.slice(0, Math.max(0, entries.length - CACHE_MAX_ENTRIES))) {
    try { localStorage.removeItem(e.key); } catch { /* noop */ }
  }
}

/** 起動時に期限切れのキャッシュを消す． */
export function purgeExpiredCache(): void {
  const now = Date.now();
  for (const e of cacheEntries()) {
    if (now - e.t > CACHE_TTL_MS) { try { localStorage.removeItem(e.key); } catch { /* noop */ } }
  }
}

export function clearCache(): void {
  for (const e of cacheEntries()) { try { localStorage.removeItem(e.key); } catch { /* noop */ } }
}

/** 利用者の要求で，このアプリが保存したデータをすべて削除する． */
export async function deleteAllData(): Promise<void> {
  for (const k of allKeys()) { try { localStorage.removeItem(k); } catch { /* noop */ } }
  try {
    if ('caches' in window) {
      for (const name of await caches.keys()) await caches.delete(name);
    }
    if ('serviceWorker' in navigator) {
      for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
    }
  } catch { /* noop */ }
}
