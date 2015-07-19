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

            workflow.outcome.userinfo = userinfo;
            return workflow.emit('response');
        });
    });

    workflow.emit('getAccountInfo');
};

exports.setUserAlias = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    if (!req.user) {
        return workflow.emit('exception');
    }

    var alias = req.body.alias;
    if (!alias) {
        workflow.outcome.errfor.alias = '你的 Alias 不能为空。';
        return workflow.emit('response');
    }

    var fieldsToSet = {
        username: req.user.username,
        email: req.user.email
    };

    workflow.on('setUserAlias', function () {
        req.app.db.models.User.findOneAndUpdate(fieldsToSet, {
            nickname: alias
        }, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.nickname = userinfo.nickname;
            return workflow.emit('response');
        });
    });

    workflow.emit('setUserAlias');
};

exports.getUserAlias = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    if (!req.user) {
        return workflow.emit('exception');
    }

    var fieldsToSet = {
        username: req.user.username,
        email: req.user.email
    };

    workflow.on('getUserAlias', function () {
        req.app.db.models.User.findOne(fieldsToSet, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.nickname = userinfo.nickname;
            return workflow.emit('response');
        });
    });

    workflow.emit('getUserAlias');
};