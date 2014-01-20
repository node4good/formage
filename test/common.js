'use strict';
global._ = require('lodash');
var chai = require('chai');
var Promise = require('mpromise');
global.should = chai.should();
global.expect = chai.expect;
require('nodestrum');
Error.stackTraceLimit = 100;
process.env.FORMAGE_DISABLE_DOMAINS = true;
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = true;

//noinspection JSUnusedLocalSymbols
global.mock_req_proto = {
    method: "get",
    session: {},
    params: {},
    query: {},
    headers: {},
    connection: {},
    admin_user: {hasPermissions: function () {return true;}}
};


function magic_throw() {
    if (process.domain) process.domain.dispose();
    var arg_str = JSON.stringify(arguments, null, 2);
    process.nextTick(function () {
        throw new Error(arg_str);
    });
}


//noinspection JSUnusedGlobalSymbols
global.mock_res_proto = {
    setHeader: function () {},
    status: function (val) {this._status = val;},
    output: {push: _.identity},
    outputEncodings: {push: _.identity},
    render: magic_throw,
    redirect: magic_throw
};


global.makeRes = function makeRes(req, done) {
    var res = _.defaults({ req: req }, mock_res_proto);
    res.send = function (status, err) {done(err);};
    return res;
};


var fs = require('fs');
global.test_post_body_multipart = fs.readFileSync('test/fixtures/test-post-body.mime', 'utf-8');
global.renderedEmbeded = fs.readFileSync('test/fixtures/rendered-embed-form.txt', 'utf-8');
global.mockFind = function mockFindFactory(arr) {
    return function mockFind() {
        return {
            populate: function mockLimit() { return this; },
            skip: function mockLimit() { return this; },
            limit: function mockLimit() { return this; },
            sort: function mockLimit() { return this; },
            exec: function mockExec(cb) {
                var p = new Promise(cb);
                p.fulfill(arr);
                return p;
            }
        };
    };
};
