'use strict';

var getReturnUrl = function (req) {
    var returnUrl = req.user.defaultReturnUrl();
    if (req.session.returnUrl) {
        //returnUrl = req.session.returnUrl;
        //delete req.session.returnUrl;
    }
    return returnUrl;
};

exports.init = function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect(getReturnUrl(req));
    } else {
        res.render('./home/login/login', {
            oauthMessage: '',
            isLoginSupport: false
        });
    }
};

exports.loginSupoort = function (req, res) {
    res.render('./home/login/login', {
        oauthMessage: '',
        isLoginSupport: true
    });
};

exports.login = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
        if (!req.body.username) {
            workflow.outcome.errfor.username = '电子邮件或密码必须填写';
        }

        if (!req.body.password) {
            workflow.outcome.errfor.password = '密码必须填写';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('abuseFilter');
    });

    workflow.on('abuseFilter', function () {
        var getIpCount = function (done) {
            var conditions = {ip: req.ip};
            req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
                if (err) {
                    return done(err);
                }

                done(null, count);
            });
        };

        var getIpUserCount = function (done) {
            var conditions = {ip: req.ip, user: req.body.username};
            req.app.db.models.LoginAttempt.count(conditions, function (err, count) {
                if (err) {
                    return done(err);
                }

                done(null, count);
            });
        };

        var asyncFinally = function (err, results) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
                workflow.outcome.errors.push('你尝试登录的次数过多，请稍后再试。');
                return workflow.emit('response');
            } else {
                workflow.emit('attemptLogin');
            }
        };

        require('async').parallel({ip: getIpCount, ipUser: getIpUserCount}, asyncFinally);
    });

    workflow.on('attemptLogin', function () {
        req._passport.instance.authenticate('local', function (err, user, info) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!user) {
                var fieldsToSet = {ip: req.ip, user: req.body.username};
                req.app.db.models.LoginAttempt.create(fieldsToSet, function (err, doc) {
                    if (err) {
                        return workflow.emit('exception', err);
                    }

                    workflow.outcome.errors.push('输入了错误的信息 或 你的账号是不活跃的。');
                    return workflow.emit('response');
                });
            }
            else {
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