'use strict';
global._ = require('lodash');
global.chai = require('chai');
global.should = chai.should();
global.expect = require('chai').expect
require('nodestrum');
Error.stackTraceLimit = 100;
chai.Assertion.includeStack = true;
process.env.FORMAGE_DISABLE_DOMAINS = true;
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = true;

//noinspection JSUnusedLocalSymbols
global.mock_req_proto = {
    params: {},
    query: {},
    headers: {},
    connection: {},
    admin_user: {hasPermissions: function (model, action) {return true}}
};


global.mock_res_proto = {
    setHeader: function () {},
    status: function (val) {this._status = val;},
    output: {push: _.identity},
    outputEncodings: {push: _.identity},
    render: function () {throw new Error(arguments);},
    redirect: function () {throw new Error(arguments);}
};


global.makeRes = function makeRes(req, done) {
    var res = _.defaults({ req: req }, mock_res_proto);
    res.send = function (status, err) {done(err);};
    return res;
};


var fs = require('fs');
global.test_post_body_multipart = fs.readFileSync('test/fixtures/test-post-body.mime', 'utf-8');
