'use strict';

module.exports = function (app, mongoose) {
    var friendSchema = new mongoose.Schema({
        username: {type: String, unique: true},
        nickname: {type: String, unique: true},
        friendList: []
    });

    friendSchema.index({username: 1}, {unique: true});
    friendSchema.index({nickname: 1}, {unique: true});
    friendSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('Friend', friendSchema);
};
