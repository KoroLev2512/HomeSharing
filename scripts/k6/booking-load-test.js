/**
 * k6 load test — concurrent booking (double-booking prevention)
 *
 * Simulates N VUs racing to book the same property on the same dates.
 * Expected: exactly 1 booking created, all others receive 409 Conflict.
 *
 * Run:
 *   k6 run --env BASE_URL=http://localhost:3000 \
 *           --env AUTH_TOKEN=<jwt> \
 *           --env LISTING_ID=<uuid> \
 *           scripts/k6/booking-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const bookingCreated  = new Counter('booking_created_total');
const bookingConflict = new Counter('booking_conflict_total');
const bookingErrors   = new Counter('booking_error_total');
const bookingDuration = new Trend('booking_duration_ms', true);
const conflictRate    = new Rate('booking_conflict_rate');

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------
export const options = {
    scenarios: {
        // Phase 1: baseline — steady low traffic
        baseline: {
            executor: 'constant-vus',
            vus: 5,
            duration: '30s',
            tags: { phase: 'baseline' },
        },
        // Phase 2: spike — 50 VUs all race to book the same slot
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 50 },
                { duration: '30s', target: 50 },
                { duration: '10s', target: 0 },
            ],
            startTime: '35s',
            tags: { phase: 'spike' },
        },
        // Phase 3: sustained — realistic booking rate post-spike
        sustained: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            preAllocatedVUs: 10,
            maxVUs: 30,
            duration: '60s',
            startTime: '90s',
            tags: { phase: 'sustained' },
        },
    },
    thresholds: {
        // P95 response under 500 ms
        http_req_duration: ['p(95)<500'],
        // At least 99% of non-server-error responses
        http_req_failed:   ['rate<0.01'],
        // Booking duration P99 under 1 s
        booking_duration_ms: ['p(99)<1000'],
    },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:3000';
const TOKEN     = __ENV.AUTH_TOKEN;
const LISTING_ID = __ENV.LISTING_ID;

// Use a fixed date window far in the future so the test doesn't conflict
// with real data (adjust if your seed data uses different IDs).
const DATE_FROM = '2030-07-01';
const DATE_TO   = '2030-07-08';

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
    };
}

// ---------------------------------------------------------------------------
// Default scenario function
// ---------------------------------------------------------------------------
export default function () {
    if (!LISTING_ID) {
        console.error('LISTING_ID env var is required');
        return;
    }

    const payload = JSON.stringify({
        listingId:   LISTING_ID,
        startDate:   DATE_FROM,
        endDate:     DATE_TO,
        guestsCount: 2,
        notes:       'k6 load test booking',
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/bookings`, payload, {
        headers: authHeaders(),
        timeout: '10s',
    });
    bookingDuration.add(Date.now() - start);

    const ok = check(res, {
        'status is 201 or 409': (r) => r.status === 201 || r.status === 409,
        'not 500':              (r) => r.status !== 500,
        'response is JSON':     (r) => r.headers['Content-Type']?.includes('application/json') ?? false,
    });

    if (res.status === 201) {
        bookingCreated.add(1);
        conflictRate.add(0);
    } else if (res.status === 409) {
        bookingConflict.add(1);
        conflictRate.add(1);
    } else {
        bookingErrors.add(1);
        if (!ok) console.warn(`Unexpected status ${res.status}: ${res.body?.slice?.(0, 200)}`);
    }

    sleep(Math.random() * 0.5); // 0–500 ms jitter
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export function handleSummary(data) {
    const created  = data.metrics.booking_created_total?.values?.count ?? 0;
    const conflict = data.metrics.booking_conflict_total?.values?.count ?? 0;
    const errors   = data.metrics.booking_error_total?.values?.count ?? 0;
    const total    = created + conflict + errors;

    console.log('\n=== Booking Load Test Summary ===');
    console.log(`Total attempts : ${total}`);
    console.log(`Created (201)  : ${created}  (expected: 1 per unique date range)`);
    console.log(`Conflict (409) : ${conflict}`);
    console.log(`Errors (5xx)   : ${errors}`);
    console.log(`P95 duration   : ${data.metrics.booking_duration_ms?.values?.['p(95)']?.toFixed(1) ?? 'N/A'} ms`);
    console.log(`P99 duration   : ${data.metrics.booking_duration_ms?.values?.['p(99)']?.toFixed(1) ?? 'N/A'} ms`);

    if (errors > 0) {
        console.error(`FAILED: ${errors} server errors — check for unhandled race conditions`);
    }
    if (created > 1) {
        console.error(`FAILED: ${created} bookings created for same slot — DOUBLE BOOKING DETECTED`);
    }

    return {
        'results/booking-load-test.json': JSON.stringify(data, null, 2),
    };
}
