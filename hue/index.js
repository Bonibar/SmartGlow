'use strict';

const hueClient = require('./hue-client');
const lightsRouter = require('./lights-router');

module.exports = (config) => {
    const client = hueClient(config);
    client.lights = lightsRouter(client);
    return client;
};
