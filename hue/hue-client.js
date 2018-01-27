'use strict';

const request = require('request');

module.exports = (config) => {
    const {bridge: {host}, id} = config;
    return {
        config,

        get(uri, qs, done){
            request.get(this._formatURL(uri), this._requestOptions({qs}), this._responseMiddleware(done));
        },
        post(uri, body, done){
            request.post(this._formatURL(uri), this._requestOptions({body}), this._responseMiddleware(done));
        },
        put(uri, body, done){
            request.put(this._formatURL(uri), this._requestOptions({body}), this._responseMiddleware(done));
        },
        del(uri, qs, done){
            request.del(this._formatURL(uri), this._requestOptions({qs}), this._responseMiddleware(done));
        },
        _formatURL(uri){
            return `http://${host}/api/${id}/${uri}`
        },
        _requestOptions(extend){
            return {timeout: 3000, json: true, ...extend};
        },
        _responseMiddleware(done){
            return (err, res, body) => {
                if(err) return done(err);
                return done(this._hueError(body), res, body);
            };
        },
        _hueError(body){
            if(Array.isArray(body)) {
                return body.reduce((error, entry) => {
                    if(error) return error;
                    return this._hueError(entry);
                }, null);
            }
            const error = body.error;
            return error ? new Error(error.description) : null;
        }
    };
};
