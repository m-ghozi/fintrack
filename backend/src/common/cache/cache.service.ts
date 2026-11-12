import { Injectable } from '@nestjs/common';

interface Entry {
  expires: number;
  value: unknown;
}

/**
 * Tiny in-process TTL cache (single pm2 fork, no Redis needed).
 *
 * Invalidation strategy: every user has a monotonically increasing "epoch".
 * Read endpoints (dashboard/reports/notifications) cache under keys that embed
 * the current epoch, and a global interceptor bumps the epoch after any
 * successful non-GET request — so a write immediately invalidates that user's
 * cached reads without touching every service. Entries that are no longer
 * referenced simply expire and are lazily pruned.
 */
@Injectable()
export class CacheService {
  private store = new Map<string, Entry>();
  private inflight = new Map<string, Promise<unknown>>();
  private epochByUser = new Map<string, number>();

  private static SOFT_LIMIT = 500;

  /** Cache key scoped to a user, embedding their current mutation epoch. */
  userKey(scope: string, userId: string, ...parts: (string | number)[]) {
    return `${scope}:${userId}:${this.epochByUser.get(userId) ?? 0}:${parts.join(':')}`;
  }

  /** Invalidate all cached reads for a user (called after writes). */
  bumpUser(userId: string) {
    this.epochByUser.set(userId, (this.epochByUser.get(userId) ?? 0) + 1);
  }

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  /**
   * Returns the cached value, or computes it via `factory`, caches it for
   * `ttlMs` and returns it. Concurrent misses for the same key are deduped so
   * parallel requests never stampede the database.
   */
  async getOrSet<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;

    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const task = factory().then(
      (value) => {
        this.store.set(key, { expires: Date.now() + ttlMs, value });
        this.inflight.delete(key);
        this.pruneIfNeeded();
        return value;
      },
      (err) => {
        this.inflight.delete(key);
        throw err;
      },
    );
    this.inflight.set(key, task);
    return task;
  }

  /** Lazy sweep once the map grows; keeps memory bounded without timers. */
  private pruneIfNeeded() {
    if (this.store.size < CacheService.SOFT_LIMIT) return;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expires < now) this.store.delete(key);
    }
  }
}
