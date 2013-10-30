'use strict';
var nodestrum = require("nodestrum");
nodestrum.register_process_catcher();
process.env.FORMAGE_DB_LAYER = 'mongoose';

var _ = require('lodash');
var express = require('express');
var sinon = require('sinon');
var domain = require('domain');

var formage = require('../index');
var mongoose = require("mongoose");

module.exports.a_testtosetup = function (test) {
    mongoose.connect('mongodb://localhost/formage-test', function () {
        var AppliesTo = mongoose.model('AppliesTo', new mongoose.Schema({
            _id: {type: Number, primaryKey: true},
            AppliesToID: {type: Number, primaryKey: true},
            Title: {type: String, limit: 100},
            Identifier: {type: String, limit: 100},
            Editable: {type: Number}
        }));

        var app = express();
        var admin = formage.init(app, express, {AppliesTo: AppliesTo}, {
            title: 'Formage Example',
            default_section: 'Main',
            admin_users_gui: true
        });
        //noinspection JSUnresolvedVariable
        mock_req_proto.app = module.admin_app = app.admin_app;
        test.done()
    });
};

module.exports.pages = {
    "Mock test document page": function (test) {
        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "AppliesTo", documentId: "1"},
            method: "GET"
        }, mock_req_proto);
        var mock_res = _.defaults({
            req: mock_req
        }, mock_res_proto);
        var cb = sinon.spy();

        mock_res.render = function (view, options) {
            test.ok(view);
            test.ok(options);
            test.done()
        };
        module.admin_app.routes.get[4].callbacks[1](mock_req, mock_res);

    }

    , "Mock test model page": function (test) {
        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "AppliesTo"},
            method: "GET"
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            test.ok(view, "document.jade");
            test.ok(options);
            test.ok(view, "document.jade");
            test.ok(options);
            this.req.app.render(view, options, function (err, doc) {
                test.ok(doc);
                test.ifError(err);
                test.done();
            });
        };

        var d = domain.createDomain();
        d.on('error', function (err) {
            d.exit();
            test.fail(err);
            test.done();
        });
        d.enter();

        module.admin_app.routes.get[3].callbacks[2](mock_req, mock_res);
    }

    , "Mock test admin user page load": function (test) {

        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "Admin_Users", documentId: "new"},
            method: "GET"
        }, mock_req_proto);
        var mock_res = _.defaults({
            req: mock_req
        }, mock_res_proto);
        var cb = sinon.spy();

        mock_res.render = function (view, options) {
            test.ok(view);
            test.ok(options);
            test.done()
        };
        module.admin_app.routes.get[4].callbacks[1](mock_req, mock_res);
    }

    , "Mock test admin user page post": function (test) {
        var mock_req = _.defaults({
            params: {modelName: "Admin_Users", documentId: "new"},
            body: {username: "admin" + Math.random()},
            method: "POST",
            path: ""
        }, mock_req_proto);
        var mock_res = _.defaults({
             req: mock_req
        }, mock_res_proto);
        var cb = sinon.spy();
        var d = domain.createDomain();
        d.on('error', function (err) {
            d.exit();
            test.fail(err);
            test.done();
        });
        d.enter();

        mock_res.redirect = function () {
            d.exit();
            test.done()
        };

        module.admin_app.routes.post[1].callbacks[2](mock_req, mock_res);
    }
};


module.exports.z_testtoteardown = function (test) {
    mongoose.disconnect();
    test.done();
};


var mock_req_proto = {
    params: {},
    session: {_mongooseAdminUser: {}},
    query: {},
    admin_user: {hasPermissions: function () {return true}}
};


var mock_res_proto = {
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
}
