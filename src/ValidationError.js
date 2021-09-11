/**
 * A validation error.
 *
 * @author Bruno Buiret <bruno.buiret@gmail.com>
 */
class ValidationError extends Error {
    /**
     * Initializes a validation error.
     *
     * @param {String|null} message The error message.
     * @param {Array} errors The validation errors.
     */
    constructor(message, errors) {
        super(message);

        this.errors = errors;
    }
}

module.exports = ValidationError;
