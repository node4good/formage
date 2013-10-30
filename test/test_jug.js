'use strict';
var nodestrum = require("nodestrum");
nodestrum.register_process_catcher();
process.env.FORMAGE_DB_LAYER = 'jugglingdb';

var _ = require('lodash');
var express = require('express');
var sinon = require('sinon');
var domain = require('domain');

var formage = require('../index');
var Schema = require("jugglingdb").Schema;
var schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});

module.exports.a_testtosetup = function (test) {
    schema.on("connected", function () {
        var AppliesTo = schema.define("AppliesTo", {
            AppliesToID: {type: Number, primaryKey: true},
            Title: {type: String, limit: 100},
            Identifier: {type: String, limit: 100},
            Editable: {type: Number}
        });

        var app = express();
        formage.init(app, express, {AppliesTo: AppliesTo}, {
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
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            test.ok(view, "document.jade");
            test.ok(options);
            d.exit();
            test.done()
        };

        var d = domain.createDomain();
        d.on('error', function (err) {
            d.exit();
            test.fail(err);
            //test.done();
        });
        d.enter();

        module.admin_app.routes.get[4].callbacks[1](mock_req, mock_res);
    }

    , "Mock test document post": function (test) {
        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "AppliesTo", documentId: "1"},
            method: "POST",
            body: {
                Title: "gaga5",
                Identifier: "asdf",
                Editable: "1"
            },
            path: ""
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.redirect = function (path) {
            test.ok(arguments.length == 1);
            d.exit();
            test.done();
        };

        var d = domain.createDomain();
        d.on('error', function (err) {
            d.exit();
            test.fail(err);
            test.done();
        });
        d.enter();

        module.admin_app.routes.post[1].callbacks[2](mock_req, mock_res);
    }

    , "Mock test model page": function (test) {
        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "AppliesTo"},
            query: {start:"2"},
            method: "GET"
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            test.ok(view, "document.jade");
            test.ok(options);
            this.req.app.render(view, options, function (err, doc) {
                test.ok(doc);
                test.ifError(err);
                d.exit();
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

    , "Mock test models page": function (test) {
        //noinspection JSUnresolvedVariable
        var mock_req = _.defaults({
            params: {modelName: "AppliesTo", documentId: "1"},
            method: "GET"
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            test.ok(view, "document.jade");
            test.ok(options);
            this.req.app.render(view, options, function (err, doc) {
                test.ok(doc);
                test.ifError(err);
                d.exit();
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

        module.admin_app.routes.get[0].callbacks[2](mock_req, mock_res);
    }
};


module.exports.z_testtoteardown = function (test) {
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
};
