'use strict';

exports.init = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect(req.user.defaultReturnUrl());
    } else {
        res.render('./home/signup/signup', {
            oauthMessage: ''
        });
    }
};

exports.signup = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.body.username) {
            workflow.outcome.errfor.username = '用户名必须填写';
        } else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
            workflow.outcome.errfor.username = '用户名只允许使用字母和数字, \'-\', \'_\'';
        }

        if (!req.body.nickname) {
            workflow.outcome.errfor.nickname = '昵称必须填写';
        } else if (req.body.nickname.length > 16) {
            workflow.outcome.errfor.nickname = '昵称长度不得超过 16 位';
        }

        if (!req.body.email) {
            workflow.outcome.errfor.email = '电子邮件必须填写';
        } else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
            workflow.outcome.errfor.email = '电子邮件格式错误';
        }

        if (!req.body.password) {
            workflow.outcome.errfor.password = '密码必须填写';
        } else if (req.body.password.length < 6) {
            workflow.outcome.errfor.password = '请输入长度大于6位的密码';
        } else if (!req.body.repassword) {
            workflow.outcome.errfor.password = '密码确认必须填写';
        } else if (req.body.password != req.body.repassword) {
            workflow.outcome.errfor.repassword = '两次密码不一致';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('duplicateUsernameCheck');
    });

    workflow.on('duplicateUsernameCheck', function () {
        req.app.db.models.User.findOne({username: req.body.username}, function (err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (user) {
                workflow.outcome.errfor.username = '用户名已经存在';
                return workflow.emit('response');
            }

            workflow.emit('duplicateNicknameCheck');
        });
    });

    workflow.on('duplicateNicknameCheck', function () {
        req.app.db.models.User.findOne({nickname: req.body.nickname}, function (err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (user) {
                workflow.outcome.errfor.nickname = '该昵称已被其他用户使用';
                return workflow.emit('response');
            }

            workflow.emit('duplicateEmailCheck');
        });
    });

    workflow.on('duplicateEmailCheck', function () {
        req.app.db.models.User.findOne({email: req.body.email.toLowerCase()}, function (err, user) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (user) {
                workflow.outcome.errfor.email = '邮箱已经被注册';
                return workflow.emit('response');
            }

            workflow.emit('createUser');
        });
    });

    workflow.on('createUser', function () {
        req.app.db.models.User.encryptPassword(req.body.password, function (err, hash) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var fieldsToSet = {
                isActive: 'yes',
                username: req.body.username,
                nickname: req.body.username,
                email: req.body.email.toLowerCase(),
                password: hash,
                search: [
                    req.body.username,
                    req.body.email
                ]
            };
            req.app.db.models.User.create(fieldsToSet, function (err, user) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                workflow.user = user;
                workflow.emit('createAccount');
            });
        });
    });

    workflow.on('createAccount', function () {
        var fieldsToSet = {
            isVerified: req.app.config.requireAccountVerification ? 'no' : 'yes',
            'name.full': workflow.user.username,
            user: {
                id: workflow.user._id,
                name: workflow.user.username
            },
            search: [
                workflow.user.username
            ]
        };

        req.app.db.models.Account.create(fieldsToSet, function (err, account) {
            if (err) {
                return workflow.emit('exception', err);
            }

            //update user with account
            workflow.user.roles.account = account._id;
            workflow.user.save(function (err, user) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                workflow.emit('sendWelcomeEmail');
            });
        });
    });

    workflow.on('sendWelcomeEmail', function () {

        var loginURL = req.protocol + '://' + req.headers.host;

        if (req.app.get('env') !== 'development') {
            loginURL = req.app.config.websiteAddress;
        }

        req.app.utility.sendmail(req, res, {
            from: req.app.config.smtp.from.name + ' <' + req.app.config.smtp.from.address + '>',
            to: req.body.email,
            subject: '您的 ' + req.app.config.projectName + ' 账户',
            textPath: 'account/signupemail/emailText',
            htmlPath: 'account/signupemail/emailHtml',
            locals: {
                username: req.body.username,
                email: req.body.email,
                loginURL: loginURL,
                projectName: req.app.config.projectName
            },
            success: function (message) {
                workflow.emit('logUserIn');
            },
            error: function (err) {
                console.log('发送 Welcome Email 出错: ' + err);
                workflow.emit('logUserIn');
            }
        });
    });

    workflow.on('logUserIn', function () {
        req._passport.instance.authenticate('local', function (err, user, info) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!user) {
                workflow.outcome.errors.push('Login failed. That is strange.');
                return workflow.emit('response');
            } else {
                req.login(user, function (err) {
                    if (err) {
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('response');
                });
            }
        })(req, res);
    });

    workflow.emit('validate');
};
