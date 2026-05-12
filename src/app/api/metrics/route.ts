/**
 * GET /api/metrics — Prometheus scrape endpoint
 *
 * Protected by METRICS_AUTH_TOKEN env var (Bearer token).
 * Configure prometheus.yml to pass the token in headers or params.
 */
import { NextResponse } from 'next/server';
import { metrics } from '@/shared/lib/metrics/prometheus';
import { cache } from '@/shared/lib/cache/redisCache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
    // Simple token auth for metrics endpoint
    const token = process.env.METRICS_AUTH_TOKEN;
    if (token) {
        const authHeader = req.headers.get('authorization') ?? '';
        const queryToken = new URL(req.url).searchParams.get('token') ?? '';
        if (authHeader !== `Bearer ${token}` && queryToken !== token) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    const body = metrics.toPrometheusText();
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}
