'use strict';

exports = module.exports = function (app, passport) {
    var LocalStrategy = require('passport-local').Strategy;

    passport.use(new LocalStrategy(
        function (username, password, done) {
            var conditions = {isActive: 'yes'};
            if (username.indexOf('@') === -1) {
                conditions.username = username;
            } else {
                conditions.email = username;
            }

            app.db.models.User.findOne(conditions, function (err, user) {
                if (err) {
                    return done(err);
                }

                if (!user) {
                    console.log('|Passport| -> 未知的用户');
                    return done(null, false, {message: '未知的用户'});
                }

                app.db.models.User.validatePassword(password, user.password, function (err, isValid) {
                    if (err) {
                        return done(err);
                    }

                    if (!isValid) {
                        console.log('|Passport| -> 错误的密码');
                        return done(null, false, {message: '错误的密码'});
                    }

                    return done(null, user);
                });
            });
        }
    ));

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        app.db.models.User.findOne({_id: id}).populate('roles.admin').populate('roles.account').exec(function (err, user) {
            if (user && user.roles && user.roles.admin) {
                user.roles.admin.populate("groups", function (err, admin) {
                    done(err, user);
                });
            }
            else {
                done(err, user);
            }
        });
    });
};
