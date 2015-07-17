'use strict';

exports.init = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect(req.user.defaultReturnUrl());
    } else {
        res.render('home/forgot/forgot');
    }
};

exports.sendMail = function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.body.email) {
            workflow.outcome.errfor.email = '电子邮件必须填写';
            return workflow.emit('response');
        }

        workflow.emit('generateToken');
    });

    workflow.on('generateToken', function () {
        var crypto = require('crypto');
        crypto.randomBytes(21, function (err, buf) {
            if (err) {
                return next(err);
            }

            var token = buf.toString('hex');
            req.app.db.models.User.encryptPassword(token, function (err, hash) {
                if (err) {
                    return next(err);
                }

                workflow.emit('patchUser', token, hash);
            });
        });
    });

    workflow.on('patchUser', function (token, hash) {
        var conditions = {email: req.body.email.toLowerCase()};
        var fieldsToSet = {
            resetPasswordToken: hash,
            resetPasswordExpires: Date.now() + 10000000
        };
        req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function (err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!user) {
                workflow.outcome.errfor.email = '不正确的邮箱或用户名';
                return workflow.emit('response');
            }

            workflow.emit('sendEmail', token, user);
        });
    });

    workflow.on('sendEmail', function (token, user) {
        var host = req.headers.host;
        if (host === ('127.0.0.1' + ':' + req.app.config.port) && req.app.get('env') !== 'development') {
            host = req.app.config.websiteAddress;
        }

        req.app.utility.sendmail(req, res, {
            from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
            to: user.email,
            subject: '重置您的 ' + req.app.config.projectName + ' 密码',
            textPath: 'home/forgot/forgotemail/emailText',
            htmlPath: 'home/forgot/forgotemail/emailHtml',
            locals: {
                username: user.username,
                resetLink: req.protocol + '://' + host + '/reset/' + user.email + '/' + token + '/',
                projectName: req.app.config.projectName
            },
            success: function (message) {
                workflow.emit('response');
            },
            error: function (err) {
                workflow.outcome.errors.push('发送错误: ' + err);
                workflow.emit('response');
            }
        });
    });

    workflow.emit('validate');
};
