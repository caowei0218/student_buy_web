'use strict';

// OK
exports.getFriendList = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('getFriendList', function () {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friendInfo) {
            if (err) {
                return workflow.emit('exception', err);
            }


            if (!friendInfo) {
                workflow.outcome.errors.push('该用户现在还没有好友。');
                return workflow.emit('response');
            }

            var friendMap = {};
            friendInfo.friendList.forEach(function (userinfo) {
                friendMap[userinfo._id] = userinfo;
            });

            var filter = {
                password: 0,
                isAdmin: 0,
                roles: 0,
                __v: 0
            };

            req.app.db.models.User.find({}, filter, function (err, userList) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                var friendList = [];

                userList.forEach(function (userinfo) {
                    if (friendMap[userinfo._id]) {
                        userinfo._doc.alias = friendMap[userinfo._id].alias;
                        friendList.push(userinfo);
                    }
                });

                workflow.outcome.friendList = friendList;
                return workflow.emit('response');
            });
        });
    });


    return workflow.emit('getFriendList');
};

// OK
exports.getFriendInfo = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.params.name;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的用户名不能为空。';
        }

        if (friendUsername == req.user.username) {
            workflow.outcome.errors.push('好友用户名与你用户名相同。');
            return workflow.emit('response');
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('checkUserExist');
    });

    workflow.on('checkUserExist', function () {
        var filter = {
            password: 0,
            isAdmin: 0,
            roles: 0,
            __v: 0
        };

        req.app.db.models.User.findOne({
            username: friendUsername
        }, filter, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!userinfo) {
                workflow.outcome.errors.push('该用户不存在。');
                return workflow.emit('response');
            }

            workflow.emit('getFriendInfo', userinfo);
        });
    });

    workflow.on('getFriendInfo', function (userinfo) {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friendInfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            var isYourFriend = false;

            friendInfo && friendInfo.friendList.forEach(function (friend) {
                if (friend._id.toString() == userinfo._id.toString()) {
                    isYourFriend = true;
                    workflow.outcome.friendinfo = userinfo;
                    return workflow.emit('response');
                }
            });

            if (!isYourFriend) {
                workflow.outcome.errors.push('该用户不是你的好友。');
                return workflow.emit('response');
            }
        });
    });

    workflow.emit('validate');
};

exports.addFriend = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.body.friendUsername,
        friendAlias = req.body.friendAlias ? req.body.friendAlias.trim() : '',
        friendUserinfo = null;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的用户名不能为空。';
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
            nickname: req.user.nickname,
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

            friend.friendList.forEach(function (userinfo) {
                userMap[userinfo._id] = userinfo;
            });

            if (userMap[friendUserinfo._id]) {
                workflow.outcome.errors.push('该好友已经存在。');
                return workflow.emit('response');
            }

            friend.friendList.push({
                _id: friendUserinfo._id,
                alias: friendAlias
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

exports.deleteFriend = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.body.friendUsername;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的用户名不能为空。';
        }

        if (workflow.hasErrors()) {
            return workflow.emit('response');
        }

        workflow.emit('checkInFriendCollection');
    });

    workflow.on('checkInFriendCollection', function () {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friendInfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!friendInfo) {
                workflow.outcome.errors.push('该用户现在还没有好友。');
                return workflow.emit('response');
            }

            workflow.emit('findUserId');
        });
    });

    workflow.on('findUserId', function () {
        req.app.db.models.User.findOne({
            username: friendUsername
        }, function (err, userinfo) {
            if (err) {
                return workflow.emit('exception', err);
            }

            if (!userinfo) {
                workflow.outcome.errors.push('要删除的好友不存在。');
                return workflow.emit('response');
            }

            workflow.emit('deleteFriend', userinfo._id);
        });
    });

    workflow.on('deleteFriend', function (_id) {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friend) {
            if (err) {
                return workflow.emit('exception', err);
            }

            for (var index = 0; index < friend.friendList.length; index++) {
                var friendInfo = friend.friendList[index];
                if (friendInfo._id.toString() === _id.toString()) {
                    friend.friendList.splice(index, 1);
                    break;
                }
            }

            if (friend.friendList.length == 0) {
                friend.remove(function (err, friendInfo) {
                    if (err) {
                        return workflow.emit('exception', err);
                    }
                    return workflow.emit('response');
                });
            } else {
                req.app.db.models.Friend.findOneAndUpdate({
                    username: req.user.username
                }, {
                    friendList: friend.friendList
                }, function (err, friendInfo) {
                    if (err) {
                        return workflow.emit('exception', err);
                    }

                    return workflow.emit('response');
                });
            }

        });
    });

    workflow.emit('validate');
};

// OK
exports.setFriendAlias = function (req, res) {

    var workflow = req.app.utility.workflow(req, res);

    var friendUsername = req.body.friendUsername,
        friendAlias = req.body.friendAlias,
        friendUserinfo = null;

    workflow.on('validate', function () {
        if (!friendUsername) {
            workflow.outcome.errfor.friendUsername = '朋友的用户名不能为空。';
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
                    workflow.outcome.errors.push('要设置别名的好友不存在。');
                    return workflow.emit('response');
                } else if (userinfo.username == req.user.username) {
                    workflow.outcome.errors.push('你不能给自己设置别名。');
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
                    workflow.emit('setFriendAlias');
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
            nickname: req.user.nickname,
            friendList: []
        }, function (err) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.emit('setFriendAlias');
        });
    });

    workflow.on('setFriendAlias', function () {
        req.app.db.models.Friend.findOne({
            username: req.user.username
        }, function (err, friend) {
            if (err) {
                return workflow.emit('exception', err);
            }

            friend.friendList.forEach(function (userinfo) {

                if (userinfo._id.toString() == friendUserinfo._id.toString()) {
                    userinfo._doc.alias = friendAlias;
                }
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