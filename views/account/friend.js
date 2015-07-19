'use strict';

exports.getFriendList = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);
    return workflow.emit('response');
};

exports.addFriend = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.body.friendUsername;

    var friendUserinfo = null;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的 Username 不能为空。';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('checkUserExist');
    });

    workflow.on('checkUserExist', function () {

        workflow.on('checkInUserCollection', function () {
            req.app.db.models.User.findOne({
                username: friendUsername
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

            var userMap = {};

            friend.friendList.forEach(function (friend) {
                userMap[friend._id] = friend;
            });

            if (userMap[friendUserinfo._id]) {
                workflow.outcome.errors.push('该好友已经存在。');
                return workflow.emit('response');
            }

            friend.friendList.push({
                _id: friendUserinfo._id
            });

            req.app.db.models.Friend.findOneAndUpdate({
                username: req.user.username
            }, {
                friendList: friend.friendList
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