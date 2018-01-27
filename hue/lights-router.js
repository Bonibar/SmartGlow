'use strict';

module.exports = (client) => {
    return {
        list(done){
            client.get('lights', null, (err, res, body) => {
                if(err) return done(err);
                const data = Object.entries(body).reduce((acc, [key, value]) => {
                    return {...acc, [key]: this._formatLightData(value)}
                }, {});
                return done(null, data);
            });
        },
        get(id, done){
            client.get(`lights/${id}`, null, (err, res, body) => {
                if(err) return done(err);
                const data = this._formatLightData(body);
                return done(null, data);
            });
        },
        set(id, state, done){
            const {on, brightness} = state;
            const body = on === false
                ? {on}
                : {on, bri: Math.round(brightness * 253 + 1)};
            client.put(`lights/${id}/state`, body, (err, res, body) => {
                if(err) return done(err);
                return done(null, body);
            });
        },
        _formatLightData(light){
            const {state} = light;
            return {
                on: state.on,
                brightness: (state.bri - 1) / 253
            }
        }
    }
};