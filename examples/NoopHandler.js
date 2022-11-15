const AbstractHandler = require('../src/AbstractHandler');

/**
 * A handles which does nothing with jobs.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 */
class NoopHandler extends AbstractHandler {
    /**
     * Initializes a noop handler.
     *
     * @param {Object} configuration The handler's configuration.
     * @param {Logger} logger A logger.
     */
    constructor(configuration, logger) {
        super(
            '*',
            configuration,
            null,
            null,
            logger
        );
    }

    /**
     * @inheritDoc
     */
    process(payload, id, type) {
        this.logger.debug('Job #' + id + ' - ' + type, payload);

        return Promise.resolve('delete');
    }
}

module.exports = NoopHandler;
