/**
 * Redis Cache Service — Cache-Aside pattern implementation.
 *
 * Install dependency first:  npm install ioredis
 *
 * Strategy:
 *   - get(): check cache → if miss, fetch from DB → store in cache → return
 *   - invalidate(): delete key(s) on write operations
 *   - Graceful degradation: if Redis is unavailable, all operations are no-ops
 *     and the DB is queried directly (no crash, just slower)
 *
 * Key namespaces:
 *   listings:{hash}          — property list pages (300s TTL)
 *   property:{id}            — single property (600s TTL)
 *   session:{userId}         — user session data (86400s TTL)
 *   search:{hash}            — search result pages (120s TTL)
 *   booking_slots:{propId}   — booked date ranges (60s TTL)
 */

import { logger } from '@/shared/lib/logger/logger';

// Lazy import to avoid import errors when ioredis is not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;
let connectionAttempted = false;

async function getClient(): Promise<any | null> {
    if (!process.env.REDIS_URL) return null;
    if (connectionAttempted) return redisClient;

    connectionAttempted = true;
    try {
        const { default: Redis } = await import('ioredis');
        const client = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: 3000,
            lazyConnect: true,
        });

        client.on('error', (err: Error) => {
            logger.warn('Redis connection error (cache degraded)', { error: err.message });
        });

        await client.connect();
        redisClient = client;
        logger.info('Redis connected', { url: process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@') });
    } catch (err) {
        logger.warn('Redis unavailable — running without cache', { error: String(err) });
        redisClient = null;
    }

    return redisClient;
}

// Default TTLs in seconds
export const TTL = {
    listings:     Number(process.env.REDIS_TTL_LISTINGS) || 300,
    property:     Number(process.env.REDIS_TTL_PROPERTY) || 600,
    session:      Number(process.env.REDIS_TTL_SESSION)  || 86400,
    search:       120,
    bookingSlots: 60,
} as const;

export const CachePrefix = {
    listings:     'hs:listings:',
    property:     'hs:property:',
    session:      'hs:session:',
    search:       'hs:search:',
    bookingSlots: 'hs:slots:',
    metrics:      'hs:metrics:',
} as const;

/** Simple deterministic hash for cache keys from query objects */
export function hashQuery(obj: Record<string, unknown>): string {
    const sorted = Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, k) => {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') acc[k] = obj[k];
        return acc;
    }, {});
    return Buffer.from(JSON.stringify(sorted)).toString('base64url').slice(0, 32);
}

class CacheService {
    async get<T>(key: string): Promise<T | null> {
        const client = await getClient();
        if (!client) return null;

        try {
            const raw = await client.get(key);
            if (!raw) return null;
            return JSON.parse(raw) as T;
        } catch (err) {
            logger.warn('Cache GET failed', { key, error: String(err) });
            return null;
        }
    }

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        const client = await getClient();
        if (!client) return;

        try {
            await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            logger.warn('Cache SET failed', { key, error: String(err) });
        }
    }

    async del(...keys: string[]): Promise<void> {
        const client = await getClient();
        if (!client || keys.length === 0) return;

        try {
            await client.del(...keys);
        } catch (err) {
            logger.warn('Cache DEL failed', { keys, error: String(err) });
        }
    }

    /** Delete all keys matching a pattern (e.g. 'hs:listings:*') */
    async invalidatePattern(pattern: string): Promise<void> {
        const client = await getClient();
        if (!client) return;

        try {
            const keys: string[] = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
                logger.debug('Cache invalidated by pattern', { pattern, count: keys.length });
            }
        } catch (err) {
            logger.warn('Cache pattern invalidation failed', { pattern, error: String(err) });
        }
    }

    /**
     * Cache-aside helper: get from cache, or call loader and store result.
     *
     * @example
     * const listing = await cache.getOrSet(
     *   `${CachePrefix.property}${id}`,
     *   TTL.property,
     *   () => ListingsRepo.getById(id),
     * );
     */
    async getOrSet<T>(
        key: string,
        ttlSeconds: number,
        loader: () => Promise<T>,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            metrics.cacheHits++;
            return cached;
        }

        metrics.cacheMisses++;
        const value = await loader();
        if (value !== null && value !== undefined) {
            await this.set(key, value, ttlSeconds);
        }
        return value;
    }

    /** Track cache metrics for Prometheus */
    getMetrics() {
        return { ...metrics };
    }

    async ping(): Promise<boolean> {
        const client = await getClient();
        if (!client) return false;
        try {
            const res = await client.ping();
            return res === 'PONG';
        } catch {
            return false;
        }
    }
}

const metrics = { cacheHits: 0, cacheMisses: 0 };

export const cache = new CacheService();
