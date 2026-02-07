/**
 * Structured Logger for DDP Calculator
 *
 * Provides JSON-formatted logs that are easy to parse by Promtail/Loki.
 *
 * Log format:
 * {
 *   "timestamp": "2025-02-07T10:30:00.000Z",
 *   "level": "info",
 *   "message": "User action description",
 *   "context": { ... additional data ... },
 *   "service": "ddp-calculator",
 *   "component": "quotation"
 * }
 */

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

// Default to 'info' in production, 'debug' in development
const currentLevel = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    ? 'info'
    : 'debug';

/**
 * Create a structured log entry
 * @param {string} level - Log level (debug, info, warn, error)
 * @param {string} message - Human-readable log message
 * @param {Object} context - Additional context data
 * @param {string} component - Component name for filtering
 * @returns {Object} Structured log object
 */
function createLogEntry(level, message, context = {}, component = 'general') {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: 'ddp-calculator',
        component,
        ...context
    };
}

/**
 * Output log to console in structured JSON format
 * @param {string} level - Log level
 * @param {Object} entry - Log entry object
 */
function outputLog(level, entry) {
    // Check if we should log at this level
    if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
        return;
    }

    const jsonLog = JSON.stringify(entry);

    switch (level) {
        case 'error':
            console.error(jsonLog);
            break;
        case 'warn':
            console.warn(jsonLog);
            break;
        case 'debug':
            console.debug(jsonLog);
            break;
        default:
            console.log(jsonLog);
    }
}

/**
 * Create a logger instance for a specific component
 * @param {string} component - Component name (e.g., 'calculations', 'quotation', 'pdf')
 * @returns {Object} Logger instance with info, warn, error, debug methods
 */
export function createLogger(component) {
    return {
        /**
         * Log informational message
         * @param {string} message - Log message
         * @param {Object} context - Additional context
         */
        info(message, context = {}) {
            const entry = createLogEntry('info', message, context, component);
            outputLog('info', entry);
        },

        /**
         * Log warning message
         * @param {string} message - Log message
         * @param {Object} context - Additional context
         */
        warn(message, context = {}) {
            const entry = createLogEntry('warn', message, context, component);
            outputLog('warn', entry);
        },

        /**
         * Log error message
         * @param {string} message - Log message
         * @param {Object} context - Additional context (can include error object)
         */
        error(message, context = {}) {
            // If context contains an Error object, extract useful info
            if (context.error instanceof Error) {
                context = {
                    ...context,
                    errorMessage: context.error.message,
                    errorStack: context.error.stack,
                    errorName: context.error.name
                };
                delete context.error;
            }
            const entry = createLogEntry('error', message, context, component);
            outputLog('error', entry);
        },

        /**
         * Log debug message (only in development)
         * @param {string} message - Log message
         * @param {Object} context - Additional context
         */
        debug(message, context = {}) {
            const entry = createLogEntry('debug', message, context, component);
            outputLog('debug', entry);
        },

        /**
         * Log with timing information
         * @param {string} operation - Operation name
         * @returns {Function} End function to call when operation completes
         */
        startTimer(operation) {
            const startTime = performance.now();
            const startEntry = createLogEntry('debug', `${operation} started`, { operation }, component);
            outputLog('debug', startEntry);

            return (additionalContext = {}) => {
                const duration = performance.now() - startTime;
                const endEntry = createLogEntry('info', `${operation} completed`, {
                    operation,
                    durationMs: Math.round(duration * 100) / 100,
                    ...additionalContext
                }, component);
                outputLog('info', endEntry);
                return duration;
            };
        }
    };
}

// Pre-created loggers for common components
export const calculationsLogger = createLogger('calculations');
export const quotationLogger = createLogger('quotation');
export const pdfLogger = createLogger('pdf');
export const historyLogger = createLogger('history');
export const importLogger = createLogger('import');

// Default export for simple usage
export default {
    createLogger,
    calculationsLogger,
    quotationLogger,
    pdfLogger,
    historyLogger,
    importLogger
};
