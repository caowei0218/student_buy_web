'use strict';

var constants = require('../../common/constants');

exports.getAccountInfo = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    if (!req.user) {
        return workflow.emit('exception');
    }

    var fieldsToSet = {
        username: req.user.username,
        email: req.user.email
    };

    console.log(req.user);

    var filter = {
        password: 0,
        isAdmin: 0,
        roles: 0,
        __v: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0
    };

    workflow.on('getAccountInfo', function () {
        req.app.db.models.User.findOne(fieldsToSet, filter, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.userinfo = userinfo;
            return workflow.emit('response');
        });
    });

    workflow.emit('getAccountInfo');
};

exports.updateAccountInfo = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    var email = req.user.email,
        username = req.user.username,
        address = req.body.address ? req.body.address.trim() : '',
        nickname = req.body.nickname ? req.body.nickname.trim() : '',
        gender = req.body.gender ? req.body.gender : constants.GENDER_NONE,
        city = req.body.city ? req.body.city.trim() : '',
        description = req.body.description ? req.body.description.trim() : '',
        phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.trim() : '';

    console.log(email);
    console.log(username);

    workflow.on('validate', function () {
        if (!nickname) {
            workflow.outcome.errfor.nickname = '昵称必须填写';
        } else if (nickname.length > 16) {
            workflow.outcome.errfor.nickname = '昵称长度不得超过 16 位';
        }

        if (!email) {
            workflow.outcome.errfor.email = '电子邮件必须填写';
        } else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(email)) {
            workflow.outcome.errfor.email = '电子邮件格式错误';
        }

        if (description.length > 256) {
            workflow.outcome.errfor.nickname = '自我介绍内容必须在 256 字符以内。';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('checkUserExist');
    });

    workflow.on('checkUserExist', function () {
        req.app.db.models.User.findOne({
            username: username,
            email: email,
            isActive: 'yes'
        }, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (userinfo) {
                workflow.emit('checkNickname', userinfo);
            } else {
                workflow.outcome.errors.push('当前用户可能不是活跃用户。');
                return workflow.emit('response');
            }
        });
    });

    workflow.on('checkNickname', function (yourUserinfo) {

        req.app.db.models.User.findOne({nickname: nickname}, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!userinfo || userinfo._id == yourUserinfo._id) {
                workflow.emit('updateAccountInfo');
            } else {
                workflow.outcome.errfor.nickname = '当前昵称已经存在。';
                return workflow.emit('response');
            }
        });
    });

    workflow.on('updateAccountInfo', function () {

        var fieldsToSet = {
            nickname: nickname,
            gender: gender,
            phoneNumber: phoneNumber,
            city: city,
            address: address,
            description: description
        };

        var filter = {
            password: 0,
            isAdmin: 0,
            roles: 0,
            __v: 0,
            resetPasswordToken: 0,
            resetPasswordExpires: 0
        };

        req.app.db.models.User.findOneAndUpdate({
            username: username,
            email: email
        }, fieldsToSet, filter, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.userinfo = userinfo;
            return workflow.emit('response');
        });
    });

    workflow.emit('validate');
};


exports.setUserNickname = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    if (!req.user) {
        return workflow.emit('exception');
    }

    var alias = req.body.alias;
    if (!alias) {
        workflow.outcome.errfor.alias = '你的昵称不能为空。';
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

exports.getUserNickname = function (req, res) {
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