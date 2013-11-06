'use strict';
describe("high level REST requests on tungus", function () {
    var ctx = {};
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        require('tungus');
        var formage = require('../index');
        var mongoose = ctx.mongoose = require("mongoose");
        var conn_str = 'tingodb://./.data/' + this.test.parent.title.replace(/\s/g, '');
        mongoose.connect(conn_str, function (err) {
            if (err) return done(err);
            return mongoose.connection.db.dropDatabase(function (err, doc) {
                var AppliesTo = mongoose.model('AppliesTo', new mongoose.Schema({
                    Title: {type: String, limit: 100, required: true},
                    Identifier: {type: String, limit: 100},
                    Editable: {type: Number}
                }));
                var tests = require('../example/classic/models/tests');
                var pages = require('../example/classic/models/pages');
                var express = require('express');
                var app = express();
                formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests}, {
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
