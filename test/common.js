'use strict';
var Path = require('path');
global.MONGOOSE_DRIVER_PATH = Path.dirname(require.resolve('grist/driver'));
global.CONN_STR_PREFIX = 'grist://formage-test-data';

var _ = require('lodash');
var chai = require('chai');
var Promise = require('mpromise');
var fs = require('fs');

process.env.FORMAGE_DISABLE_DOMAINS = true;
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = true;

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
    var arg_str = arguments.length > 1 ? JSON.stringify(arguments, null, 2) : arguments[0];
    process.nextTick(function () {
        throw new Error(arg_str);
    });
}


var mock_res_proto = {
    writeHead: function () {},
    setHeader: function (key, val) { this[key] = val; },
    status: function (val) {
        this.setHeader(val);
        this._status = val;
    },
    output: {push: _.noop},
    outputEncodings: {push: _.noop},
    render: magic_throw,
    redirect: magic_throw
};

global._ = _;
global.should = chai.should();
global.expect = chai.expect;
global.mock_res_proto = mock_res_proto;
global.makeRes = function makeRes(req, done) { return _.defaults({ req: req, send: function (status, err) {done(new Error(err));} }, mock_res_proto); };

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


global.makeMockFindById = function (mock) {
    return function () { return { populate: _.noop, exec: function () { return Promise.fulfilled(mock); } }; };
};
