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

function getDownloadObject(yaml) {
    var files = [];

    var path = null;
    yaml.forEach(function (object) {
        if (object.name == 'yue_app_release_list') {
            path = object.path;
            files = object.files;
        }
    });

    // 比较版本，找出最新版本
    var maxVersion = [0, 0, 0],
        latestFile = null;
    for (var index = 0; index < files.length; index++) {
        var file = files[index],
            version = file.version.split('.');
        if (version[0] > maxVersion[0] || version[1] > maxVersion[1] || version[2] > maxVersion[2]) {
            maxVersion = version;
            latestFile = file;
        }
    }

    if (latestFile) {
        file.downloadLink = path + latestFile.name + '?raw=true';
    }

    return file;
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

        var downloadObject = getDownloadObject(yaml);

        workflow.outcome.version = downloadObject.version;
        workflow.outcome.downloadLink = downloadObject.downloadLink;
        return workflow.emit('response');
    });
};