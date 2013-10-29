'use strict';
var nodestrum = require("nodestrum");
nodestrum.register_process_catcher();

Error.stackTraceLimit = Infinity;
var express = require('express');
var sinon = require('sinon');

var formage = require('../lib/index');
var Schema = require("jugglingdb").Schema;
var schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});


module.exports = {
    "Mock test first page": function (test) {
        schema.on("connected", function () {

                var AppliesTo = schema.define("AppliesTo", {
                    AppliesToID: {type: Number, primaryKey: true},
                    Title: {type: String, limit: 100},
                    Identifier: {type: String, limit: 100},
                    Editable: {type: Number}
                });

//                schema.automigrate(function () {
//
//                    var at = new AppliesTo;
//                    at.Title = "gaga";
//                    at.save(function (err, doc) {
//                        console.log(doc);
//                    });
//                });
                var app = express();
                var admin = formage.init(app, express, {AppliesTo: AppliesTo}, {
                    title: 'Formage Example',
                    default_section: 'Main',
                    admin_users_gui: true
                });
                //noinspection JSUnresolvedVariable
                var admin_app = app.admin_app;
                var mock_req = {
                    params: {modelName: "AppliesTo", documentId: "1"},
                    session: {_mongooseAdminUser: {}},
                    query: {},
                    method: "GET",
                    app: admin_app
                };
                var mock_res = {};
                var cb = sinon.spy();
                admin_app.routes.get[4].callbacks[1](mock_req, mock_res, function (req, res) {
                    test.done();
                });
            }
        );
    }
};


