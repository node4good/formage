'use strict';
describe("high level REST requests on JugglingDB", function () {
    var ctx = {};
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        var formage = require('../../index');
        var jugglingdb = require("jugglingdb");
        var Schema = jugglingdb.Schema;
        ctx.schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});
        if (!ctx.schema.connect)
            ctx.schema = new Schema("memory");
        ctx.schema.on("connected", function () {
            jugglingdb.connected = ctx.schema;
            var express = require('express');
            var app = express();
            var AppliesTo = ctx.schema.define("AppliesTo", {
                AppliesToID: {type: Number, primaryKey: true},
                Title: {type: String, limit: 100},
                Identifier: {type: String, limit: 100},
                Editable: {type: Number}
            });
            AppliesTo.validatesPresenceOf('Title');

            var tests = require('../../example/classic/models/tests');
            var pages = require('../../example/classic/models/pages');
            var config = require('../../example/classic/models/config');
            ctx.registry = formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config}, {
                title: 'Formage Example',
                default_section: 'Main',
                admin_users_gui: true,
                db_layer_type: 'jugglingdb'
            });
            ctx.app = mock_req_proto.app = app.admin_app;
            ctx.schema.automigrate(function () {
                ctx.registry.adapter.Users.ensureExists('admin', 'admin', done);
            });
        });
    });

    require('./core_test')(ctx);

    after(function () {
        if (ctx.schema.disconnect) ctx.schema.disconnect();
        delete ctx.app;
    });
});
