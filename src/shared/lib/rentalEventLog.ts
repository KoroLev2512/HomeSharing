/**
 * Rental Event Log — сервис аудит-журнала событий аренды (§3.4 диплома).
 *
 * Записывает каждое значимое доменное событие в таблицу rental_event_log.
 * Атрибуты соответствуют Таблице 4 диплома Королёва Ю.А.
 */

import { getServiceClient } from '@/shared/utils/supabase/service';
import type { EventType } from '@/shared/lib/events/types';
import { createId } from '@paralleldrive/cuid2';

// ── Interpretation statuses (§4.2, §3.4) ────────────────────────────────────

export type InterpretationStatus =
    | 'verified'
    | 'not_verified'
    | 'inconclusive'
    | 'technical_failure'
    | 'manual_review_required';

export type NormalizationStatus =
    | 'ok'
    | 'invalid_format'
    | 'ambiguous'
    | 'missing_fields';

// ── Event log entry ──────────────────────────────────────────────────────────

export interface RentalEventEntry {
    eventType:           EventType;
    aggregateType:       'booking' | 'listing' | 'user' | 'access' | 'verification';
    aggregateId:         string;
    correlationId?:      string;
    traceId?:            string;
    actorUserId?:        string;
    subjectUserId?:      string;
    payload?:            Record<string, unknown>;

    // Верификационные поля (Таблица 4)
    verificationId?:     string;
    cadastralNumber?:    string;
    normalizationStatus?: NormalizationStatus;
    interpretationStatus?: InterpretationStatus;
    interpretationReason?: string;
    requiresManualReview?: boolean;
    policyVersion?:      string;

    // IoT поля (§4.3)
    deviceId?:           string;
    accessScope?:        'guest' | 'host' | 'service';

    sourceService?:      string;
    occurredAt?:         string;
}

export interface RentalEventRow {
    id:                   string;
    event_type:           string;
    aggregate_type:       string;
    aggregate_id:         string;
    correlation_id:       string;
    trace_id:             string | null;
    actor_user_id:        string | null;
    subject_user_id:      string | null;
    payload:              Record<string, unknown>;
    verification_id:      string | null;
    cadastral_number:     string | null;
    normalization_status: string | null;
    interpretation_status: string | null;
    interpretation_reason: string | null;
    requires_manual_review: boolean;
    policy_version:       string | null;
    device_id:            string | null;
    access_scope:         string | null;
    source_service:       string;
    occurred_at:          string;
    created_at:           string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class RentalEventLog {
    /**
     * Записывает одно событие в аудит-журнал.
     * Не бросает исключений — ошибки логируются, но не прерывают основной поток.
     */
    static async write(entry: RentalEventEntry): Promise<void> {
        const supabase = getServiceClient();
        const correlationId = entry.correlationId ?? createId();

        const row = {
            event_type:            entry.eventType,
            aggregate_type:        entry.aggregateType,
            aggregate_id:          entry.aggregateId,
            correlation_id:        correlationId,
            trace_id:              entry.traceId ?? null,
            actor_user_id:         entry.actorUserId ?? null,
            subject_user_id:       entry.subjectUserId ?? null,
            payload:               entry.payload ?? {},
            verification_id:       entry.verificationId ?? null,
            cadastral_number:      entry.cadastralNumber ?? null,
            normalization_status:  entry.normalizationStatus ?? null,
            interpretation_status: entry.interpretationStatus ?? null,
            interpretation_reason: entry.interpretationReason ?? null,
            requires_manual_review: entry.requiresManualReview ?? false,
            policy_version:        entry.policyVersion ?? 'v1',
            device_id:             entry.deviceId ?? null,
            access_scope:          entry.accessScope ?? null,
            source_service:        entry.sourceService ?? 'web-bff',
            occurred_at:           entry.occurredAt ?? new Date().toISOString(),
        };

        const { error } = await supabase.from('rental_event_log').insert(row);
        if (error) {
            console.error('[RentalEventLog] Failed to write event', {
                eventType: entry.eventType,
                aggregateId: entry.aggregateId,
                error: error.message,
            });
        }
    }

    /**
     * Пакетная запись нескольких событий.
     */
    static async writeBatch(entries: RentalEventEntry[]): Promise<void> {
        if (entries.length === 0) return;
        const supabase = getServiceClient();

        const rows = entries.map((entry) => ({
            event_type:            entry.eventType,
            aggregate_type:        entry.aggregateType,
            aggregate_id:          entry.aggregateId,
            correlation_id:        entry.correlationId ?? createId(),
            trace_id:              entry.traceId ?? null,
            actor_user_id:         entry.actorUserId ?? null,
            subject_user_id:       entry.subjectUserId ?? null,
            payload:               entry.payload ?? {},
            verification_id:       entry.verificationId ?? null,
            cadastral_number:      entry.cadastralNumber ?? null,
            normalization_status:  entry.normalizationStatus ?? null,
            interpretation_status: entry.interpretationStatus ?? null,
            interpretation_reason: entry.interpretationReason ?? null,
            requires_manual_review: entry.requiresManualReview ?? false,
            policy_version:        entry.policyVersion ?? 'v1',
            device_id:             entry.deviceId ?? null,
            access_scope:          entry.accessScope ?? null,
            source_service:        entry.sourceService ?? 'web-bff',
            occurred_at:           entry.occurredAt ?? new Date().toISOString(),
        }));

        const { error } = await supabase.from('rental_event_log').insert(rows);
        if (error) {
            console.error('[RentalEventLog] Failed to write batch events', {
                count: entries.length,
                error: error.message,
            });
        }
    }

    /**
     * Получить события по агрегату (для страницы истории бронирования).
     */
    static async getByAggregate(
        aggregateType: string,
        aggregateId: string,
        limit = 50,
    ): Promise<RentalEventRow[]> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('rental_event_log')
            .select('*')
            .eq('aggregate_type', aggregateType)
            .eq('aggregate_id', aggregateId)
            .order('occurred_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[RentalEventLog] getByAggregate error', error.message);
            return [];
        }
        return (data ?? []) as RentalEventRow[];
    }

    /**
     * Получить все события (для admin-страницы).
     */
    static async list(params?: {
        eventType?: string;
        aggregateType?: string;
        actorUserId?: string;
        interpretationStatus?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ items: RentalEventRow[]; total: number }> {
        const supabase = getServiceClient();
        const limit = params?.limit ?? 30;
        const offset = params?.offset ?? 0;

        let q = supabase
            .from('rental_event_log')
            .select('*', { count: 'exact' })
            .order('occurred_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (params?.eventType) q = q.eq('event_type', params.eventType);
        if (params?.aggregateType) q = q.eq('aggregate_type', params.aggregateType);
        if (params?.actorUserId) q = q.eq('actor_user_id', params.actorUserId);
        if (params?.interpretationStatus) q = q.eq('interpretation_status', params.interpretationStatus);

        const { data, error, count } = await q;
        if (error) {
            console.error('[RentalEventLog] list error', error.message);
            return { items: [], total: 0 };
        }
        return { items: (data ?? []) as RentalEventRow[], total: count ?? 0 };
    }
}
