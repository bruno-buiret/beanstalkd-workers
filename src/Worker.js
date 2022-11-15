const EventEmitter = require('events');
const Jackd = require('jackd');
const Validator = require('jsonschema').Validator;
const WorkerActions = require('./WorkerActions');

/**
 * A worker.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 */
class Worker extends EventEmitter {
    /**
     * Initializes a worker.
     *
     * @param {String|Number} id The worker's id.
     * @param {Object} configuration The worker's configuration.
     * @param {Object} configuration.beanstalk Beanstalk's configuration.
     * @param {String} configuration.beanstalk.host Beanstalk's host.
     * @param {Number} configuration.beanstalk.port Beanstalk's port.
     * @param {String[]} configuration.tubes Beanstalk's tubes to watch.
     * @param {Object[]} configuration.handlers The job handlers.
     * @param {String} configuration.handlers[].path The handler's path.
     * @param {Logger} logger A logger.
     */
    constructor(id, configuration, logger) {
        super();

        // Initialize properties
        this.id = id;
        this.configuration = configuration;
        this.logger = logger;
        this.client = new Jackd();
        this.handlers = new Map();
        this.validator = new Validator();

        // Set up event listeners
        this.on('ready', this.next);
        this.on('next', this.next);
    }

    /**
     * Starts the worker.
     */
    start() {
        if(0 === this.configuration.handlers.length) {
            return Promise.resolve();
        }

        // First, build handlers
        const path = process.cwd() + '/';

        this.emit('initializing');

        return Promise
            // Build and initialize handlers
            .all(this.configuration.handlers.map(
                /**
                 * @param {Object} handlerConfiguration The handler's configuration.
                 * @param {String} handlerConfiguration.path The handler's path.
                 * @return {Promise<AbstractHandler,*>} The newly initialized handler.
                 */
                (handlerConfiguration) => {
                    const Handler = require(path + handlerConfiguration.path);

                    delete handlerConfiguration.path;
                    const handler = new Handler(handlerConfiguration, this.logger);

                    return handler.initialize().then(() => handler);
                })
            )
            // Store handlers, then, connect to Beanstalkd
            .then(
                /**
                 * @param {AbstractHandler[]} handlers The initialized handlers.
                 * @return {Promise<*>} The Jackd client.
                 */
                (handlers) => {
                    for(const handler of handlers) {
                        this.handlers.set(handler.type, handler);
                    }

                    this.emit('initialized');
                    this.emit('connecting', this.configuration.beanstalk);

                    return this.client.connect(this.configuration.beanstalk);
                }
            )
            // Watch tubes
            .then(
                () => {
                    this.emit('connected', this.configuration.beanstalk);

                    return Promise.all(this.configuration.tubes.map((tube) => this.client
                        .watch(tube)
                        .then(() => {
                            this.emit('watching', tube);

                            return Promise.resolve();
                        })
                    ));
                }
            )
            // Ignore tube "default" if necessary
            .then(
                () => {
                    if(this.configuration.tubes.includes('default')) {
                        return Promise.resolve();
                    }
                    else {
                        return this.client.ignore('default').then(() => {
                            this.emit('ignoring', 'default');

                            return Promise.resolve();
                        });
                    }
                }
            )
            // Worker is ready
            .then(
                () => {
                    this.emit('ready');
                }
            )
            .catch(
                /**
                 * @param {*} error The start error.
                 */
                (error) => {
                    this.emit('start_error', error);
                }
            );
    }

    /**
     * Stops the worker.
     */
    stop() {
        this.emit('stopping');

        return this
            .client
            .disconnect()
            .then(
                () => this.emit('stopped'),
                (error) => this.logger.error('Couldn\'t stop worker #' + this.id + '.', error)
            );
    }

    /**
     * Reserves and handles a job.
     *
     * @return {Promise<void,*>}
     */
    async next() {
        try {
            // Reserve job
            this.emit('job.reserving');
            let {id, payload: data} = await this.client.reserveWithTimeout(10);
            this.emit('job.reserved', id);

            // Parse job's data
            try {
                data = JSON.parse(data);
            }
            catch(error) {
                this.logger.warning('Couldn\'t parse job #' + id + '\'s data.', error);
                this.emit('job.burying', id);
                await this.client.bury(id);
                this.emit('job.buried', id);
                return;
            }

            // Check job's data and type
            if('object' !== typeof data) {
                this.logger.warning('Job #' + id + '\'s data is invalid: not an object.');
                this.emit('job.burying', id);
                await this.client.bury(id);
                this.emit('job.buried', id);
                return;
            }
            else if('string' !== typeof data.type) {
                this.logger.warning('Job #' + id + '\'s data is invalid: no type.');
                this.emit('job.burying', id);
                await this.client.bury(id);
                this.emit('job.buried', id);
                return;
            }
            else if(!this.handlers.has(data.type) && !this.handlers.has('*')) {
                this.logger.warning('Job #' + id + '\'s doesn\'t have any handler.');
                this.emit('job.burying', id);
                await this.client.bury(id);
                this.emit('job.buried', id);
                return;
            }

            data.payload = data.payload ?? null;

            // Find handler
            const handler = this.handlers.get(data.type) ?? this.handlers.get('*');
            let action = null;

            if(null !== handler.payloadSchema) {
                this.emit('job.validating', id);
                const result = this.validator.validate(data.payload, handler.payloadSchema);

                if(result.valid) {
                    this.emit('job.valid', id);
                }
                else {
                    this.emit('job.invalid', id, result.errors);
                    action = WorkerActions.BURY;
                }
            }

            // Process job only if valid
            if(null === action) {
                this.emit('job.handling', id);
                action = await handler.process(data.payload, id, data.type);
                this.emit('job.handled', id);
            }

            // Handle job post-processing
            let options = undefined;

            if(Array.isArray(action)) {
                switch(action.length) {
                    case 0:
                        action = WorkerActions.BURY;
                        break;

                    case 1:
                        action = action[0];
                        break;

                    default:
                        options = action[1];
                        action = action[0];
                }
            }

            switch(action) {
                case WorkerActions.DELETE:
                    this.emit('job.deleting', id);
                    await this.client.delete(id);
                    this.emit('job.deleted', id);
                    break;

                case WorkerActions.RELEASE:
                    this.emit('job.releasing', id);
                    await this.client.release(id, options);
                    this.emit('job.released', id);
                    break;

                default:
                    this.emit('job.burying', id);
                    await this.client.bury(id);
                    this.emit('job.buried', id);
            }
        }
        catch(error) {
            if('string' !== typeof error.message || !error.message.includes('TIMED_OUT')) {
                this.logger.error('Job handling error.', error);
            }
        }
        finally {
            this.emit('next');
        }
    }
}

module.exports = Worker;
