import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';
import type { RosreestrObjectData, RosreestrStatus } from '@/shared/types/listing';

const STATECD: Record<string, string> = {
    '6':   'Учтён',
    '27':  'Ранее учтён',
    '142': 'Снят с учёта',
};

const LAYER_NAMES: Record<number, string> = {
    1: 'Земельный участок',
    2: 'ОКС (объект кап. строительства)',
    5: 'Здание',
};

// ── Нормализация кадастрового номера (§4.2, anti-corruption layer) ───────────

const CN_STRICT = /^\d{2}:\d{2}:\d{6,7}:\d+$/;
const CN_LOOSE  = /^(\d{1,2})[:\s\-](\d{1,2})[:\s\-](\d{6,7})[:\s\-](\d+)$/;

type NormalizationResult =
    | { ok: true; cn: string; originalCn: string }
    | { ok: false; error: string };

function normalizeCadastralNumber(raw: string): NormalizationResult {
    const trimmed = raw.trim().replace(/\s+/g, '');
    if (CN_STRICT.test(trimmed)) return { ok: true, cn: trimmed, originalCn: raw };
    const m = CN_LOOSE.exec(trimmed);
    if (m) {
        const normalized = `${m[1]!.padStart(2, '0')}:${m[2]!.padStart(2, '0')}:${m[3]}:${m[4]}`;
        return { ok: true, cn: normalized, originalCn: raw };
    }
    return { ok: false, error: 'Неверный формат кадастрового номера (ожидается NN:NN:NNNNNNN:NNN)' };
}

// ── Interpretation engine (§4.2) ─────────────────────────────────────────────

interface InterpretationInput {
    found:      boolean;
    statecd?:   string;
    areaValue?: string;
    listingArea?: number;
}

interface InterpretationOutput {
    status:               RosreestrStatus;
    reason:               string;
    requiresManualReview: boolean;
}

function interpretRosreestrResult(input: InterpretationInput): InterpretationOutput {
    if (!input.found) {
        return { status: 'not_found', reason: 'Объект не найден в реестре по данному кадастровому номеру', requiresManualReview: false };
    }

    // Объект снят с учёта
    if (input.statecd === '142') {
        return { status: 'not_verified', reason: 'Объект снят с кадастрового учёта', requiresManualReview: false };
    }

    // Неизвестный статус объекта
    if (input.statecd && !['6', '27', '142'].includes(input.statecd)) {
        return { status: 'inconclusive', reason: `Неизвестный код статуса объекта: ${input.statecd}`, requiresManualReview: true };
    }

    // Сравнение площадей — если расхождение > 10%, результат неоднозначный
    if (input.areaValue && input.listingArea) {
        const registryArea = parseFloat(input.areaValue);
        if (Number.isFinite(registryArea) && registryArea > 0) {
            const diff = Math.abs(registryArea - input.listingArea) / Math.max(registryArea, input.listingArea);
            if (diff > 0.10) {
                return {
                    status: 'inconclusive',
                    reason: `Расхождение площади: в объявлении ${input.listingArea} м², в реестре ${registryArea.toFixed(1)} м² (${(diff * 100).toFixed(1)}%)`,
                    requiresManualReview: true,
                };
            }
        }
    }

    return {
        status: 'found', // legacy — маппится в 'verified' на фронте
        reason: 'Объект найден и учтён в реестре',
        requiresManualReview: false,
    };
}

// ── PKK API ───────────────────────────────────────────────────────────────────

interface PkkAttrs {
    id?: string; cn?: string; address?: string; area_value?: string;
    name?: string; purpose_name?: string; statecd?: string;
    floors?: string; year_built?: string; cad_cost?: string;
    [key: string]: unknown;
}

interface PkkFeature { type: number; attrs: PkkAttrs; }
interface PkkResponse { total: number; features: PkkFeature[]; }

async function queryPkk(layerType: number, cn: string): Promise<PkkFeature | null> {
    const url = `https://pkk.rosreestr.ru/api/features/${layerType}/?text=${encodeURIComponent(cn)}&limit=1&skip=0&inBounds=false&tolerance=4`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomeSharing/1.0)', 'Referer': 'https://pkk.rosreestr.ru/' },
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as PkkResponse;
    return data.features?.[0] ?? null;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Доступ: admin или host (хост проверяет свои объявления)
    if (!session.isAdmin && !session.isHost) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json() as { cadastralNumber: string; listingArea?: number; listingId?: string };
    const { cadastralNumber, listingArea, listingId } = body;

    if (!cadastralNumber || typeof cadastralNumber !== 'string') {
        return NextResponse.json({ error: 'cadastralNumber обязателен' }, { status: 400 });
    }

    // Нормализация идентификатора (§4.2: Request Builder)
    const normalized = normalizeCadastralNumber(cadastralNumber);
    if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error, normalizationStatus: 'invalid_format' }, { status: 400 });
    }
    const cn = normalized.cn;

    const startedAt = Date.now();

    try {
        let feature: PkkFeature | null = null;
        for (const layer of [2, 1, 5]) {
            feature = await queryPkk(layer, cn);
            if (feature) break;
        }

        const durationMs = Date.now() - startedAt;
        const a = feature?.attrs ?? {};

        const interpretation = interpretRosreestrResult({
            found: !!feature,
            statecd: a.statecd,
            areaValue: a.area_value,
            listingArea,
        });

        const result: RosreestrObjectData | undefined = feature ? {
            cn: a.cn ?? cn,
            address: a.address,
            areaValue: a.area_value,
            name: a.name,
            purposeName: a.purpose_name,
            statecd: a.statecd,
            statecdLabel: a.statecd ? (STATECD[a.statecd] ?? `Код ${a.statecd}`) : undefined,
            floors: a.floors,
            yearBuilt: a.year_built,
            cadCost: a.cad_cost,
            layerType: feature.type,
        } : undefined;

        // Запись в аудит-журнал (§3.4)
        void RentalEventLog.write({
            eventType: 'verification.completed',
            aggregateType: 'verification',
            aggregateId: listingId ?? cn,
            actorUserId: session.userId,
            cadastralNumber: cn,
            normalizationStatus: normalized.originalCn !== cn ? 'ok' : 'ok',
            interpretationStatus: (['found', 'verified'].includes(interpretation.status) ? 'verified' :
                                   interpretation.status === 'not_found' ? 'not_verified' :
                                   interpretation.status === 'inconclusive' ? 'inconclusive' : 'technical_failure') as 'verified' | 'not_verified' | 'inconclusive' | 'technical_failure',
            interpretationReason: interpretation.reason,
            requiresManualReview: interpretation.requiresManualReview,
            policyVersion: 'v1',
            payload: { durationMs, layerType: feature?.type, statecd: a.statecd, areaValue: a.area_value },
        });

        return NextResponse.json({
            found: !!feature,
            cn,
            originalCn: normalized.originalCn !== cn ? normalized.originalCn : undefined,
            normalizationStatus: 'ok',
            data: result,
            layerName: feature ? (LAYER_NAMES[feature.type] ?? `Слой ${feature.type}`) : undefined,
            interpretation,
            durationMs,
        });
    } catch (e) {
        const durationMs = Date.now() - startedAt;
        console.error('[ROSREESTR_PROXY]', e);

        void RentalEventLog.write({
            eventType: 'verification.failed',
            aggregateType: 'verification',
            aggregateId: listingId ?? cn,
            actorUserId: session.userId,
            cadastralNumber: cn,
            interpretationStatus: 'technical_failure',
            interpretationReason: 'Не удалось получить ответ от Росреестра',
            policyVersion: 'v1',
            payload: { durationMs, error: String(e) },
        });

        return NextResponse.json({ error: 'Не удалось получить ответ от Росреестра', interpretationStatus: 'technical_failure' }, { status: 502 });
    }
}
