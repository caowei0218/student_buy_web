'use strict';

exports.http404 = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);
    workflow.outcome.errors.push('你请求的资源没有找到。');
    res.status(404);
    return workflow.emit('response');
};

exports.http500 = function (err, req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    if (req.app.get('env') === 'development') {
        workflow.outcome.errors.push(err);
        console.log(err.stack);
    } else {
        workflow.outcome.errors.push('服务器发生了一些内部错误。');
    }
    res.status(500);
    return workflow.emit('response');
};
