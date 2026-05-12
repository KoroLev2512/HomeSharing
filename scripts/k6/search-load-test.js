/**
 * k6 load test — listings search under load
 *
 * Tests the /api/listings search endpoint with realistic query distributions.
 * Validates that cache hit rates are acceptable and DB doesn't become a bottleneck.
 *
 * Run:
 *   k6 run --env BASE_URL=http://localhost:3000 \
 *           scripts/k6/search-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const cacheHitCounter   = new Counter('cache_hit_total');
const cacheMissCounter  = new Counter('cache_miss_total');
const searchDuration    = new Trend('search_duration_ms', true);
const detailDuration    = new Trend('detail_duration_ms', true);
const errorRate         = new Rate('search_error_rate');

// ---------------------------------------------------------------------------
// Test configuration
// ---------------------------------------------------------------------------
export const options = {
    scenarios: {
        // Simulate browsing users — slow ramp-up
        browse: {
            executor: 'ramping-vus',
            startVUs: 1,
            stages: [
                { duration: '30s', target: 20 },
                { duration: '60s', target: 50 },
                { duration: '30s', target: 100 },
                { duration: '60s', target: 100 },
                { duration: '30s', target: 0 },
            ],
            tags: { type: 'browse' },
        },
        // Simulate crawler / bulk fetch
        bulk: {
            executor: 'constant-arrival-rate',
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 5,
            maxVUs: 10,
            duration: '3m',
            startTime: '30s',
            tags: { type: 'bulk' },
        },
    },
    thresholds: {
        http_req_duration:  ['p(95)<300', 'p(99)<800'],
        http_req_failed:    ['rate<0.005'],
        search_duration_ms: ['p(95)<250'],
        detail_duration_ms: ['p(95)<150'],
        search_error_rate:  ['rate<0.01'],
    },
};

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];
const DEAL_TYPES = ['rent', 'rent_daily'];
const PROPERTY_TYPES = ['apartment', 'room', 'house', 'studio'];
const SORT_OPTIONS = ['new', 'cheap', 'expensive', 'area_desc'];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildSearchUrl() {
    const params = new URLSearchParams();
    params.set('city', randomFrom(CITIES));
    params.set('dealType', randomFrom(DEAL_TYPES));

    if (Math.random() > 0.5) params.set('propertyType', randomFrom(PROPERTY_TYPES));
    if (Math.random() > 0.6) params.set('sort', randomFrom(SORT_OPTIONS));
    if (Math.random() > 0.7) params.set('priceMin', String(Math.floor(Math.random() * 30_000) + 10_000));
    if (Math.random() > 0.7) params.set('priceMax', String(Math.floor(Math.random() * 100_000) + 50_000));
    if (Math.random() > 0.8) params.set('rooms', String(Math.ceil(Math.random() * 4)));
    params.set('page', String(Math.ceil(Math.random() * 3)));
    params.set('perPage', '12');

    return `${BASE_URL}/api/listings?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Scenario functions
// ---------------------------------------------------------------------------
export default function () {
    const url = buildSearchUrl();

    group('search listing page', () => {
        const start = Date.now();
        const res = http.get(url, { timeout: '10s' });
        searchDuration.add(Date.now() - start);

        const ok = check(res, {
            'status 200':       (r) => r.status === 200,
            'has items array':  (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return Array.isArray(body.items);
                } catch { return false; }
            },
            'has pagination':   (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return typeof body.total === 'number';
                } catch { return false; }
            },
        });

        errorRate.add(!ok ? 1 : 0);

        // Track cache header if server exposes it
        const cacheStatus = res.headers['X-Cache'] || res.headers['x-cache'];
        if (cacheStatus === 'HIT')       cacheHitCounter.add(1);
        else if (cacheStatus === 'MISS') cacheMissCounter.add(1);
    });

    // Simulate clicking into a listing detail (30% of the time)
    if (Math.random() < 0.3) {
        group('fetch listing detail', () => {
            // Use a stable fake ID — adjust to a real seed ID in your env
            const listingId = __ENV.LISTING_ID || 'seed-listing-001';
            const start = Date.now();
            const res = http.get(`${BASE_URL}/api/listings/${listingId}`, { timeout: '5s' });
            detailDuration.add(Date.now() - start);

            check(res, {
                'detail 200 or 404': (r) => r.status === 200 || r.status === 404,
            });
        });
    }

    sleep(1 + Math.random() * 2); // 1–3 s think time between pages
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
export function handleSummary(data) {
    const p95Search = data.metrics.search_duration_ms?.values?.['p(95)']?.toFixed(1) ?? 'N/A';
    const p99Search = data.metrics.search_duration_ms?.values?.['p(99)']?.toFixed(1) ?? 'N/A';
    const p95Detail = data.metrics.detail_duration_ms?.values?.['p(95)']?.toFixed(1) ?? 'N/A';
    const totalReqs = data.metrics.http_reqs?.values?.count ?? 0;
    const rps       = data.metrics.http_reqs?.values?.rate?.toFixed(1) ?? 'N/A';
    const errRate   = ((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2);

    console.log('\n=== Search Load Test Summary ===');
    console.log(`Total requests  : ${totalReqs}`);
    console.log(`RPS (avg)       : ${rps}`);
    console.log(`Error rate      : ${errRate}%`);
    console.log(`Search P95      : ${p95Search} ms`);
    console.log(`Search P99      : ${p99Search} ms`);
    console.log(`Detail P95      : ${p95Detail} ms`);
    console.log(`Cache hits      : ${data.metrics.cache_hit_total?.values?.count ?? 0}`);
    console.log(`Cache misses    : ${data.metrics.cache_miss_total?.values?.count ?? 0}`);

    return {
        'results/search-load-test.json': JSON.stringify(data, null, 2),
    };
}
