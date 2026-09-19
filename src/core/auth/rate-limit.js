import { getRedis } from './kv.js';
import { Ratelimit } from '@upstash/ratelimit';
export function getPublicRateLimit(env) {
    return new Ratelimit({
        redis: getRedis(env),
        limiter: Ratelimit.slidingWindow(10, '10 s'),
        analytics: true,
        prefix: '@upstash/ratelimit/public',
    });
}
export function getAuthRateLimit(env) {
    return new Ratelimit({
        redis: getRedis(env),
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        analytics: true,
        prefix: '@upstash/ratelimit/auth',
    });
}
export async function checkRateLimit(limiter, ip = '127.0.0.1') {
    try {
        return await limiter.limit(ip);
    }
    catch (err) {
        console.warn('[RateLimit Error]:', err);
        // Fallback: Si el rate limit falla o no es compatible con el runtime local (Miniflare), permitimos la petición.
        return { success: true, limit: 10, remaining: 10, reset: Date.now() + 10000 };
    }
}
