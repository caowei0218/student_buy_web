'use strict';

module.exports = function (app, mongoose) {

    require('./schema/User')(app, mongoose);
    require('./schema/Account')(app, mongoose);
    require('./schema/LoginAttempt')(app, mongoose);
};
