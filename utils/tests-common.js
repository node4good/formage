'use strict';
global._ = require('lodash');
global.sinon = require('sinon');
global.chai = require('chai');
global.should = chai.should();
chai.Assertion.includeStack = true;
process.env.FORMAGE_DISABLE_DOMAINS = true;
process.env.MONGOOSE_DISABLE_STABILITY_WARNING;

global.mock_req_proto = {
    params: {},
    session: {_mongooseAdminUser: {}},
    query: {},
    admin_user: {hasPermissions: function () {return true}}
};


global.mock_res_proto = {
    setHeader: function () {},
    status: function (val) {this._status = val;},
    send: function (status, val) {
        if (status === 500)
            console.log(val.stack || val);
    },
    render: function (view, options) {
        options = options || {};
        var self = this
            , req = this.req
            , app = req.app;

        // merge res.locals
        options._locals = self.locals;

        // render
        app.render(view, options, this.end);
    }
};
