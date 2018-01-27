'use strict';

module.exports = {
    JSON: {
        parse(data, done){
            try{
                const parsed = JSON.parse(data);
                return done(null, parsed);
            }catch(err){
                return done(err);
            }
        }
    },
    enum: {
        fromArray(array){
            return Object.freeze(array.reduce((acc, entry) => {
                return {...acc, [entry]: Object.keys(acc).length};
            }, {}));
        }
    }
};