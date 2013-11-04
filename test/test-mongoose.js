'use strict';
describe("high level REST requests on mongoose", function () {
    this.timeout(5000);
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        var formage = require('../index');
        var mongoose = module.mongoose = require("mongoose");
        mongoose.connect('mongodb://localhost/formage-test' + this.test.parent.title.replace(/\s/g, ''), function () {
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
                options.subCollections["0"].label.should.equal("Sub Tests");
                done()
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        it("test document - post simple", function (done) {
            var mock_req = _.defaults({
                url: "/model/AppliesTo/document/new",
                method: "POST",
                headers: {},
                body: {
                    Title: "gaga5",
                    Identifier: "asdf",
                    Editable: "1"
                }
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
                headers: {},
                body: {
                    Identifier: "asdf",
                    Editable: "1"
                }
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


        it("test document - post full form", function (done) {
            var mock_req = _.defaults({
                url: "/json/model/Tests/document/new",
                method: "POST",
                headers: {
                    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryRAMJbJAUpnXaUbFE',
                    'content-length': test_post_body_multipart.length
                },
                pipe: function (dest) {
                    dest.write(test_post_body_multipart);
                    dest.end();
                },
                unpipe: _.identity
            }, mock_req_proto);
            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.json = function (status, data) {
                status.should.equal(200);
                data.label.should.equal(mock_req.body.string_req);
                done();
            };

            module.admin_app.handle(mock_req, mock_res);
        });


        describe("document flow", function () {
            it("post", function (done) {
                var mock_req = _.defaults({
                    url: "/json/model/Tests/document/new",
                    method: "POST",
                    headers: {},
                    body: {
                        string_req: "gaga",
                        num_with_params: "0",
                        enum: "",
                        "object.object.object.nested_string_req": "gigi",
                        list_o_numbers_li0___self__: "5"
                    }
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


            it("get", function (done) {
                var mock_req = _.defaults({
                    url: "/model/Tests/document/" + module._create_id,
                    method: "GET"
                }, mock_req_proto);

                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

                mock_res.render = function (view, options) {
                    view.should.equal('document.jade');
                    Number(0).should.equal(options.errors.length);
                    done();
                };

                module.admin_app.handle(mock_req, mock_res);
            });


            it("checkDependencies", function (done) {
                var mock_req = _.defaults({
                    url: "/json/model/Tests/document/" + module._create_id + '/dependencies',
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


            it("delete", function (done) {
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
                query: {start: "0", order_by: "string_req", limit: "20", populates: "ref"},
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


        describe("Admin Users", function () {
            it("Model view", function (done) {
                var mock_req = _.defaults({
                    url: "/model/Admin_Users/",
                    method: "GET"
                }, mock_req_proto);

                var mock_res = _.defaults({
                    req: mock_req
                }, mock_res_proto);

                var holder = this.test.parent;
                mock_res.render = function (view, options) {
                    view.should.equal("model.jade");
                    holder._exampleUserID = options.documents["0"]._id.toString();
                    done();
                };

                module.admin_app.handle(mock_req, mock_res);
            });


            it("document view", function (done) {
                var userId = this.test.parent._exampleUserID;
                delete this.test.parent._exampleUserID;
                var mock_req = _.defaults({
                    url: "/model/Admin_Users/document/" + userId,
                    method: "GET"
                }, mock_req_proto);

                var mock_res = _.defaults({
                    req: mock_req
                }, mock_res_proto);

                mock_res.render = function (view, options) {
                    view.should.equal("document.jade");
                    Number(0).should.equal(options.errors.length);
                    done();
                };

                module.admin_app.handle(mock_req, mock_res);
            });


            it("Mock test admin user page post", function (done) {
                var mock_req = _.defaults({
                    url: "/model/Admin_Users/document/new",
                    body: {username: "admin" + Math.random()},
                    method: "POST",
                    headers: {}
                }, mock_req_proto);

                var mock_res = _.defaults({
                    req: mock_req
                }, mock_res_proto);

                mock_res.redirect = function (p) {
                    '/admin/model/Admin_Users'.should.equal(p);
                    should.exist(p);
                    done();
                };

                module.admin_app.handle(mock_req, mock_res);
            });
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
