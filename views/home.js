'use strict';

// 首页
exports.index = function (req, res) {
    res.send({
        success: true,
        status: '服务器正在运行中。'
    });
};
