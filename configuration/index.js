'use strict';

const fs = require('fs');
const _ = require('lodash');
const utils = require('../utils');

module.exports = (path) => {
    const state = {
        config: null,
        error: null,
        handlers: {}
    };
    const configurationFileReader = readConfigurationFile(state, path);
    const configurationFileWritter = writeConfigurationFile(state, path);
    setInterval(configurationFileReader, 1000);
    return {
        get(done){
            const {error, config} = state;
            if(!error && !config) return configurationFileReader(done);
            return done(error, config);
        },
        set(config, done){
            configurationFileWritter(config, err => {
                if(err) return done(err);
                configurationFileReader(done);
            });
        },
        on(event, handler){
            state.handlers[event] = handler;
        }
    }
};

function writeConfigurationFile(state, path){
    return (config, done) => {
        writeJSONFile(path, config, (error, config) => {
            updateState(state, {error, config}, hasChanged => {
                if(hasChanged){
                    const {update} = state.handlers;
                    update && update(state.error, state.config);
                }
                done && done(state.error, state.config);
            });
        });
    };
}

function writeJSONFile(path, json, done){
    fs.writeFile(path, JSON.stringify(json), 'utf8', err => {
        if(err) return done(new Error('Could not write configuration file.'));
        return done(null, json);
    });
}

function readConfigurationFile(state, path){
    return (done) => {
        readJSONFile(path, (error, config) => {
            updateState(state, {error, config}, hasChanged => {
                if(hasChanged){
                    const {update} = state.handlers;
                    update && update(state.error, state.config);
                }
                done && done(state.error, state.config);
            });
        });
    };
}

function readJSONFile(path, done){
    fs.readFile(path, 'utf8', (err, data) => {
        if(err) return done(new Error('Could not read configuration file.'));
        return utils.JSON.parse(data, (err, parsed) => {
            if(err) return done(new Error('Could not parse configuration file.'));
            return done(null, parsed);
        });
    });
}

function updateState(state, nextState, done){
    const isEqual = {
        config: _.isEqual(state.config, nextState.config),
        error: (state.error && state.error.message) === (nextState.error && nextState.error.message)
    };
    Object.assign(state, nextState);
    return done(!isEqual.config || !isEqual.error);
}