'use strict';

exports.init = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect(req.user.defaultReturnUrl());
    } else {
        res.render('./home/reset/reset');
    }
};

exports.setPassword = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.body.password) {
            workflow.outcome.errfor.password = '密码必须填写';
        } else if (!req.body.repassword) {
            workflow.outcome.errfor.repassword = '密码确认必须填写';
        } else if (req.body.password !== req.body.repassword) {
            workflow.outcome.errfor.repassword = '两次密码不一致';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('findUser');
    });

    workflow.on('findUser', function () {
        var conditions = {
            email: req.params.email,
            resetPasswordExpires: {$gt: Date.now()}
        };
        req.app.db.models.User.findOne(conditions, function (err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!user) {
                workflow.outcome.errors.push('Invalid request.');
                return workflow.emit('response');
            }

            req.app.db.models.User.validatePassword(req.params.token, user.resetPasswordToken, function (err, isValid) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                if (!isValid) {
                    workflow.outcome.errors.push('错误的URL地址，非法的请求，请从邮箱重新打开链接。');
                    return workflow.emit('response');
                }

                workflow.emit('patchUser', user);
            });
        });
    });

    workflow.on('patchUser', function (user) {
        req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var fieldsToSet = {password: hash, resetPasswordToken: ''};
            req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function (err, user) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });
    });

    workflow.emit('validate');
};
