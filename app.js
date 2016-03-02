'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Session = require('express-session');
var UUID = require('uuid');

var app = express();

var conf = require('./config');

var template = require('art-template');
//template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.use(Session({
    genid: function(req) {
        return UUID.v1(); // use UUIDs for session IDs
    },
    cookie: {
        maxAge: 60000
    },
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

app.use('/session', function(req, res, next) {
    var sess = req.session;
    if (sess.views) {
        sess.views++;
        res.setHeader('Content-Type', 'text/html');
        res.write('<p>views: ' + sess.views + '</p>');
        res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>');
        res.end();
    } else {
        sess.views = 1;
        res.end('welcome to the session demo. refresh!');
    }
});

app.all('*', function(req, res, next) {
    console.log('url: ' + req.url);
    next();
});

app.all('/hi', function(req, res) {
    res.send('Hi world');
});

require('./routes')(app, express);

var serveIndex = require('serve-index');
app.use('/build', serveIndex(__dirname + '/public', {
    'icons': true,
    'stylesheet': __dirname + '/views/style.css',
    'template': __dirname + '/views/directory.html'
}));


// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    // log.Error(err.message, req);
    res.status(err.status || 500);
    res.render('layout/error', {
        message: err.message,
        error: {
            status: err.status
        }
    });
});

module.exports = app;