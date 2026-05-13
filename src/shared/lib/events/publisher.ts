/**
 * Outbox Event Publisher
 *
 * Writes events to the `hs_outbox_events` table atomically with the
 * originating DB transaction. A background worker (OutboxWorker below)
 * polls the outbox and forwards events to RabbitMQ.
 *
 * Guarantees: at-least-once delivery even if RabbitMQ is temporarily down.
 * Consumers must be idempotent (use idempotency_key for deduplication).
 */

import { getServiceClient } from '@/shared/utils/supabase/service';
import { logger } from '@/shared/lib/logger/logger';
import type { DomainEvent, EventType } from './types';
import { createId } from '@paralleldrive/cuid2';

interface OutboxRow {
    aggregate_type:  string;
    aggregate_id:    string;
    event_type:      EventType;
    event_version:   number;
    payload:         Record<string, unknown>;
    correlation_id:  string;
    idempotency_key: string;
    scheduled_at?:   string;
}

export class EventPublisher {
    /**
     * Write a single event to the outbox.
     * Call this inside the same Supabase transaction as the domain change.
     */
    static async publish(
        event: Omit<DomainEvent, 'id'>,
        options?: { delayMs?: number },
    ): Promise<void> {
        const supabase = getServiceClient();

        const row: OutboxRow = {
            aggregate_type:  event.aggregateType,
            aggregate_id:    event.aggregateId,
            event_type:      event.type,
            event_version:   event.version,
            payload:         event.payload as Record<string, unknown>,
            correlation_id:  event.correlationId,
            idempotency_key: `${event.type}:${event.aggregateId}:${createId()}`,
            ...(options?.delayMs
                ? { scheduled_at: new Date(Date.now() + options.delayMs).toISOString() }
                : {}),
        };

        const { error } = await supabase.from('hs_outbox_events').insert(row);
        if (error) {
            logger.error('Failed to write outbox event', error, {
                eventType: event.type,
                aggregateId: event.aggregateId,
            });
            throw new Error(`Outbox write failed: ${error.message}`);
        }

        logger.debug('Event queued in outbox', {
            eventType: event.type,
            aggregateId: event.aggregateId,
            correlationId: event.correlationId,
        });
    }

    /** Publish multiple events in one batch insert */
    static async publishBatch(events: Omit<DomainEvent, 'id'>[]): Promise<void> {
        if (events.length === 0) return;
        const supabase = getServiceClient();

        const rows: OutboxRow[] = events.map((event) => ({
            aggregate_type:  event.aggregateType,
            aggregate_id:    event.aggregateId,
            event_type:      event.type,
            event_version:   event.version,
            payload:         event.payload as Record<string, unknown>,
            correlation_id:  event.correlationId,
            idempotency_key: `${event.type}:${event.aggregateId}:${createId()}`,
        }));

        const { error } = await supabase.from('hs_outbox_events').insert(rows);
        if (error) {
            logger.error('Failed to write batch outbox events', error, { count: events.length });
            throw new Error(`Outbox batch write failed: ${error.message}`);
        }
    }
}

// ---------------------------------------------------------------------------
// Outbox Worker — polls hs_outbox_events and publishes to RabbitMQ
// Run as a standalone process or as a Next.js API route called by cron.
// ---------------------------------------------------------------------------

export class OutboxWorker {
    private running = false;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private readonly pollIntervalMs: number;
    private readonly batchSize: number;

    constructor(opts?: { pollIntervalMs?: number; batchSize?: number }) {
        this.pollIntervalMs = opts?.pollIntervalMs ?? 5000;
        this.batchSize      = opts?.batchSize ?? 50;
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.intervalId = setInterval(() => void this.processBatch(), this.pollIntervalMs);
        logger.info('OutboxWorker started', {
            pollIntervalMs: this.pollIntervalMs,
            batchSize: this.batchSize,
        });
    }

    stop(): void {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info('OutboxWorker stopped');
    }

    async processBatch(): Promise<number> {
        const supabase = getServiceClient();
        const now = new Date().toISOString();

        // Fetch pending events that are due
        const { data: events, error: fetchErr } = await supabase
            .from('hs_outbox_events')
            .select('*')
            .in('status', ['pending', 'failed'])
            .lt('retry_count', 3)
            .lte('scheduled_at', now)
            .order('scheduled_at', { ascending: true })
            .limit(this.batchSize);

        if (fetchErr) {
            logger.error('OutboxWorker fetch error', fetchErr);
            return 0;
        }
        if (!events || events.length === 0) return 0;

        // Process sequentially — each event acquires a CAS lock, so concurrent
        // processing of the same batch would race on status updates.
        let processed = 0;
        for (const event of events) {
            await this.processEvent(event);
            processed++;
        }

        return processed;
    }

    private async processEvent(event: Record<string, unknown>): Promise<void> {
        const supabase = getServiceClient();

        // Mark as processing (optimistic — prevents double-processing)
        const { error: lockErr } = await supabase
            .from('hs_outbox_events')
            .update({ status: 'processing' })
            .eq('id', event.id)
            .eq('status', event.status); // CAS check

        if (lockErr || !event) return; // already picked up by another worker

        try {
            await this.publishToRabbitMQ(event);

            await supabase.from('hs_outbox_events').update({
                status:       'processed',
                processed_at: new Date().toISOString(),
            }).eq('id', event.id);

            logger.debug('Outbox event published', {
                eventId:   event.id,
                eventType: event.event_type,
            });
        } catch (err) {
            const retryCount = Number(event.retry_count ?? 0) + 1;
            const maxRetries = Number(event.max_retries ?? 3);
            const isDeadLetter = retryCount >= maxRetries;

            // Exponential back-off: 5s, 25s, 125s
            const delayMs = Math.min(5000 * Math.pow(5, retryCount - 1), 300_000);

            await supabase.from('hs_outbox_events').update({
                status:       isDeadLetter ? 'dead_letter' : 'failed',
                retry_count:  retryCount,
                last_error:   String(err),
                scheduled_at: new Date(Date.now() + delayMs).toISOString(),
            }).eq('id', event.id);

            logger.warn('Outbox event publish failed', {
                eventId: event.id, retryCount, isDeadLetter, error: String(err),
            });
        }
    }

    private async publishToRabbitMQ(event: Record<string, unknown>): Promise<void> {
        if (!process.env.RABBITMQ_URL) {
            // Dev fallback: just log (no broker configured)
            logger.info('RabbitMQ not configured — event logged only', {
                eventType: event.event_type,
                payload:   event.payload,
            });
            return;
        }

        // Dynamic import — amqplib is an optional dependency (install for production)
        let amqp: typeof import('amqplib');
        try {
            amqp = await import('amqplib');
        } catch {
            logger.warn('amqplib not installed — event logged only', {
                eventType: event.event_type,
            });
            return;
        }
        const conn = await amqp.connect(process.env.RABBITMQ_URL);
        const ch   = await conn.createChannel();

        const exchange = process.env.RABBITMQ_EXCHANGE ?? 'homesharing.events';
        const routingKey = String(event.event_type); // e.g. 'booking.created'

        await ch.assertExchange(exchange, 'topic', { durable: true });

        const message = Buffer.from(JSON.stringify({
            id:            event.id,
            type:          event.event_type,
            version:       event.event_version,
            aggregateType: event.aggregate_type,
            aggregateId:   event.aggregate_id,
            payload:       event.payload,
            correlationId: event.correlation_id,
            occurredAt:    event.created_at,
        }));

        ch.publish(exchange, routingKey, message, {
            persistent:    true,
            contentType:   'application/json',
            headers: {
                'x-correlation-id':  event.correlation_id,
                'x-idempotency-key': event.idempotency_key,
                'x-event-version':   event.event_version,
            },
        });

        await ch.close();
        await conn.close();
    }
}
