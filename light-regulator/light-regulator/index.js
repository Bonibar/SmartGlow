'use strict';

const mqtt = require('./mqtt');

module.exports = () => {
    const state = {
        mqtt: null,
        error: {
            mqtt: null,
        },
        success: {
            mqtt: null,
        }
    };
    return {
        mqtt: mqtt(state),
        error: state.error,
        success: state.success
    };
};
