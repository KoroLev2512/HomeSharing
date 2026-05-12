/**
 * POST /api/worker/outbox — triggered by cron (Vercel Cron / pg_cron HTTP call / external scheduler)
 *
 * Processes one batch of pending outbox events and forwards them to RabbitMQ.
 * Returns the count of processed events so the scheduler can monitor queue depth.
 *
 * Security: protected by WORKER_SECRET env var (Bearer token).
 * Configure cron to send: Authorization: Bearer <WORKER_SECRET>
 *
 * Example cron (vercel.json):
 *   { "path": "/api/worker/outbox", "schedule": "* * * * *" }
 *
 * Example pg_cron (every minute):
 *   SELECT cron.schedule('outbox-worker', '* * * * *',
 *     $$SELECT net.http_post('https://your-app/api/worker/outbox',
 *       headers := '{"Authorization":"Bearer <token>"}')$$);
 */

import { NextResponse } from 'next/server';
import { OutboxWorker } from '@/shared/lib/events/publisher';
import { logger } from '@/shared/lib/logger/logger';
import { metrics } from '@/shared/lib/metrics/prometheus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55; // just under Vercel's 60s cron limit

const worker = new OutboxWorker({ pollIntervalMs: 0, batchSize: 50 });

export async function POST(req: Request): Promise<NextResponse> {
    // Auth check
    const secret = process.env.WORKER_SECRET;
    if (secret) {
        const auth = req.headers.get('authorization') ?? '';
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const start = Date.now();
    try {
        const processed = await worker.processBatch();
        const durationMs = Date.now() - start;

        logger.info('Outbox worker batch complete', { processed, durationMs });
        metrics.httpRequest('POST', '/api/worker/outbox', 200, durationMs);

        return NextResponse.json({ processed, durationMs }, { status: 200 });
    } catch (err) {
        const durationMs = Date.now() - start;
        logger.error('Outbox worker batch failed', err as Error);
        metrics.httpRequest('POST', '/api/worker/outbox', 500, durationMs);
        return NextResponse.json({ error: 'Worker failed', detail: String(err) }, { status: 500 });
    }
}

// Health check — confirms route is reachable without running a batch
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({ status: 'ready' });
}
