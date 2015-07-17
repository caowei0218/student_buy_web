'use strict';

// 网站首页
exports.index = function(req, res){
    res.send({
        code: 'OK',
        info: '服务器正在运行中。'
    });
};
