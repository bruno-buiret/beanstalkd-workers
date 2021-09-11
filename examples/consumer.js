const Runner = require('../src/Runner');
const {Logger, LOG_LEVELS} = require('../src/Logger');

process.on('SIGTERM', (event) => {
    runner
        .stop()
        .then(() => process.exit(0))
    ;
});

const logger = new Logger(LOG_LEVELS.DEBUG);
const runner = new Runner(
    {
        beanstalk: {
            host: 'localhost',
            port: 11300
        },
        workers: [
            {
                tubes: ['test_1', 'test_2'],
                handlers: [
                    './NoopHandler.js',
                    {path: './NoopHandler.js'}
                ]
            },
            {
                tubes: ['test_3'],
                handlers: [
                    './NoopHandler.js',
                ]
            }
        ]
    },
    logger
);
runner
    .start()
    .then(
        () => logger.debug('Runner has started.'),
        (error) => {
            logger.emergency('Runner couldn\'t start.', error);
            process.exit(1);
        }
    )
;

