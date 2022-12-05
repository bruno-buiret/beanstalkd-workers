const EventEmitter = require('events');
const Validator = require('jsonschema').Validator;
const Worker = require('./Worker');
const ValidationError = require('./ValidationError');

/**
 * A runner.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 */
class Runner extends EventEmitter {
    /**
     * Initializes a runner.
     *
     * @param {Object} configuration The runner's configuration.
     * @param {Logger} logger A logger.
     */
    constructor(configuration, logger) {
        super();

        // Initialize properties
        this.configuration = this.normalizeConfiguration(configuration);
        this.workers = [];
        this.logger = logger;
    }

    /**
     * Starts the runner.
     */
    start() {
        this.emit('starting');

        for(const [id, configuration] of Object.entries(this.configuration.workers)) {
            // Create worker
            const worker = new Worker(id, configuration, this.logger);

            worker.on('start_error', (error) => {
                this.logger.error('Worker ' + worker.id + ' couldn\'t start.', error);
                throw new Error('Worker ' + worker.id + ' couldn\'t start.');
            });

            this.workers.push(worker);
        }

        return Promise
            .all(this.workers.map(worker => worker.start()))
            .then(() => this.emit('started'));
    }

    /**
     * Stops the runner.
     */
    stop() {
        this.emit('stopping');

        return Promise
            .allSettled(this.workers.map(worker => worker.stop()))
            .then(() => this.emit('stopped'));
    }

    /**
     * Normalizes the configuration.
     *
     * @param {Object} configuration
     * @return {Object} The normalized configuration.
     */
    normalizeConfiguration(configuration) {
        const validator = new Validator();
        const result = validator.validate(configuration, {
            definitions: {
                beanstalk: {
                    type: 'object',
                    properties: {
                        host: {
                            type: 'string',
                            minLength: 1,
                        },
                        port: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 65535,
                        },
                    },
                },
            },
            type: 'object',
            properties: {
                beanstalk: {
                    type: {'$ref': '#/definitions/beanstalk'},
                },
                workers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            beanstalk: {
                                type: {'$ref': '#/definitions/beanstalk'},
                            },
                            tubes: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    minLength: 1,
                                    pattern: '[a-zA-Z0-9+/;\\.$_\\(\\)][a-zA-Z0-9-+/;\\.$_\\(\\)]*',
                                },
                                minimum: 1,
                            },
                            handlers: {
                                type: 'array',
                                items: {
                                    type: ['string', 'object'],
                                    minLength: 1,
                                    properties: {
                                        path: {
                                            type: 'string',
                                            minLength: 1,
                                        },
                                    },
                                    required: ['path'],
                                },
                                minimum: 1,
                            },
                        },
                        required: ['tubes', 'handlers'],
                    },
                },
            },
            required: ['workers'],
        });

        // Check configuration
        if(!result.valid) {
            throw new ValidationError('Configuration is invalid.', result.errors);
        }

        // Process beanstalk default configuration
        configuration.beanstalk = configuration.beanstalk ?? {};
        configuration.beanstalk.host = configuration.beanstalk.host ?? '127.0.0.1';
        configuration.beanstalk.port = configuration.beanstalk.port ?? 11300;

        for(const worker of configuration.workers) {
            worker.beanstalk = worker.beanstalk ?? {};
            worker.beanstalk.host = worker.beanstalk.host ?? configuration.beanstalk.host;
            worker.beanstalk.port = worker.beanstalk.port ?? configuration.beanstalk.port;

            for(let [key, handler] of Object.entries(worker.handlers)) {
                if('string' === typeof handler) {
                    // Only a path, normalize as an object
                    worker.handlers[key] = handler = {path: handler};
                }
            }
        }

        return configuration;
    }
}

module.exports = Runner;
