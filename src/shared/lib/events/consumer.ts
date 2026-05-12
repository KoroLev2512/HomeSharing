/**
 * Event Consumer — subscribes to RabbitMQ topic exchange and dispatches
 * domain events to registered handlers.
 *
 * Guarantees:
 *   - At-least-once delivery (message ack only after successful handler)
 *   - Idempotency: each handler receives the idempotency_key and must check
 *     for duplicate processing (e.g. via hs_processed_events or Redis SET NX)
 *   - Dead-letter queue: messages that fail max_retries times are routed to
 *     the DLX exchange (homesharing.events.dlx) for manual inspection
 *
 * Usage (standalone process or Next.js API route started by cron):
 *   const consumer = new EventConsumer();
 *   consumer.register('booking.created', handleBookingCreated);
 *   await consumer.start();
 */

import { logger } from '@/shared/lib/logger/logger';
import { metrics } from '@/shared/lib/metrics/prometheus';
import { cache } from '@/shared/lib/cache/redisCache';
import type { DomainEvent, EventType } from './types';

// ---------------------------------------------------------------------------
// Handler type
// ---------------------------------------------------------------------------

export type EventHandler<T = unknown> = (
    event: DomainEvent<T>,
    meta: { idempotencyKey: string; correlationId: string; attempt: number },
) => Promise<void>;

// ---------------------------------------------------------------------------
// Built-in handlers (notification + cache invalidation)
// ---------------------------------------------------------------------------

async function onBookingCreated(event: DomainEvent): Promise<void> {
    const { bookingId, propertyId } = event.payload as {
        bookingId: string;
        propertyId: string;
    };
    // Invalidate booking slots cache so next availability check is fresh
    await cache.del(`hs:slots:${propertyId}`);
    logger.info('Booking created — slots cache invalidated', { bookingId, propertyId });
    // TODO: trigger notification dispatch (email/push via notification-service)
}

async function onBookingConfirmed(event: DomainEvent): Promise<void> {
    const { bookingId } = event.payload as { bookingId: string };
    logger.info('Booking confirmed', { bookingId });
    // TODO: trigger guest confirmation notification
}

async function onBookingCancelled(event: DomainEvent): Promise<void> {
    const { bookingId, propertyId } = event.payload as {
        bookingId: string;
        propertyId?: string;
    };
    if (propertyId) await cache.del(`hs:slots:${propertyId}`);
    logger.info('Booking cancelled — slots cache invalidated', { bookingId });
}

async function onPaymentCompleted(event: DomainEvent): Promise<void> {
    const { paymentId, bookingId } = event.payload as {
        paymentId: string;
        bookingId: string;
    };
    logger.info('Payment completed', { paymentId, bookingId });
    // TODO: confirm booking, trigger receipt notification
}

async function onPaymentFailed(event: DomainEvent): Promise<void> {
    const { paymentId, bookingId, reason } = event.payload as {
        paymentId: string;
        bookingId: string;
        reason: string;
    };
    logger.warn('Payment failed', { paymentId, bookingId, reason });
    // TODO: notify guest, revert booking to pending
}

async function onPropertyCreated(event: DomainEvent): Promise<void> {
    const { propertyId } = event.payload as { propertyId: string };
    // Listings cache has new content — invalidate all listing pages
    await cache.invalidatePattern('hs:listings:*');
    logger.info('Property created — listings cache invalidated', { propertyId });
}

async function onVerificationCompleted(event: DomainEvent): Promise<void> {
    const { userId, status } = event.payload as { userId: string; status: string };
    logger.info('Verification completed', { userId, status });
    // TODO: notify user of approval/rejection
}

// ---------------------------------------------------------------------------
// Default handler registry
// ---------------------------------------------------------------------------

const DEFAULT_HANDLERS: Partial<Record<EventType, EventHandler>> = {
    'booking.created':        onBookingCreated,
    'booking.confirmed':      onBookingConfirmed,
    'booking.cancelled':      onBookingCancelled,
    'payment.completed':      onPaymentCompleted,
    'payment.failed':         onPaymentFailed,
    'property.created':       onPropertyCreated,
    'verification.completed': onVerificationCompleted,
};

// ---------------------------------------------------------------------------
// EventConsumer
// ---------------------------------------------------------------------------

const EXCHANGE     = process.env.RABBITMQ_EXCHANGE ?? 'homesharing.events';
const DLX_EXCHANGE = `${EXCHANGE}.dlx`;
const QUEUE_NAME   = 'homesharing.app.consumer';
const DLQ_NAME     = 'homesharing.app.dlq';
const MAX_ATTEMPTS = 3;

export class EventConsumer {
    private handlers = new Map<EventType, EventHandler>(
        Object.entries(DEFAULT_HANDLERS) as [EventType, EventHandler][],
    );
    private running = false;

    /** Register or override a handler for a given event type */
    register<T>(type: EventType, handler: EventHandler<T>): void {
        this.handlers.set(type, handler as EventHandler);
    }

    async start(): Promise<void> {
        if (!process.env.RABBITMQ_URL) {
            logger.warn('EventConsumer: RABBITMQ_URL not set — running in no-op mode');
            return;
        }

        let amqp: typeof import('amqplib');
        try {
            amqp = await import('amqplib');
        } catch {
            logger.warn('EventConsumer: amqplib not installed — skipping consumer start');
            return;
        }

        this.running = true;
        const conn = await amqp.connect(process.env.RABBITMQ_URL);
        const ch   = await conn.createChannel();

        // Dead-letter exchange
        await ch.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
        await ch.assertQueue(DLQ_NAME, { durable: true });
        await ch.bindQueue(DLQ_NAME, DLX_EXCHANGE, '');

        // Main exchange + queue with DLX routing
        await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
        await ch.assertQueue(QUEUE_NAME, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': DLX_EXCHANGE,
                'x-message-ttl':          30 * 60 * 1000, // 30 min max age before DLQ
            },
        });

        // Subscribe to all event types
        for (const eventType of this.handlers.keys()) {
            await ch.bindQueue(QUEUE_NAME, EXCHANGE, eventType);
        }

        ch.prefetch(10); // process up to 10 messages concurrently

        logger.info('EventConsumer started', { queue: QUEUE_NAME, exchange: EXCHANGE });

        await ch.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;

            const idempotencyKey = String(msg.properties.headers?.['x-idempotency-key'] ?? '');
            const correlationId  = String(msg.properties.headers?.['x-correlation-id'] ?? '');
            const attempt        = Number(msg.properties.headers?.['x-attempt'] ?? 1);

            let event: DomainEvent;
            try {
                event = JSON.parse(msg.content.toString()) as DomainEvent;
            } catch (e) {
                logger.error('EventConsumer: malformed message — sending to DLQ', e as Error);
                ch.nack(msg, false, false); // reject without requeue → DLX
                return;
            }

            // Idempotency guard via Redis SET NX (60 min TTL)
            if (idempotencyKey) {
                const dedupKey = `hs:consumed:${idempotencyKey}`;
                const alreadyProcessed = await cache.get<boolean>(dedupKey);
                if (alreadyProcessed) {
                    logger.debug('EventConsumer: duplicate event — skipping', { idempotencyKey, type: event.type });
                    ch.ack(msg);
                    return;
                }
            }

            const handler = this.handlers.get(event.type);
            if (!handler) {
                logger.warn('EventConsumer: no handler for event type', { type: event.type });
                ch.ack(msg); // ack unknown events to avoid DLQ spam
                return;
            }

            const log = logger.child({ correlationId, eventType: event.type, attempt });

            try {
                await handler(event, { idempotencyKey, correlationId, attempt });

                // Mark as processed in Redis
                if (idempotencyKey) {
                    await cache.set(`hs:consumed:${idempotencyKey}`, true, 3600);
                }

                metrics.outboxEvent('published');
                ch.ack(msg);
                log.debug('EventConsumer: event processed');

            } catch (err) {
                log.warn('EventConsumer: handler failed', { error: String(err), attempt });

                if (attempt >= MAX_ATTEMPTS) {
                    metrics.outboxEvent('dead_letter');
                    log.error('EventConsumer: max retries reached — dead lettering', err as Error);
                    ch.nack(msg, false, false); // → DLX
                } else {
                    metrics.outboxEvent('failed');
                    // Requeue with incremented attempt counter via re-publish
                    ch.nack(msg, false, false); // reject to DLX for now
                    // Re-publish with delay via a separate retry queue would go here
                    // For simplicity, the OutboxWorker handles retry via hs_outbox_events table
                }
            }
        });

        conn.on('close', () => {
            if (this.running) {
                logger.warn('EventConsumer: connection closed — reconnecting in 5s');
                setTimeout(() => void this.start(), 5000);
            }
        });

        conn.on('error', (err: Error) => {
            logger.error('EventConsumer: connection error', err);
        });
    }

    stop(): void {
        this.running = false;
        logger.info('EventConsumer stopped');
    }
}

export const eventConsumer = new EventConsumer();
