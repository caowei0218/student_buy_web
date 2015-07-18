'use strict';

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.set('X-Auth-Required', 'true');
    req.session.returnUrl = req.originalUrl;
    var error = {
        success: false,
        errors: ['该用户没有登录。'],
        errfor: {}
    };
    res.send(error);
}

function ensureAdmin(req, res, next) {
    if (req.user.canPlayRoleOf('admin')) {
        return next();
    }

    var error = {
        success: false,
        errors: ['该用户没有登录。'],
        errfor: {}
    };
    res.send(error);
}

function ensureAccount(req, res, next) {
    if (req.user.canPlayRoleOf('account')) {
        if (req.app.config.requireAccountVerification) {
            if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
                return res.redirect('/account/verification/');
            }
        }
        return next();
    }
    var error = {
        success: false,
        errors: ['该用户没有登录。'],
        errfor: {}
    };
    res.send(error);
}

module.exports = function (app, passport) {

    app.get('/checklogin/', function (req, res) {
        if (req.isAuthenticated() && req.user.canPlayRoleOf('account')) {
            res.send({
                success: true
            });
        } else {
            res.send({
                success: false
            });
        }
    });

    // Home
    app.get('/', require('./views/home').index);

    // Login 用户登录
    app.post('/login/', require('./views/account/login').login);

    //// Logout 用户登出
    app.get('/logout/', require('./views/account/logout').logout);
    //
    //// Signup 用户注册
    app.post('/signup/', require('./views/account/signup').signup);

    //// Reset 用户重置密码
    app.get('/reset/:email/:token/', require('./views/account/reset').init);
    app.put('/reset/:email/:token/', require('./views/account/reset').setPassword);

    // Forgot 用户找回密码
    app.post('/forgot/', require('./views/account/forgot').sendMail);

    // Account 用户信息管理
    app.all('/account*', ensureAuthenticated);
    app.all('/account*', ensureAccount);
    app.get('/account/verification/', require('./views/account/verification').init);
    app.post('/account/verification/', require('./views/account/verification').resendVerification);
    app.get('/account/verification/:token/', require('./views/account/verification').verify);

    app.get('/account/info/', require('./views/account/account').getAccountInfo);

    // route not found
    app.all('*', require('./views/error/error').http404);
};
