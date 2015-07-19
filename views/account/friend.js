'use strict';

exports.getFriendList = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);
    return workflow.emit('response');
};

exports.addFriend = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.body.friendUsername,
        friendAlias = req.body.friendAlias,
        alias = req.body.alias;

    var friendUserinfo = null;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的 Username 不能为空。';
        }

        if (!friendAlias) {
            workflow.outcome.errfor.friendAlias = '朋友的 Alias 不能为空。';
        }

        if (!alias) {
            workflow.outcome.errfor.alias = '你的 Alias 不能为空。';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('checkUserExist');
    });

    workflow.on('checkUserExist', function () {

        workflow.on('checkInUserCollection', function () {
            req.app.db.models.User.findOne({
                username: friendUsername,
                nickname: friendAlias
            }, function (err, userinfo) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                if (!userinfo) {
                    workflow.outcome.errors.push('要添加的好友不存在。');
                    return workflow.emit('response');
                } else if (userinfo.username == req.user.username) {
                    workflow.outcome.errors.push('你不能添加自己为好友。');
                    return workflow.emit('response');
                } else {
                    friendUserinfo = userinfo;
                }

                workflow.emit('checkInFriendCollection');
            });
        });

        workflow.on('checkInFriendCollection', function () {
            req.app.db.models.Friend.findOne({
                username: req.user.username
            }, function (err, friendInfo) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                if (friendInfo) {
                    workflow.emit('addFriend');
                } else {
                    workflow.emit('createUserToFriend');
                }
            });
        });

        workflow.emit('checkInUserCollection');
    });

    workflow.on('createUserToFriend', function () {
        req.app.db.models.Friend.create({
            username: req.user.username,
            nickname: alias,
            friendList: []
        }, function (err) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.emit('addFriend');
        });
    });

    workflow.on('addFriend', function () {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friend) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var useridList = [];

            friend.friendList.forEach(function (userinfo) {
                useridList.push(userinfo._id);
            });

            if (useridList.indexOf(friendUserinfo._id) > -1) {
                workflow.outcome.errors.push('该好友已经存在。');
                return workflow.emit('response');
            }

            req.app.db.models.Friend.findOneAndUpdate(friend, {
                friendList: friend.friendList.push({
                    _id: friend._id
                })
            }, function (err) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                return workflow.emit('response');
            });
        });
    });

    workflow.emit('validate');
};