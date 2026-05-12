/**
 * Domain event type definitions.
 * Every event carries a correlationId (distributed trace), version (schema evolution),
 * and occurredAt timestamp for ordering guarantees.
 */

export type EventType =
    | 'booking.created'
    | 'booking.confirmed'
    | 'booking.cancelled'
    | 'booking.completed'
    | 'payment.completed'
    | 'payment.failed'
    | 'property.created'
    | 'property.updated'
    | 'property.deleted'
    | 'verification.completed'
    | 'notification.created'
    | 'user.registered';

export interface DomainEvent<T = unknown> {
    /** Unique event ID (UUID) — used for idempotency checks */
    id:            string;
    /** Event type discriminator */
    type:          EventType;
    /** Schema version — increment when payload shape changes */
    version:       number;
    /** Domain aggregate this event belongs to */
    aggregateType: string;
    aggregateId:   string;
    /** Event payload (typed per event type below) */
    payload:       T;
    /** Distributed tracing: links events across services */
    correlationId: string;
    /** Wall-clock time the domain change occurred */
    occurredAt:    string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Payload types per event
// ---------------------------------------------------------------------------

export interface BookingCreatedPayload {
    bookingId:   string;
    propertyId:  string;
    guestId:     string;
    hostId:      string;
    dateFrom:    string;
    dateTo:      string;
    totalPrice:  number;
    currency:    string;
}

export interface BookingStatusChangedPayload {
    bookingId:   string;
    fromStatus:  string;
    toStatus:    string;
    changedBy:   string;
    reason?:     string;
}

export interface PaymentCompletedPayload {
    paymentId:   string;
    bookingId:   string;
    userId:      string;
    amount:      number;
    currency:    string;
    externalId?: string;
}

export interface PaymentFailedPayload {
    paymentId:  string;
    bookingId:  string;
    userId:     string;
    reason:     string;
}

export interface PropertyCreatedPayload {
    propertyId: string;
    ownerId:    string;
    dealType:   string;
    city:       string;
}

export interface VerificationCompletedPayload {
    userId:   string;
    status:   'approved' | 'rejected';
    reason?:  string;
}

export interface NotificationCreatedPayload {
    notificationId: string;
    userId:         string;
    type:           string;
    title:          string;
}

// ---------------------------------------------------------------------------
// Typed event factories
// ---------------------------------------------------------------------------

export const Events = {
    bookingCreated(payload: BookingCreatedPayload, correlationId: string): Omit<DomainEvent<BookingCreatedPayload>, 'id'> {
        return {
            type: 'booking.created', version: 1,
            aggregateType: 'booking', aggregateId: payload.bookingId,
            payload, correlationId, occurredAt: new Date().toISOString(),
        };
    },
    bookingConfirmed(payload: BookingStatusChangedPayload, correlationId: string): Omit<DomainEvent<BookingStatusChangedPayload>, 'id'> {
        return {
            type: 'booking.confirmed', version: 1,
            aggregateType: 'booking', aggregateId: payload.bookingId,
            payload, correlationId, occurredAt: new Date().toISOString(),
        };
    },
    bookingCancelled(payload: BookingStatusChangedPayload, correlationId: string): Omit<DomainEvent<BookingStatusChangedPayload>, 'id'> {
        return {
            type: 'booking.cancelled', version: 1,
            aggregateType: 'booking', aggregateId: payload.bookingId,
            payload, correlationId, occurredAt: new Date().toISOString(),
        };
    },
    paymentCompleted(payload: PaymentCompletedPayload, correlationId: string): Omit<DomainEvent<PaymentCompletedPayload>, 'id'> {
        return {
            type: 'payment.completed', version: 1,
            aggregateType: 'payment', aggregateId: payload.paymentId,
            payload, correlationId, occurredAt: new Date().toISOString(),
        };
    },
    propertyCreated(payload: PropertyCreatedPayload, correlationId: string): Omit<DomainEvent<PropertyCreatedPayload>, 'id'> {
        return {
            type: 'property.created', version: 1,
            aggregateType: 'property', aggregateId: payload.propertyId,
            payload, correlationId, occurredAt: new Date().toISOString(),
        };
    },
} as const;
