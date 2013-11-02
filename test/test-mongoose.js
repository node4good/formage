'use strict';
describe("high level REST requests on mongoose", function () {
    this.timeout(2000);
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        var formage = require('../index');
        var mongoose = module.mongoose = require("mongoose");
        mongoose.connect('mongodb://localhost/formage-test', function () {
            var AppliesTo = mongoose.model('AppliesTo', new mongoose.Schema({
                Title: {type: String, limit: 100, required: true},
                Identifier: {type: String, limit: 100},
                Editable: {type: Number}
            }));
            var tests = require('../example/models/tests');
            var pages = require('../example/models/pages');
            var express = require('express');
            var app = express();
            formage.init(app, express, {pages:pages, AppliesTo: AppliesTo, Tests:tests}, {
                title: 'Formage Example',
                default_section: 'Main',
                admin_users_gui: true
            });
            mock_req_proto.app = module.admin_app = app.admin_app;
            done()
        });
    });

    describe("pages", function () {
        it("Mock test document page", function (done) {
            var mock_req = _.defaults({
                url: "/model/Tests/document/new",
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("document.jade");
                should.exist(options);
                done()
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - post simple", function (done) {
            var mock_req = _.defaults({
                url: "/model/AppliesTo/document/new",
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
                should.not.exist(mock_res._status);
                Number(1).should.equal(arguments.length);
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - post - failing validation", function (done) {
            var mock_req = _.defaults({
                url: "/model/AppliesTo/document/new",
                method: "POST",
                body: {
                    Identifier: "asdf",
                    Editable: "1"
                },
                path: ""
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("document.jade");
                should.exist(options.errors.Title);
                Number(422).should.equal(mock_res._status);
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - post progressive", function (done) {
            var mock_req = _.defaults({
                url: "/json/model/Tests/document/new",
                method: "POST",
                body: {
                    string_req: "gaga",
                    num_with_params: "0",
                    enum: "",
                    "object.object.object.nested_string_req" : "gigi",
                    list_o_numbers_li0___self__: "5"
                },
                path: ""
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.json = function (status, data) {
                status.should.equal(200);
                data.label.should.equal(mock_req.body.string_req);
                module._create_id = data.id;
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - delete", function (done) {
            var mock_req = _.defaults({
                url: "/json/model/Tests/document/" + module._create_id,
                method: "DELETE",
                path: ""
            }, mock_req_proto);
            delete module._create_id;

            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.json = function (status, data) {
                status.should.equal(204);
                data.collection.should.equal("Tests");
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - checkDependencies", function (done) {
            var mock_req = _.defaults({
                url: "/json/model/Tests/document/" + module._create_id+'/dependencies',
                method: "GET",
                path: ""
            }, mock_req_proto);

            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.json = function (status, data) {
                status.should.equal(200);
                should.exist(data.length);
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("Mock test model page", function (done) {
            var mock_req = _.defaults({
                url: "/model/AppliesTo/",
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("model.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("Mock test model page with query params", function (done) {
            var mock_req = _.defaults({
                url: "/model/Tests/",
                query: {start: "0", order_by:"string_req", limit:"20", populates:"ref"},
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("model.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("Mock test models page", function (done) {
            var mock_req = _.defaults({
                url: "/",
                method: "GET"
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("models.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("Mock test admin user page post", function (done) {
            this.timeout(2000);
            var mock_req = _.defaults({
                url: "/model/Admin_Users/document/new",
                body: {username: "admin" + Math.random()},
                method: "POST",
                path: ""
            }, mock_req_proto);

            var mock_res = _.defaults({
                req: mock_req
            }, mock_res_proto);

            mock_res.redirect = function (p) {
                mock_res.app.route.should.equal(p);
                should.exist(p);
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });
    });


    after(function () {
        module.mongoose.disconnect();
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
    });
});
