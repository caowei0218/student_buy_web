'use strict';

exports.getAccountInfo = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    if (!req.user) {
        return workflow.emit('exception');
    }

    var fieldsToSet = {
        username: req.user.username,
        email: req.user.email
    };

    console.log(fieldsToSet);
    console.log(req.user);

    workflow.on('getAccountInfo', function () {
        req.app.db.models.User.findOne(fieldsToSet, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            res.send(userinfo);
        });
    });

    workflow.emit('getAccountInfo');
};