'use strict';
describe("high level REST requests on JugglingDB", function () {
    var ctx = {};
    var schema;
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        var formage = require('../index');
        var jugglingdb = require("jugglingdb");
        var Schema = jugglingdb.Schema;
        schema = new Schema("mssql", {host: "(LocalDB)\\v11.0", database: "maskar"});
        if (!schema.connect)
            schema = new Schema("memory");
        schema.on("connected", function () {
            jugglingdb.connected = schema;
            var express = require('express');
            var app = express();
            var AppliesTo = schema.define("AppliesTo", {
                AppliesToID: {type: Number, primaryKey: true},
                Title: {type: String, limit: 100},
                Identifier: {type: String, limit: 100},
                Editable: {type: Number}
            });
            AppliesTo.validatesPresenceOf('Title');

            var tests = require('../example/classic/models/tests');
            var registry = formage.init(app, express, {AppliesTo: AppliesTo, Tests: tests}, {
                title: 'Formage Example',
                default_section: 'Main',
                admin_users_gui: true,
                db_layer_type: 'jugglingdb'
            });
            ctx.app = mock_req_proto.app = app.admin_app;
            done();
        });
    });

    require('./common/core_test')(ctx);

    after(function () {
        if (schema.disconnect) schema.disconnect();
        delete ctx.app;
    });
});
