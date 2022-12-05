/* globals describe it */
const assert = require('chai').assert;
const streams = Object.freeze({
    stdout: require('test-console').stdout,
    stderr: require('test-console').stderr,
});
const {Logger, LOG_LEVELS} = require('../src/Logger');

describe('Logger', function() {
    // Does logger respect log levels?
    describe('Log levels', function() {
        for(const [loggerLabel, loggerLevel] of Object.entries(LOG_LEVELS)) {
            const logger = new Logger(loggerLevel);

            it('Logger.log() should only print logs of level "' + loggerLabel + '" or greater', function() {
                for(const [logLabel, logLevel] of Object.entries(LOG_LEVELS)) {
                    const logTag = logLabel.toLowerCase();
                    const stream = logLevel >= LOG_LEVELS.NOTICE ? 'stderr' : 'stdout';
                    const output = streams[stream].inspectSync(() => logger.log(logLevel, 'test'));

                    if(logLevel >= loggerLevel) {
                        assert.lengthOf(output, 1, 'Log should have been printed');
                        assert.match(output[0], new RegExp('^\\[.+\\]\\[' + logTag + '] test\n$'), 'Log should have matched pattern');
                    }
                    else {
                        assert.lengthOf(output, 0, 'Log should not have been printed');
                    }
                }
            });
        }
    });

    // Do logger utility methods use the correct log level?
    describe('Utility methods', function() {
        const logger = new Logger(LOG_LEVELS.DEBUG);

        for(const [logLabel, logLevel] of Object.entries(LOG_LEVELS)) {
            const method = logLabel.toLowerCase();
            const stream = logLevel >= LOG_LEVELS.NOTICE ? 'stderr' : 'stdout';
            const output = streams[stream].inspectSync(() => logger[method](logLevel, 'test'));

            it('Logger.' + method + '() should print ' + method + ' logs', function() {
                assert.lengthOf(output, 1, 'Log should have been printed');
                assert.match(output[0], new RegExp('^\\[.+\\]\\[' + method + '\\]'), 'Log should have matched pattern');
            });
        }
    });

    // Do logs contain date, time and level as prefix?
    describe('Date, time and level prefix', function() {
        const logger = new Logger(LOG_LEVELS.DEBUG);

        for(const [logLabel, logLevel] of Object.entries(LOG_LEVELS)) {
            const method = logLabel.toLowerCase();
            const stream = logLevel >= LOG_LEVELS.NOTICE ? 'stderr' : 'stdout';
            const output = streams[stream].inspectSync(() => logger[method](logLevel, 'test'));

            it('Logger.' + method + '() should begin with the date, time and level', function() {
                assert.match(output[0], new RegExp('^\\[\\d{2}\\/\\d{2}\\/\\d{4}, \\d{2}:\\d{2}:\\d{2}\\]\\[' + method + '\\]'), 'Log should have matched pattern');
            });
        }
    });

    // Do logs contain the message and context?
    // @todo
});
