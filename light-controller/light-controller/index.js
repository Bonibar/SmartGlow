'use strict';

const mqtt = require('./mqtt');
const hue = require('./hue');

module.exports = () => {
    const state = {
        mqtt: null,
        hue: null,
        error: {
            mqtt: null,
            hue: null
        },
        success: {
            mqtt: null,
            hue: null
        }
    };
    return {
        mqtt: mqtt(state),
        hue: hue(state),
        error: state.error,
        success: state.success
    };
};
