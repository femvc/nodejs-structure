'use strict';
var config = require('../config');
var Formidable = require('formidable');

exports.list = function(req, res) {
    // res.send('hello  follow.getList');

    // Demo page
    res.render('demo', {
        title: '简单示例页面'
    });
};

exports.test = function(req, res) {
    var result = {
        cookie: req.cookie,
        params: req.params,
        query: req.query,
        body: req.body
    };

    res.send(result);
};

exports.file = function(req, res) {
    var form = new Formidable.IncomingForm();
    form.uploadDir = './public';
    form.keepExtensions = true;

    form.parse(req, function(err, fields, files) {
        console.log(fields);
        console.log(files);

        res.send('ok');
    });
};
