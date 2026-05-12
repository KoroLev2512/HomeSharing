/**
 * Structured JSON logger for server-side code.
 * Outputs correlation_id, request_id, userId in every log line — required
 * for distributed tracing across services.
 *
 * Usage:
 *   import { logger } from '@/shared/lib/logger/logger';
 *   const log = logger.child({ requestId: req.headers.get('x-request-id') });
 *   log.info('booking created', { bookingId, userId });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const configuredLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';

interface LogContext {
    requestId?:     string;
    correlationId?: string;
    userId?:        string;
    service?:       string;
    [key: string]:  unknown;
}

interface LogEntry {
    timestamp:      string;
    level:          LogLevel;
    message:        string;
    service:        string;
    env:            string;
    requestId?:     string;
    correlationId?: string;
    userId?:        string;
    durationMs?:    number;
    error?:         { message: string; stack?: string; code?: string };
    [key: string]:  unknown;
}

class Logger {
    private readonly context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    child(additionalContext: LogContext): Logger {
        return new Logger({ ...this.context, ...additionalContext });
    }

    private shouldLog(level: LogLevel): boolean {
        return LEVELS[level] >= LEVELS[configuredLevel];
    }

    private write(level: LogLevel, message: string, extra: Record<string, unknown> = {}): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp:      new Date().toISOString(),
            level,
            message,
            service:        this.context.service ?? 'homesharing-app',
            env:            process.env.NODE_ENV ?? 'development',
            requestId:      this.context.requestId,
            correlationId:  this.context.correlationId,
            userId:         this.context.userId,
            ...extra,
        };

        // Remove undefined keys for clean JSON
        Object.keys(entry).forEach((k) => entry[k] === undefined && delete entry[k]);

        const line = JSON.stringify(entry);

        if (level === 'error' || level === 'warn') {
            process.stderr.write(line + '\n');
        } else {
            process.stdout.write(line + '\n');
        }
    }

    debug(message: string, extra?: Record<string, unknown>): void {
        this.write('debug', message, extra);
    }

    info(message: string, extra?: Record<string, unknown>): void {
        this.write('info', message, extra);
    }

    warn(message: string, extra?: Record<string, unknown>): void {
        this.write('warn', message, extra);
    }

    error(message: string, err?: unknown, extra?: Record<string, unknown>): void {
        const errorDetails = err instanceof Error
            ? { message: err.message, stack: err.stack, code: (err as NodeJS.ErrnoException).code }
            : err !== undefined
            ? { message: String(err) }
            : undefined;

        this.write('error', message, { ...extra, ...(errorDetails ? { error: errorDetails } : {}) });
    }

    /** Wraps an async function and logs duration + errors automatically. */
    async timed<T>(
        label: string,
        fn: () => Promise<T>,
        extra?: Record<string, unknown>,
    ): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            this.info(label, { ...extra, durationMs: Date.now() - start });
            return result;
        } catch (err) {
            this.error(label, err, { ...extra, durationMs: Date.now() - start });
            throw err;
        }
    }
}

export const logger = new Logger({ service: 'homesharing-app' });
export type { LogContext, LogLevel };
