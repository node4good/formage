'use strict';
var nodestrum = require("nodestrum");
nodestrum.register_process_catcher();
process.env.FORMAGE_DB_LAYER = 'jugglingdb';

var _ = require('lodash');
var express = require('express');
var sinon = require('sinon');
var domain = require('domain');
var chai = require('chai');
var should = chai.should();
chai.Assertion.includeStack = true;

var formage = require('../index');
var Schema = require("jugglingdb").Schema;
var schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});

describe("high level REST requests", function () {
    before(function (done) {
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
            done()
        });
    });

    describe("pages", function () {
        it("Mock test document page", function (done) {
            //noinspection JSUnresolvedVariable
            var mock_req = _.defaults({
                params: {modelName: "AppliesTo", documentId: "1"},
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("document.jade");
                should.exist(options);
                d.exit();
                done()
            };

            var d = domain.createDomain();
            d.on('error', function (err) {
                d.exit();
                done(err);
            });
            d.enter();

            module.admin_app.routes.get[4].callbacks[1](mock_req, mock_res);
        });


        it("Mock test document post", function (done) {
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
                Number(1).should.equal(arguments.length);
                d.exit();
                done();
            };

            var d = domain.createDomain();
            d.on('error', function (err) {
                d.exit();
                done(err);
            });
            d.enter();

            module.admin_app.routes.post[1].callbacks[2](mock_req, mock_res);
        });


        it("Mock test model page", function (done) {
            //noinspection JSUnresolvedVariable
            var mock_req = _.defaults({
                params: {modelName: "AppliesTo"},
                query: {start: "2"},
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("model.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    d.exit();
                    done(err);
                });
            };

            var d = domain.createDomain();
            d.on('error', function (err) {
                d.exit();
                done(err);
            });
            d.enter();

            module.admin_app.routes.get[3].callbacks[2](mock_req, mock_res);
        });


        it("Mock test models page", function (done) {
            //noinspection JSUnresolvedVariable
            var mock_req = _.defaults({
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("models.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    d.exit();
                    done(err);
                });
            };

            var d = domain.createDomain();
            d.on('error', function (err) {
                d.exit();
                done(err);
            });
            d.enter();

            module.admin_app.routes.get[0].callbacks[2](mock_req, mock_res);
        });
    })

});


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
