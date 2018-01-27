'use strict';

const express = require('express');
const formidable = require('express-formidable');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
    const {port} = config;
    const handlers = {
        configuration: {
            get: (done) => done(),
            set: (_, done) => done()
        },
        settings: {
            get: (done) => done(),
            set: (_, done) => done()
        }
    };
    const app = createApp(handlers);
    return {
        handlers,
        start(done){
            app.listen(port, () => {
                console.log(`App started on port ${port}.`);
                done && done();
            });
        }
    }
};

function createApp(handlers){
    const app = express();
    app.use(formidable());
    app.get('/', getIndex(handlers));
    app.post('/configuration', setConfiguration(handlers));
    app.post('/settings', setSettings(handlers));
    return app;
}

function getIndex(handlers){
    return (req, res) => {
        readIndexFromFile(handlers, (err, index) => {
            if(err) return res.sendStatus(500);
            return res.send(index);
        })
    };
}

function setConfiguration(handlers) {
    return (req, res) => {
        updateConfiguration(handlers, req.fields, () => {
            res.redirect('/');
        });
    };
}

function setSettings(handlers) {
    return (req, res) => {
        updateSettings(handlers, req.fields, () => {
            res.redirect('/');
        });
    };
}

function readIndexFromFile(handlers, done){
    handlers.configuration.get((err, config) => {
        if(err) return done(err);
        handlers.settings.get((err, settings) => {
            if(err) return done(err);
            fs.readFile(path.resolve(__dirname, 'index.html'), 'utf8', (err, content) => {
                if(err) return done(err);
                const modified = content
                    .replace('[MQTT INPUT STYLE]', getInputStyle(config, 'mqtt'))
                    .replace('[MQTT INPUT VALUE]', getInputValue(config, 'mqtt'))
                    .replace('[MQTT DANGER TEXT]', getDangerText(config, 'mqtt'))
                    .replace('[MQTT SUCCESS TEXT]', getSuccessText(config, 'mqtt'))
                    .replace('[SETTINGS SECTION STYLE]', getSettingsSectionStyle(config, settings))
                    .replace('[AUTOADJUST CHECKBOX STATE]', getAutoadjustCheckboxState(settings))
                    .replace('[BRIGHTNESS SLIDER VALUE]', getBrightnessSliderValue(settings))
                    .replace('[AUTOADJUST SLIDER VALUE]', getAutoAdjustSliderValue(settings));
                return done(null, modified)
            });
        });
    });
}

function updateConfiguration(handlers, config, done){
    handlers.configuration.set(config, done);
}

function updateSettings(handlers, config, done){
    const {autoadjust, brightness} = config;
    const newConfig = {autoadjust, brightness: parseInt(brightness) / 10000};
    handlers.settings.set(newConfig, done);
}

function getInputStyle(config, type){
    if(!config) return '';
    const typeConfig = config[type];
    if(!typeConfig) return '';
    if(typeConfig.error) return 'is-danger';
    if(typeConfig.success) return 'is-success';
    return '';
}

function getInputValue(config, type){
    if(!config) return '';
    const typeConfig = config[type];
    if(!typeConfig) return '';
    return typeConfig.value || ''
}

function getDangerText(config, type){
    if(!config) return '';
    const typeConfig = config[type];
    if(!typeConfig) return '';
    return typeConfig.error || ''
}

function getSuccessText(config, type){
    if(!config) return '';
    const typeConfig = config[type];
    if(!typeConfig) return '';
    return typeConfig.success || ''
}

function getSettingsSectionStyle(config, settings){
    if(!config) return 'hidden';
    if(!settings || settings.error) return 'hidden';
    const connected = Object.values(config).reduce((acc, curr) => {
        return acc && !!curr.success
    }, true);
    return connected ? '' : 'hidden';
}

function getAutoadjustCheckboxState(settings){
    if(!settings) return '';
    return !!settings.autoadjust ? 'checked' : ''
}

function getBrightnessSliderValue(settings){
    if(!settings) return '';
    const brightness = settings.brightness || 0;
    return brightness * 10000;
}

function getAutoAdjustSliderValue(settings){
    if(!settings) return '';
    const desired = settings.desired || 0;
    return desired * 10000;
}