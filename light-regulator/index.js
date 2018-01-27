'use strict';

const App = require('./app');
const Configuration = require('../configuration');
const LightRegulator = require('./light-regulator');

const app = App({port: 3001});
const configuration = Configuration('./light-regulator.cfg');
const settings = Configuration('./light-regulator-settings.cfg');
const regulator = LightRegulator();

const DEFAULT_SETTINGS = {autoadjust: false, brightness: 0.5, desired: 0.5};

app.handlers.configuration.get = (done) => {
    configuration.get((error, config) => {
        return done(null, {
            mqtt: {
                value: config && config.mqtt && config.mqtt.broker && config.mqtt.broker.host,
                error: (error && error.message) || (regulator.error.mqtt && regulator.error.mqtt.message),
                success: !error && !regulator.error.mqtt && regulator.success.mqtt,
            }
        });
    });
};

app.handlers.configuration.set = (data, done) => {
    const newConfig = {
        mqtt: {
            broker: {
                protocol: 'mqtt',
                host: data.mqtt
            }
        }
    };
    configuration.set(newConfig, err => {
        setTimeout(() => done(err), 1100);
    });
};

app.handlers.settings.get = (done) => {
    settings.get((err, settings) => {
        if(settings && settings.autoadjust) return done(null, {
            ...DEFAULT_SETTINGS,
            ...settings,
            error: err && err.message
        });
        regulator.mqtt.getBrightness((err, brightness) => {
            return done(null, {
                ...DEFAULT_SETTINGS,
                ...settings,
                error: err && err.message,
                autoadjust: false,
                brightness
            });
        });
    });
};

app.handlers.settings.set = (data, done) => {
    const autoadjust = !!data.autoadjust;
    const brightness = data.brightness;
    const metric = autoadjust ? 'desired' : 'brightness';
    settings.get((error, current) => {
        const currentSettings = {...DEFAULT_SETTINGS, ...current};
        const newSettings = {...currentSettings, autoadjust, [metric]: brightness};
        settings.set(newSettings, err => {
            setTimeout(done, err || autoadjust ? 0 : 1100);
        });
    });
};

configuration.on('update', (error, config) => {
    regulator.mqtt.disconnect();
    if(error) return;
    regulator.mqtt.connect(config && config.mqtt, () => {});
});


settings.on('update', (error, config) => {
    const {autoadjust, brightness, desired} = config;
    regulator.mqtt.setAutoAdjust(autoadjust, desired);
    if(!autoadjust) regulator.mqtt.setBrightness(brightness, () => {});
});

app.start();
