/**
 * GET /api/health — liveness + readiness probe
 * Used by Docker HEALTHCHECK and load balancers.
 */
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { cache } from '@/shared/lib/cache/redisCache';
import { metrics } from '@/shared/lib/metrics/prometheus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
    const checks: Record<string, 'ok' | 'error'> = {};
    let healthy = true;

    // DB check
    try {
        await getServiceClient().from('hs_users').select('id').limit(1);
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
        healthy = false;
    }

    // Redis check
    try {
        checks.redis = (await cache.ping()) ? 'ok' : 'error';
    } catch {
        checks.redis = 'error';
        // Redis is optional — don't mark unhealthy
    }

    return NextResponse.json(
        {
            status:    healthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            checks,
            metrics:   metrics.summary(),
        },
        { status: healthy ? 200 : 503 },
    );
}
