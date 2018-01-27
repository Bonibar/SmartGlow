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

function readIndexFromFile(handlers, done){
    handlers.configuration.get((err, config) => {
        if(err) return done(err);
        fs.readFile(path.resolve(__dirname, 'index.html'), 'utf8', (err, content) => {
            if(err) return done(err);
            const modified = content
                .replace('[MQTT INPUT STYLE]', getInputStyle(config, 'mqtt'))
                .replace('[MQTT INPUT VALUE]', getInputValue(config, 'mqtt'))
                .replace('[MQTT DANGER TEXT]', getDangerText(config, 'mqtt'))
                .replace('[MQTT SUCCESS TEXT]', getSuccessText(config, 'mqtt'))
                .replace('[HUE INPUT STYLE]', getInputStyle(config, 'hue'))
                .replace('[HUE INPUT VALUE]', getInputValue(config, 'hue'))
                .replace('[HUE DANGER TEXT]', getDangerText(config, 'hue'))
                .replace('[HUE SUCCESS TEXT]', getSuccessText(config, 'hue'));
            return done(null, modified)
        });
    });
}

function updateConfiguration(handlers, config, done){
    handlers.configuration.set(config, done);
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