'use strict';

const mqtt = require('mqtt');
const utils = require('../utils');
const mqttError = require('./mqtt-error');

/**
 * Creates a MQTT client.
 * @param {Object} config - MQTT client configuration.
 * @param {Object} config.broker - MQTT Broker configuration.
 * @param {Object} config.broker.protocol - Protocol to use.
 * @param {Object} config.broker.host - Host to connect to.
 * @returns {Object} client - MQTT client.
 * @returns {Object} client.config - MQTT client configuration.
 * @returns {Function} client.onConnected - Registers a callback to call when the client is connected.
 * @returns {Function} client.onMessage - Registers a callback to call when the clients receives a message on the
 *                                        specified topic.
 * @returns {Function} client.subscribe - Subscribes to the specified topic.
 * @returns {Function} client.publish - Publishes data to the specified topic.
 * @returns {Function} client.close - Disconnect the client from the MQTT broker.
 */
module.exports = (config) => {
    const {broker: {protocol, host, ...options}} = config;
    const client  = mqtt.connect(`${protocol}://${host}`, options);
    return {
        config,

        onConnected(handler){
            client.on('connect', () => handler());
        },
        onMessage(topic, handler){
            const regexp = this._topicRegExp(topic);
            client.on('message', (topic, message) => {
                if (!regexp.test(topic)) return;
                utils.JSON.parse(message.toString(), (err, content) => {
                    if(err) return handler(mqttError.PARSING_ERROR.create().withMeta({topic, message: message.toString()}));
                    const levels = topic.split('/');
                    handler(null, {levels, content});
                });
            });
        },
        subscribe(topic){
            client.subscribe(topic);
        },
        publish(topic, data){
            const message = JSON.stringify(data);
            client.publish(topic, message);
        },
        close(){
            client.end();
        },
        _topicRegExp(topic){
            const regexp = topic
                .replace(/\/\+\//g, '/\\w+/') /* '/+/' -> '/<word>/' */
                .replace(/\/#$/, '(/\\w+)+$'); /* '/#' -> '(/<word>)+' */
            return new RegExp(regexp);
        }
    };
};
