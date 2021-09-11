const LOG_LEVELS = Object.freeze({
    DEBUG: 100,
    INFO: 200,
    NOTICE: 300,
    WARNING: 400,
    ERROR: 500,
    CRITICAL: 600,
    ALERT: 700,
    EMERGENCY: 800
});
const LEVEL_NAMES = Object.freeze({
    [LOG_LEVELS.DEBUG]: 'debug',
    [LOG_LEVELS.INFO]: 'info',
    [LOG_LEVELS.NOTICE]: 'notice',
    [LOG_LEVELS.WARNING]: 'warning',
    [LOG_LEVELS.ERROR]: 'error',
    [LOG_LEVELS.CRITICAL]: 'critical',
    [LOG_LEVELS.ALERT]: 'alert',
    [LOG_LEVELS.EMERGENCY]: 'emergency'
});
const LEVEL_METHODS = Object.freeze({
    [LOG_LEVELS.DEBUG]: 'debug', // === log()
    [LOG_LEVELS.INFO]: 'info', // === log()
    [LOG_LEVELS.NOTICE]: 'warn', // === error()
    [LOG_LEVELS.WARNING]: 'warn', // === error()
    [LOG_LEVELS.ERROR]: 'error',
    [LOG_LEVELS.CRITICAL]: 'error',
    [LOG_LEVELS.ALERT]: 'error',
    [LOG_LEVELS.EMERGENCY]: 'error'
});

/**
 * A logger.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 */
class Logger {
    /**
     * Initializes a logger.
     *
     * @param {Number} level The log level.
     */
    constructor(level) {
        // Initialize properties
        this.level = level;
        this.formatter = new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    /**
     * Logs a message.
     *
     * @param {Number} level The log's level.
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    log(level, message, ...context) {
        if(level < this.level) {
            return;
        }

        context.unshift(message);
        context.unshift('[' + this.formatter.format(new Date()) + '][' + LEVEL_NAMES[level] + ']');

        console[LEVEL_METHODS[level]].apply(console, context);
    }

    /**
     * Logs a debug message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    debug(message, ...context) {
        this.log(LOG_LEVELS.DEBUG, message, ...context);
    }

    /**
     * Logs an info message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    info(message, ...context) {
        this.log(LOG_LEVELS.INFO, message, ...context);
    }

    /**
     * Logs a notice message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    notice(message, ...context) {
        this.log(LOG_LEVELS.NOTICE, message, ...context);
    }

    /**
     * Logs a warning message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    warning(message, ...context) {
        this.log(LOG_LEVELS.WARNING, message, ...context);
    }

    /**
     * Logs an error message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    error(message, ...context) {
        this.log(LOG_LEVELS.ERROR, message, ...context);
    }

    /**
     * Logs a critical message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    critical(message, ...context) {
        this.log(LOG_LEVELS.CRITICAL, message, ...context);
    }

    /**
     * Logs an alert message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    alert(message, ...context) {
        this.log(LOG_LEVELS.ALERT, message, ...context);
    }

    /**
     * Logs an emergency message.
     *
     * @param {String} message The log's message.
     * @param {*} [context] The log's context.
     */
    emergency(message, ...context) {
        this.log(LOG_LEVELS.EMERGENCY, message, ...context);
    }
}

module.exports = {Logger, LOG_LEVELS};
