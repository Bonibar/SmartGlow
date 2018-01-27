'use strict';

const utils = require('../utils');

const ERROR_TYPE = utils.enum.fromArray([
    'PARSING_ERROR'
]);

const ERROR_MESSAGE = {
    [ERROR_TYPE.PARSING_ERROR]: 'Could not parse message'
};

/**
 * Creates a MQTT error.
 * @param {String} type - MQTT error type.
 * @param {Object} meta - Metadata to add to the error.
 * @returns {Error} error - MQTT error.
 * @returns {String} error.message - Error message.
 * @returns {String} error.type - Error type.
 * @returns {Object} error.meta - Error metadata.
 */
function mqttError(type, meta){
    const error = new Error(ERROR_MESSAGE[ERROR_TYPE[type]]);
    error.type = type;
    error.meta = meta;
    error.withMeta = (newMeta) => mqttError(type, newMeta);
    return error;
}

/**
 * @exports {Object} mqttError - Container for MQTT error utilities.
 * @exports {Object} mqttError.PARSING_ERROR - Parsing error utilities.
 * @exports {ERROR_TYPE} mqttError[type].type - Type of the error.
 * @exports {Function} mqttError[type].create - Creates an MQTT error of the given type.
 */
module.exports = Object.keys(ERROR_TYPE).reduce((acc, type) => {
    const error = {
        type,
        create: (meta) => mqttError(type, meta)
    };
    return {...acc, [type]: error}
}, {});
