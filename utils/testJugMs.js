"use strict";
var nodestrum = require("nodestrum");
nodestrum.register_process_catcher();

var formage = require('../lib/index');
var Schema = require("jugglingdb").Schema;
var schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});

schema.on("connected", function () {

        var AppliesTo = schema.define("AppliesTo", {
            AppliesToID: {
                type: Number,
                primaryKey: true
            },
            Title: {
                type: String,
                limit: 100
            },
            Identifier: {
                type: String,
                limit: 100
            },
            Editable: {
                type: Number
            }
        });

        schema.automigrate(function () {

            var at = new AppliesTo;
            at.Title = "gaga";
            at.save(function (err, doc) {
                console.log(doc);
            });
        });

        var express = require('express'),
            http = require('http'),
            path = require('path'),
            app = express();

        try {
            var admin = formage.init(app, express, {AppliesTo: AppliesTo}, {
                title: 'Formage Example',
                default_section: 'Main',
                admin_users_gui: true
            });
        } catch (e) {
            console.log(e.stack);
        }

        http.createServer(app).listen(80, function () {
            console.log('Express server listening on port ' + 80);
        });

        exports.app = app;

    }
)
;
