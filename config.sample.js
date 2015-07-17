'use strict';

var path = require('path');

// 端口号
exports.port = process.env.PORT || 9218;

// DB
exports.mongodb = {
    uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/student_buy'
};

// 项目信息
exports.companyName = 'Geekboys.net, Inc.';
exports.projectName = 'StudenBuy';
exports.systemEmail = 'support@sunchaoran.com';
exports.cryptoKey = 'yourCrytoKey';
exports.loginAttempts = {
    forIp: 50,
    forIpAndUser: 7,
    logExpiration: '20m'
};
exports.requireAccountVerification = false;

// 邮箱
exports.smtp = {
    from: {
        name: process.env.SMTP_FROM_NAME || exports.projectName + ' 支持团队',
        address: process.env.SMTP_FROM_ADDRESS || 'support@sunchaoran.com'
    },
    credentials: {
        user: process.env.SMTP_USERNAME || 'support@sunchaoran.com',
        password: process.env.SMTP_PASSWORD || 'yourPassword',
        host: process.env.SMTP_HOST || 'smtp.sunchaoran.com',
        port: 25,
        ssl: false
    }
};

exports.workEnv = 'development';