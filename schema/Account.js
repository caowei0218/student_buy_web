'use strict';

module.exports = function (app, mongoose) {
    var accountSchema = new mongoose.Schema({
        user: {
            id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            name: {type: String, default: ''}
        },
        isVerified: {type: String, default: ''},
        verificationToken: {type: String, default: ''}
    });
    accountSchema.index({user: 1});
    accountSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('Account', accountSchema);
};
