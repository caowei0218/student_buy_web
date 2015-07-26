'use strict';

var yamljs = require('yamljs'),
    request = require("request");

var ANDROID_YAML_URL = 'https://raw.githubusercontent.com/caowei0218/student_buy_android/master/release/download.yml';

function getYaml(url, callback) {
    var options = {
        method: 'GET',
        url: url,
        headers: {
            'cache-control': 'no-cache'
        }
    };

    request(options, function (err, res, body) {
        if (err) {
            return callback(err);
        }

        try {
            return callback(null, yamljs.parse(body));
        } catch (err) {
            return callback(err);
        }
    });
}

function getDownloadLink(yaml) {
    var downloadLink = '',
        files = [];

    var path = null;
    yaml.forEach(function (object) {
        if (object.name == 'yue_app_release_list') {
            path = object.path;
            files = object.files;
        }
    });

    var maxVersion = 0,
        latestFile = null;
    for (var index = 0; index < files.length; index++) {
        var file = files[index];
        if (file.version > maxVersion) {
            maxVersion = file.version;
            latestFile = file;
        }
    }

    if (latestFile) {
        downloadLink = path + latestFile.name + '?raw=true';
    }

    return downloadLink;
}

exports.getLatestAndroid = function (req, res) {
    var workflow = req.app.utility.workflow(req, res);
    getYaml(ANDROID_YAML_URL, function (err, yaml) {
        if (err) {
            return workflow.emit('exception', err);
        }

        if (!yaml) {
            console.log('YAML 文件不能正常读取。');
            workflow.outcome.errors.push('服务器忙，请稍后再试。');
            return workflow.emit('response');
        }

        workflow.outcome.downloadLink = getDownloadLink(yaml);
        return workflow.emit('response');
    });
};