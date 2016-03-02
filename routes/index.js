'use strict';
// var proxy = require('../proxy');
var util = require('../util');

module.exports = function(app, express) {
    // tpl
    app.all('/list', require('../controller/demo').list);
    // param
    app.all('/test/:id', require('../controller/demo').test);
    // file
    app.all('/file', require('../controller/demo').file);

    //接口相关
    app.use('/api/', require('./_api')(express));

};
