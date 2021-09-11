const Validator = require('jsonschema').Validator;
const ValidationError = require('./ValidationError');

/**
 * A base class for handlers.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 * @abstract
 */
class AbstractHandler {
    /**
     * Initializes a handler.
     *
     * @param {String} type A job type to handle, or `'*'` to handle every one of them.
     * @param {Object} configuration The handler's configuration.
     * @param {Object|null} configurationSchema The handler's configuration's schema.
     * @param {Object|null} payloadSchema The jobs' payload's schema.
     * @param {Logger} logger A logger.
     */
    constructor(
        type,
        configuration,
        configurationSchema,
        payloadSchema,
        logger
    ) {
        // Initialize properties
        this.type = type;
        this.configuration = configuration;
        this.configurationSchema = configurationSchema;
        this.payloadSchema = payloadSchema;
        this.logger = logger;

        // Check configuration is valid
        if(null !== this.configurationSchema) {
            const validator = new Validator();
            const results = validator.validate(this.configuration, this.configurationSchema);

            if(!results.valid) {
                throw new ValidationError('Handler configuration is invalid.', results.errors);
            }
        }
    }

    /**
     * Sets up a handler's dependencies.
     *
     * This method can be used to set up dependencies that might be asynchronous.
     *
     * @return {Promise<void,*>} Resolved when initialized.
     */
    initialize() {
        return Promise.resolve();
    }

    /**
     * Processes a job.
     *
     * @param {*} payload The job's payload.
     * @param {String} id The job's id.
     * @param {String} type The job's type.
     * @return {Promise<String|[String, Object],*>} The post handling action.
     */
    process(payload, id, type) { // eslint-disable-line no-unused-vars
        return Promise.resolve('bury');
    }
}

module.exports = AbstractHandler;
