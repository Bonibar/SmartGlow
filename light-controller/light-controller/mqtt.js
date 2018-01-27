'use strict';

const async = require('async');
const {mqttClient} = require('../../mqtt');

const MQTT_CHANNEL = 'smartglow/lights-controller';

module.exports = (state) => {
    return {
        connect(config, done){
            const host = config.broker.host;
            if(!host || !host.length) return done();

            state.mqtt = mqttClient(config);
            state.error.mqtt = null;
            state.success.mqtt = null;

            state.mqtt.onConnected(() => {
                if(state.error.mqtt) return;
                state.success.mqtt = `Connected to ${host}`;
                this._setup();
                done && done();
            });

            setTimeout(() => {
                if(state.success.mqtt) return;
                const error = new Error(`Connection to ${host} refused`);
                this._onMQTTError(error);
                state.error.mqtt = error;
                state.mqtt = null;
                done && done();
            }, 1000);
        },
        disconnect(){
            if(!state.mqtt) return;
            state.mqtt.close();
            state.mqtt = null;
            state.error.mqtt = null;
            state.success.mqtt = null;
        },
        getConfiguration(){
            if(!state.mqtt) return null;
            return state.mqtt.config;
        },
        _setup(){
            state.mqtt.subscribe(`${MQTT_CHANNEL}/#`);
            state.mqtt.onMessage(`${MQTT_CHANNEL}/brightness`, this._onBrightness.bind(this));
            state.mqtt.onMessage(`${MQTT_CHANNEL}/refresh`, this._onRefresh.bind(this));
        },
        _onBrightness(err, message){
            if(err) return this._onMQTTError(err);
            const {mqtt, hue} = state;
            if(!mqtt || !hue) return;
            const newState = message.content;
            async.waterfall([
                (cb) => hue.lights.list(cb),
                (lights, cb) => {
                    const tasks = Object.keys(lights).map(id => cb => state.hue.lights.set(id, newState, cb));
                    async.parallel(tasks, err => cb(err));
                }
            ], (err) => {
                if(err) return this._onHueError(err);
                mqtt.publish(`${MQTT_CHANNEL}/state`, newState);
            });
        },
        _onRefresh(err) {
            if(err) return this._onMQTTError(err);
            const {mqtt, hue} = state;
            if(!mqtt || !hue) return;
            async.waterfall([
                (cb) => hue.lights.list(cb),
                (lights, cb) => {
                    const newState = Object.values(lights)[0];
                    if(!newState) return;
                    const {on, brightness} = newState;
                    const tasks = Object.keys(lights).map(id => cb => state.hue.lights.set(id, {on, brightness}, cb));
                    async.parallel(tasks, err => cb(err, newState));
                }
            ], (err, newState) => {
                if(err) return this._onHueError(err);
                mqtt.publish(`${MQTT_CHANNEL}/state`, newState);
            });
        },
        _onMQTTError(err){
            console.log(`[MQTT][Error] ${err.message}. ${JSON.stringify(err.meta)}`);
        },
        _onHueError(err){
            console.log(`[Philips Hue][Error] ${err.message}.`);
        }
    };
};

