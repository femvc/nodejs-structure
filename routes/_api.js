'use strict';
var http = require('http');
var querystring = require('querystring');
//var express = require('express');
var config = require('../config');

module.exports = function (express) {
    var route = express.Router();
    // /api/Returns/ReturnBill/CreateReturnApplyBill

    // http://api.cs.ymatou.com/api/Returns/ReturnBill/CreateReturnApplyBill
    route.all('*', function (req, res) {
        var data = req.body;

        // data.ReturnRemark = decodeURIComponent(data.ReturnRemark || '');

        data = JSON.stringify(data);
        console.log(data);
        console.log(req.query);
        // {a:1,b:2} -> a=1&b=2 
        var str = querystring.stringify(req.query);
        var url = '/api' + req.path + (str ? '?' + str : str);
        console.log(url);

        var opt = {
            method: 'POST',
            host: config.proxy.host,
            port: config.proxy.port,
            // path: '/api/Returns/ReturnBill/CreateReturnApplyBill?AccessToken=2B2A77E7B7567A7CA768EDDCAE38DC819F8D82E893AE7F86BA286B3E65BAD714CBB7D147832FB3766353BE0BCFFADBFA72C907A07448159D',
            path: url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        var request = http.request(opt, function (serverFeedback) {
            if (serverFeedback.statusCode == 200) {
                var body = '';
                serverFeedback.on('data', function (data) {
                        body += data;
                    })
                    .on('end', function () {
                        // console.log(200, body);
                        res.end(body);
                    });
            }
            else {
                // console.log(500, 'error');
                res.end('{Code:500,Msg:"Server error."}');
            }
        });
        request.write(data + '\n');
        request.end();

    });

    return route;

};
