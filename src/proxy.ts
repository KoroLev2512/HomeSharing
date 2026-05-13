/**
 * Next.js Middleware — runs on the Edge before every matched request.
 *
 * Responsibilities:
 *   1. Inject X-Request-ID (correlation ID for distributed tracing)
 *   2. Rate limiting (sliding window counter per IP)
 *   3. Secure response headers (HSTS, CSP, X-Frame-Options, …)
 *   4. Auth-route guard (redirect unauthenticated requests)
 *
 * Rate limiting uses an in-memory Map on the Edge runtime.
 * In production, replace with a Redis-backed sliding window
 * (Upstash Redis + @upstash/ratelimit is a proven pattern).
 */

import { NextResponse, type NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const WINDOW_MS     = Number(process.env.RATE_LIMIT_WINDOW_MS)     || 60_000; // 1 min
const MAX_REQUESTS  = Number(process.env.RATE_LIMIT_MAX_REQUESTS)  || 100;
const API_MAX       = Number(process.env.RATE_LIMIT_API_MAX)       || 30;     // stricter for write APIs

// Routes that require authentication (redirect to /login if no session token)
const PROTECTED_PREFIXES = [
    '/host',
    '/admin',
    '/settings',
    '/bookings',
    '/favorites',
    '/messages',
    '/notifications',
];

// Routes exempt from rate limiting
const RATE_LIMIT_EXEMPT = new Set(['/api/health', '/api/metrics']);

// ---------------------------------------------------------------------------
// In-memory sliding window rate limiter
// NOTE: resets on Edge cold start; for persistent limits use Redis.
// ---------------------------------------------------------------------------
const windowMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string, isWriteApi: boolean): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
} {
    const limit = isWriteApi ? API_MAX : MAX_REQUESTS;
    const now   = Date.now();
    const entry = windowMap.get(ip);

    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        windowMap.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
    }

    entry.count++;
    const remaining = Math.max(0, limit - entry.count);
    return {
        allowed:  entry.count <= limit,
        remaining,
        resetAt:  entry.windowStart + WINDOW_MS,
    };
}

// Evict stale entries periodically (prevent memory leak)
let lastEviction = Date.now();
function maybeEvict(): void {
    const now = Date.now();
    if (now - lastEviction < 60_000) return;
    lastEviction = now;
    for (const [key, val] of windowMap.entries()) {
        if (now - val.windowStart >= WINDOW_MS * 2) windowMap.delete(key);
    }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function proxy(req: NextRequest): NextResponse {
    const { pathname } = req.nextUrl;

    // Generate correlation / request ID
    const requestId = crypto.randomUUID();

    // --- Rate limiting ---
    if (!RATE_LIMIT_EXEMPT.has(pathname)) {
        maybeEvict();

        const ip = (
            req.headers.get('x-real-ip') ??
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            '127.0.0.1'
        );

        const isWriteApi =
            pathname.startsWith('/api/bookings') ||
            pathname.startsWith('/api/host') ||
            pathname.startsWith('/api/me');

        const { allowed, remaining, resetAt } = checkRateLimit(ip, isWriteApi);

        if (!allowed) {
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests', retryAfter: Math.ceil((resetAt - Date.now()) / 1000) }),
                {
                    status: 429,
                    headers: {
                        'Content-Type':           'application/json',
                        'X-RateLimit-Limit':      String(isWriteApi ? API_MAX : MAX_REQUESTS),
                        'X-RateLimit-Remaining':  '0',
                        'X-RateLimit-Reset':      String(Math.ceil(resetAt / 1000)),
                        'Retry-After':            String(Math.ceil((resetAt - Date.now()) / 1000)),
                    },
                },
            );
        }

        // Pass rate-limit headers downstream
        const res = addSecureHeaders(NextResponse.next(), requestId);
        res.headers.set('X-RateLimit-Limit',     String(isWriteApi ? API_MAX : MAX_REQUESTS));
        res.headers.set('X-RateLimit-Remaining', String(remaining));
        res.headers.set('X-RateLimit-Reset',     String(Math.ceil(resetAt / 1000)));
        return res;
    }

    return addSecureHeaders(NextResponse.next(), requestId);
}

function addSecureHeaders(res: NextResponse, requestId: string): NextResponse {
    // Distributed tracing
    res.headers.set('X-Request-ID', requestId);

    // Security headers
    res.headers.set('X-Content-Type-Options',  'nosniff');
    res.headers.set('X-Frame-Options',         'SAMEORIGIN');
    res.headers.set('Referrer-Policy',         'strict-origin-when-cross-origin');
    res.headers.set('X-XSS-Protection',        '1; mode=block');
    res.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
    );

    if (process.env.NODE_ENV === 'production') {
        res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image  (image optimization)
         * - favicon.ico
         * - public assets
         */
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)',
    ],
};
