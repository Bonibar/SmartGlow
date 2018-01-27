'use strict';

const hueClient = require('../../hue');

module.exports = (state) => {
    return {
        connect(config, done){
            const host = config.bridge.host;
            if(!host || !host.length) return done();
            state.hue = hueClient(config);
            state.hue.lights.list((err) => {
                if(err){
                    const error = new Error(`Connection to ${host} refused`);
                    this._onHueError(error);
                    state.error.hue = error;
                    state.success.hue = null;
                    state.hue = null;
                    return done(err);
                }
                state.error.hue = null;
                state.success.hue = `Connected to ${host}`;
                done();
            });
        },
        disconnect(){
            state.hue = null;
            state.error.hue = null;
            state.success.hue = null;
        },
        getConfiguration(){
            if(!state.hue) return null;
            return state.hue.config;
        },
        _onHueError(err){
            console.log(`[Philips Hue][Error] ${err.message}.`);
        }
    };
};
