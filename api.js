'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();
var port = 3100;

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.all('*', function(req, res, next) {
    console.log(req.url);

    var result = {
        cookie: req.cookie,
        params: req.params,
        query: req.query,
        body: req.body,
        test: true
    };

    console.log(result);

    res.send(result);
});

var server = app.listen(port, function() {
    console.log('Example app listening at http://0.0.0.0:%s', port);
});
