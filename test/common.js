'use strict';
require('nodestrum');
Error.stackTraceLimit = 100;
var Path = require('path');
global.MONGOOSE_DRIVER_PATH = Path.dirname(require.resolve('grist/driver'));
global.CONN_STR_PREFIX = 'grist://.tmp/formage-test-data---';

var _ = require('lodash-contrib');
var chai = require('chai');
var MPromise = require('mpromise');
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
    var arg_str = JSON.stringify(arguments, null, 2);
    process.nextTick(function () {
        throw new Error(arg_str);
    });
}


var mock_res_proto = {
    setHeader: _.identity,
    status: function (val) {
        this.setHeader(val);
        this._status = val;
    },
    output: {push: _.identity},
    outputEncodings: {push: _.identity},
    render: magic_throw,
    redirect: magic_throw
};

global._ = _;
global.should = chai.should();
global.expect = chai.expect;
global.mock_res_proto = mock_res_proto;
global.makeRes = function makeRes(req, done) {
    return _.defaults({
        req: req,
        send: function (status, err) {done(err);}
    }, mock_res_proto);
};

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
                var p = new MPromise(cb);
                p.fulfill(arr);
                return p;
            }
        };
    };
};


global.sanitizeRequireCache = function sanitizeRequireCache() {
    _.each(require.cache, function (mod, modName) {
        if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb') || ~modName.indexOf('grist'))
            delete require.cache[modName];
    });
};
