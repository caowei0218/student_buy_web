'use strict';

exports.logout = function(req, res){
    var workflow = req.app.utility.workflow(req, res);
    req.logout();

    return workflow.emit('response');
};
