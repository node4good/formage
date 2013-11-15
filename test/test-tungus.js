'use strict';
describe("high level REST requests on tungus", function () {
    if (process.version.indexOf('v0.8') === 0) return;
    var ctx = {};
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        require('tungus');
        var formage = require('../index');
        var mongoose = ctx.mongoose = require("mongoose");
        var conn_str = 'tingodb://./.data/RESTontingodb';
        mongoose.connect(conn_str, function (err) {
            if (err) return done(err);
            return mongoose.connection.db.dropDatabase(function (err) {
                var AppliesTo = mongoose.model('AppliesTo', new mongoose.Schema({
                    Title: {type: String, limit: 100, required: true},
                    Identifier: {type: String, limit: 100},
                    Editable: {type: Number}
                }));
                var express = require('express');
                var app = express();
                var tests = require('../example/classic/models/tests');
                delete tests.formage.subCollections;
                var pages = require('../example/classic/models/pages');
                var config = require('../example/classic/models/config');
                ctx.registry = formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config}, {
                    title: 'Formage Example',
                    default_section: 'Main',
                    admin_users_gui: true
                });
                ctx.app = mock_req_proto.app = app.admin_app;
                done(err);
            });
        });
    });


    require('./common/core_test')(ctx);


    after(function () {
        ctx.mongoose.disconnect();
        delete ctx.mongoose;
        delete ctx.app;
    });
});
