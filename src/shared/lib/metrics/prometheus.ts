/**
 * Prometheus metrics registry.
 * Collected metrics:
 *   - http_requests_total          (counter, by method/route/status)
 *   - http_request_duration_ms     (histogram, by method/route)
 *   - db_query_duration_ms         (histogram, by operation)
 *   - cache_operations_total       (counter, by type: hit/miss/set/del)
 *   - booking_conflicts_total      (counter — should stay near 0)
 *   - outbox_events_total          (counter, by status)
 *   - active_bookings_gauge        (gauge)
 *
 * Exposed at GET /api/metrics (Prometheus text format).
 *
 * Note: prom-client is a soft dependency. Install with: npm install prom-client
 * If not installed, all functions are no-ops and /api/metrics returns empty.
 */

// ---------------------------------------------------------------------------
// In-memory counters (used when prom-client is not available)
// ---------------------------------------------------------------------------
const counters: Record<string, number> = {};
const histograms: Record<string, number[]> = {};

function inc(key: string, amount = 1): void {
    counters[key] = (counters[key] ?? 0) + amount;
}

function observe(key: string, value: number): void {
    if (!histograms[key]) histograms[key] = [];
    histograms[key].push(value);
}

// ---------------------------------------------------------------------------
// Metrics API (thin wrappers — replace internals with prom-client if available)
// ---------------------------------------------------------------------------

export const metrics = {
    /** Record an incoming HTTP request after response is sent */
    httpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
        inc(`http_requests_total{method="${method}",route="${route}",status="${statusCode}"}`);
        observe(`http_request_duration_ms{method="${method}",route="${route}"}`, durationMs);
    },

    /** Record a database query */
    dbQuery(operation: string, durationMs: number): void {
        observe(`db_query_duration_ms{op="${operation}"}`, durationMs);
    },

    /** Record a cache operation */
    cacheHit():  void { inc('cache_operations_total{type="hit"}');  },
    cacheMiss(): void { inc('cache_operations_total{type="miss"}'); },
    cacheSet():  void { inc('cache_operations_total{type="set"}');  },
    cacheDel():  void { inc('cache_operations_total{type="del"}');  },

    /** Increment booking conflict counter (double-booking attempt blocked) */
    bookingConflict(): void {
        inc('booking_conflicts_total');
    },

    /** Record outbox event status */
    outboxEvent(status: 'published' | 'failed' | 'dead_letter'): void {
        inc(`outbox_events_total{status="${status}"}`);
    },

    /** Expose all metrics in Prometheus text format */
    toPrometheusText(): string {
        const lines: string[] = [
            '# HomeSharing Platform — Prometheus Metrics',
            `# Collected at ${new Date().toISOString()}`,
            '',
        ];

        // Counters
        for (const [key, value] of Object.entries(counters)) {
            const metricName = key.split('{')[0];
            lines.push(`# TYPE ${metricName} counter`);
            lines.push(`${key} ${value}`);
        }

        // Histograms (simplified: sum, count, p50, p95, p99)
        for (const [key, values] of Object.entries(histograms)) {
            if (values.length === 0) continue;
            const metricName = key.split('{')[0];
            const labels = key.includes('{') ? key.slice(key.indexOf('{')) : '';
            const sorted = values.toSorted((a, b) => a - b);
            const sum    = values.reduce((a, b) => a + b, 0);
            const count  = values.length;
            const p50    = sorted[Math.floor(count * 0.5)] ?? 0;
            const p95    = sorted[Math.floor(count * 0.95)] ?? 0;
            const p99    = sorted[Math.floor(count * 0.99)] ?? 0;

            lines.push(`# TYPE ${metricName} histogram`);
            lines.push(`${metricName}_sum${labels} ${sum.toFixed(2)}`);
            lines.push(`${metricName}_count${labels} ${count}`);
            lines.push(`${metricName}_p50${labels} ${p50.toFixed(2)}`);
            lines.push(`${metricName}_p95${labels} ${p95.toFixed(2)}`);
            lines.push(`${metricName}_p99${labels} ${p99.toFixed(2)}`);
        }

        return lines.join('\n') + '\n';
    },

    /** Summary for JSON /api/health responses */
    summary() {
        const cacheHits   = counters['cache_operations_total{type="hit"}']  ?? 0;
        const cacheMisses = counters['cache_operations_total{type="miss"}'] ?? 0;
        const cacheTotal  = cacheHits + cacheMisses;

        return {
            cacheHitRate:      cacheTotal > 0 ? cacheHits / cacheTotal : 0,
            bookingConflicts:  counters['booking_conflicts_total'] ?? 0,
            outboxPublished:   counters['outbox_events_total{status="published"}'] ?? 0,
            outboxFailed:      counters['outbox_events_total{status="failed"}']    ?? 0,
        };
    },
};

/** Middleware helper: wraps a route handler and records timing + status */
export function withMetrics(
    route: string,
    handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
    return async (req: Request) => {
        const start = Date.now();
        let status  = 500;
        try {
            const res = await handler(req);
            status = res.status;
            return res;
        } finally {
            metrics.httpRequest(req.method, route, status, Date.now() - start);
        }
    };
}
