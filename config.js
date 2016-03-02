/*
 *   Development Environment
 *   http://localhost
 */
// exports.logDir = '/usr/local/log/cs.app.ymatou.com/';
exports.logDir = 'log';

exports = module.exports = {
    port: 3005, //node port
    tpl: {
        compress: false, //compress html
        escape: false, //build html
        cache: false //off or on cache
    },
    isDev: true, //development
    proxy: {
        host: '127.0.0.1',
        port: 3100 //8097
    }

};