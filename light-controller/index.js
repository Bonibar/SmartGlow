'use strict';

const App = require('./app');
const Configuration = require('../configuration');
const LightController = require('./light-controller');

const app = App({port: 3000});
const configuration = Configuration('./light-controller.cfg');
const controller = LightController();

app.handlers.configuration.get = (done) => {
    configuration.get((error, config) => {
        return done(null, {
            mqtt: {
                value: config && config.mqtt && config.mqtt.broker && config.mqtt.broker.host,
                error: (error && error.message) || (controller.error.mqtt && controller.error.mqtt.message),
                success: !error && !controller.error.mqtt && controller.success.mqtt,
            },
            hue: {
                value: config && config.hue && config.hue.bridge && config.hue.bridge.host,
                error: (error && error.message) || (controller.error.hue && controller.error.hue.message),
                success: !error && !controller.error.hue && controller.success.hue,
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
        },
        hue: {
            bridge: {
                host: data.hue
            },
            id: 'BRIDGE CLIENT ID'
        }
    };
    configuration.set(newConfig, err => {
        setTimeout(() => done(err), 1100);
    });
};

configuration.on('update', (error, config) => {
    controller.hue.disconnect();
    controller.mqtt.disconnect();
    if(error) return;
    controller.hue.connect(config && config.hue, () => {
        controller.mqtt.connect(config && config.mqtt, () => {

        })
    });
});

app.start();
