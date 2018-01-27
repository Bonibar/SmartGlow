'use strict';

const {mqttClient} = require('../../mqtt');

const MQTT_LIGHT_SENSOR_CHANNEL = 'smartglow/light-sensor';
const MQTT_LIGHT_CONTROLLER_CHANNEL = 'smartglow/lights-controller';

const MIN_LUX = 0;
const MAX_LUX = 1000;
const BRIGHTNESS_STEP = 0.01;

module.exports = (state) => {
    const lightController = {
        on: null,
        brightness: null,
        autoadjust: {
            enabled: false,
            brightness: 0
        }
    };
    const sensors = {};
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
        setBrightness(brightness, done){
            const {mqtt} = state;
            if(!mqtt) return done(new Error('Not connected to the MQTT broker'));
            const on = (brightness > 0);
            const newBrightness = Math.min(1, Math.max(0, brightness));
            mqtt.publish(`${MQTT_LIGHT_CONTROLLER_CHANNEL}/brightness`, {on, brightness: newBrightness});
            done();
        },
        getBrightness(done){
            const {on, brightness} = lightController;
            if(!on || !brightness) return done(new Error('Missing data about the light controller'));
            return done(null, lightController.brightness);
        },
        setAutoAdjust(enabled, brightness){
            lightController.autoadjust = {enabled, brightness};
        },
        _setup(){
            state.mqtt.subscribe(`${MQTT_LIGHT_SENSOR_CHANNEL}/+/update`);
            state.mqtt.subscribe(`${MQTT_LIGHT_CONTROLLER_CHANNEL}/state`);
            state.mqtt.onMessage(`${MQTT_LIGHT_SENSOR_CHANNEL}/+/update`, this._onSensorUpdate.bind(this));
            state.mqtt.onMessage(`${MQTT_LIGHT_CONTROLLER_CHANNEL}/state`, this._onStateUpdate.bind(this));
            state.mqtt.publish(`${MQTT_LIGHT_CONTROLLER_CHANNEL}/refresh`, {service: 'light-regulator'});
        },
        _onSensorUpdate(err, message){
            if(err) return this._onMQTTError(err);
            const id = message.levels[2];
            sensors[id] = message.content;
            const {enabled, brightness} = lightController.autoadjust;
            const currentBrightness = lightController.brightness;
            if(!enabled || currentBrightness === null) return;
            const sensorValues = Object.values(sensors);
            const current = sensorValues.reduce((acc, curr) => acc + curr, 0) / sensorValues.length;
            const desired = (brightness * (MAX_LUX - MIN_LUX)) + MIN_LUX;
            if(current > desired) return this.setBrightness(currentBrightness - BRIGHTNESS_STEP, () => {});
            if(current < desired) return this.setBrightness(currentBrightness + BRIGHTNESS_STEP, () => {});
        },
        _onStateUpdate(err, message){
            if(err) return this._onMQTTError(err);
            lightController.on = message.content.on;
            lightController.brightness = message.content.brightness;
        },
        _onMQTTError(err){
            console.log(`[MQTT][Error] ${err.message}. ${JSON.stringify(err.meta)}`);
        },

    };
};

