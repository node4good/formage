'use strict';
global._ = require('lodash');
global.chai = require('chai');
global.should = chai.should();
require('nodestrum');
Error.stackTraceLimit = 100;
chai.Assertion.includeStack = false;
process.env.FORMAGE_DISABLE_DOMAINS = true;
process.env.MONGOOSE_DISABLE_STABILITY_WARNING = true;

global.mock_req_proto = {
    params: {},
    query: {},
    admin_user: {hasPermissions: function () {return true}}
};


global.mock_res_proto = {
    setHeader: function () {},
    status: function (val) {this._status = val;},
    output: {push: _.identity},
    outputEncodings: {push: _.identity}
};
