'use strict';
describe("high level REST requests on mongoose", function () {
    this.timeout(2000);
    var ctx = {};
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        var formage = require('../index');
        var mongoose = ctx.mongoose = require("mongoose");
        var conn_str = 'mongodb://localhost/formage-test' + this.test.parent.title.replace(/\s/g, '');
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
                var config = require('../example/classic/models/config');
                var express = require('express');
                var app = express();
                formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config}, {
                    title: 'Formage Example',
                    default_section: 'Main',
                    admin_users_gui: true
                });
                ctx.app = mock_req_proto.app = app.admin_app;
                done(err);
            })
        });
    });


    describe('just bugs', function () {
        it('test that a single model works', function (done) {
            var mock_req = _.defaults({
                url: "/model/config/document/single",
                method: "GET"
            }, mock_req_proto);

            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("document.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            ctx.app.handle(mock_req, mock_res);
        });
    });


    require('./common/core_test')(ctx);


    after(function () {
        ctx.mongoose.disconnect();
        delete ctx.mongoose;
        delete ctx.app;
    });
});
