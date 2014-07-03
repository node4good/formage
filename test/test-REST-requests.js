'use strict';
/*global makeRes,mock_req_proto,mock_res_proto,makeRes,should,test_post_body_multipart,describe,before,after,it,expect,_,sanitizeRequireCache */
describe("REST requests", function () {
    describe("mongoose", function () {
        before(function (done) {
            sanitizeRequireCache();
            var ctx = this;
            var formage = require('../');
            var mongoose = ctx.mongoose = require("mongoose");
            var conn_str = global.CONN_STR_PREFIX + this.test.parent.title.replace(/\s/g, '_');
            mongoose.connect(conn_str, function (err) {
                if (err) return done(err);
                return mongoose.connection.db.dropDatabase(function (err) {
                    var AppliesTo = mongoose.model('AppliesTo', new mongoose.Schema({
                        Title: {type: String, limit: 100, required: true},
                        Identifier: {type: String, limit: 100},
                        Editable: {type: Number}
                    }));
                    var tests = require('../example/classic/models/tests');
                    var pages = require('../example/classic/models/pages');
                    var config = require('../example/classic/models/config');
                    var gallery = require('../example/classic/models/gallery');
                    var embed = require('../example/classic/models/embed');
                    var bugs = require('../example/classic/models/bugs');
                    var express = require('express');
                    var app = express();
                    ctx.registry = formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config, gallery: gallery, embed: embed, bugs: bugs}, {
                        title: 'Formage Example',
                        default_section: 'Main',
                        admin_users_gui: true
                    });
                    ctx.app = mock_req_proto.app = app.admin_app;
                    ctx.startTheTest = function startTheTest(req, res, argOut) {
                        var done = ctx._runnable.callback;
                        var out = function (err) {
                            if (typeof(argOut) === 'function')
                                try {
                                    err = argOut(err);
                                } catch (e) {
                                    err = e;
                                }
                            if (err) done(err);
                        };
                        ctx.app.handle(req, res, out);
                    };
                    done(err);
                });
            });
        });


        after(function () {
            this.mongoose.disconnect();
            delete this.registry;
            delete this.mongoose;
            delete this.app;
            sanitizeRequireCache();
        });


        describe("general ", function () {
            it("Mock test document page", function (done) {
                var mock_req = _.defaults({
                    url: "/model/Tests/document/new",
                    method: "GET"
                }, mock_req_proto);
                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

                mock_res.render = function (view, options) {
                    view.should.equal("document.jade");
                    should.exist(options);
                    done();
                };

                this.app.handle(mock_req, mock_res);
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
                    expect(path).to.be.equal("/admin/model/AppliesTo");
                    should.not.exist(mock_res._status);
                    Number(1).should.equal(arguments.length);
                    done();
                };

                this.app.handle(mock_req, mock_res);
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
                var mock_res = makeRes(mock_req, done);

                mock_res.render = function (view, options) {
                    view.should.equal("document.jade");
                    should.exist(options.errors.Title);
                    Number(422).should.equal(mock_res._status);
                    done();
                };

                this.app.handle(mock_req, mock_res);
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
                    expect(status).to.equal(200, data + JSON.stringify(mock_res._debug_form && mock_res._debug_form.errors));
                    expect(data).to.have.property('string_req').equal(mock_req.body.string_req, data + mock_res._debug_form);
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });


            it('test that there are sections', function (done) {
                var mock_req = _.defaults({
                    url: "/",
                    method: "GET"
                }, mock_req_proto);

                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

                mock_res.render = function (view, options) {
                    view.should.equal("models.jade");
                    should.exist(options);
                    Boolean(options.sections.length > 0).should.equal(true);
                    this.req.app.render(view, options, function (err, doc) {
                        if (err) return done(err);
                        should.exist(doc);
                        return done();
                    });
                };

                this.app.handle(mock_req, mock_res);
            });
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
                        'enum': "",
                        'list_o_numbers_li0___self__': "0",
                        'list_o_numbers_li1___self__': "1",
                        'list_o_numbers_li2___self__': "2",
                        'list_li0_name': 'ggg',
                        'list_li0_list_li0_name': 'hhh',
                        'list_li0_list_li1_name': 'jjj',
                        'object.object.object.nested_string_req': "gigi",
                        'req_test': '1',
                        'req_number': 1,
                        'req_date': '2014/3/3'
                    }
                }, mock_req_proto);
                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

                mock_res.json = function (status, data) {
                    status.should.equal(200);
                    data.string_req.should.equal("gaga");
                    Number(data.num_with_params).should.equal(0);
                    should.not.exist(data.enum);
                    if (data._doc) {
                        data.object.object.object.nested_string_req.should.equal("gigi");
                        Number(data.list_o_numbers[0]).should.equal(0);
                    }
                    module._create_id = data.id;
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });


            it("get", function (done) {
                var mock_req = _.defaults({
                    url: "/model/Tests/document/" + module._create_id,
                    method: "GET"
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

                mock_res.render = function (view, options) {
                    view.should.equal('document.jade');
                    Number(0).should.equal(Object.keys(options.errors).length);
                    should.exist(options.form);
                    this.req.app.render(view, options, function (err, doc) {
                        should.exist(doc);
                        Boolean('<script src="//maps.googleapis.com').should.equal(true);
                        if (options.form.instance._doc) {
                            Boolean(~doc.indexOf('value="gigi" class="required" type="text" name="object.object.object.nested_string_req"'))
                                .should.equal(true);
//                        Boolean(~doc.indexOf('value="5" class="optional" min="" max="" step="any" type="number" name="list_o_numbers_li0___self__"'))
//                            .should.equal(true);
                        }
                        done(err);
                    });
                };

                this.app.handle(mock_req, mock_res);
            });


            it("checkDependencies", function (done) {
                var mock_req = _.defaults({
                    url: "/json/model/Tests/document/" + module._create_id + '/dependencies',
                    method: "GET",
                    path: ""
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

                mock_res.json = function (status, data) {
                    status.should.equal(200);
                    should.exist(data.length);
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });


            it("delete", function (done) {
                var test_doc_id = module._create_id;
                delete module._create_id;
                var mock_req = _.defaults({
                    url: "/json/model/Tests/action/delete",
                    body: {ids: [test_doc_id]},
                    method: "POST"
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

                mock_res.json = function (lines) {
                    expect(lines).to.have.length(2);
                    expect(lines[0]).to.have.string(test_doc_id);
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });
        });


        describe("the tests model", function () {
            it("Mock test model page", function (done) {
                var mock_req = _.defaults({
                    url: "/model/AppliesTo/",
                    method: "GET"
                }, mock_req_proto);
                var mock_res = makeRes(mock_req, done);

                mock_res.render = function (view, options) {
                    view.should.equal("model.jade");
                    should.exist(options);
                    this.req.app.render(view, options, function (err, doc) {
                        should.exist(doc);
                        done(err);
                    });
                };

                this.app.handle(mock_req, mock_res);
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

                this.app.handle(mock_req, mock_res);
            });
        });

        describe("play with a single model", function () {
            it("should get", function (done) {
                var mock_req = _.defaults({
                    url: "/model/config/document/single",
                    method: "GET"
                }, mock_req_proto);

                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

                mock_res.render = function (view, options) {
                    view.should.equal("document.jade");
                    should.exist(options);
                    this.req.app.render(view, options, function (err, doc) {
                        if (err) return done(err);
                        should.exist(doc);
                        return done();
                    });
                };
                this.app.handle(mock_req, mock_res);
            });


            it("should post", function (done) {
                var mock_req = _.defaults({
                    url: "/model/config/document/single",
                    method: "POST",
                    body: {
                        title: 'ref',
                        email: 'ref',
                        'footer.links_li0_text': 'tgf',
                        'footer.links_li0_url': 'yhg',
                        'mail_sent.title': '',
                        'mail_sent.text': ''
                    }
                }, mock_req_proto);
                var mock_res = _.defaults({ req: mock_req }, mock_res_proto);
                mock_res.render = function (view, options) {
                    done(options.form.errors);
                };
                mock_res.redirect = function (url) {
                    url.should.equal("/admin/model/config");
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });


        });


        describe("Admin Users", function () {
        it("Model view", function (done) {
            var mock_req = _.defaults({
                url: "/model/formage_users_/",
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            var holder = this.test.parent;
            mock_res.render = function (view, options) {
                view.should.equal("model.jade");
                holder._exampleUserID = options.dataTable.data[0].id.toString();
                done();
            };

            this.app.handle(mock_req, mock_res);
        });


        it("document view", function (done) {
            var userId = this.test.parent._exampleUserID;
            delete this.test.parent._exampleUserID;
            var mock_req = _.defaults({
                url: "/model/formage_users_/document/" + userId,
                method: "GET"
            }, mock_req_proto);

            var mock_res = _.defaults({
                req: mock_req
            }, mock_res_proto);

            mock_res.render = function (view, options) {
                view.should.equal("document.jade");
                Number(0).should.equal(Object.keys(options.errors).length);
                done();
            };

            this.app.handle(mock_req, mock_res);
        });


        it("Mock test admin user page post", function (done) {
            var mock_req = _.defaults({
                url: "/model/formage_users_/document/new",
                body: {
                    username: "admin" + Math.random(),
                    password: 'gimli',
                    password_again: 'gimli'
                },
                method: "POST",
                headers: {}
            }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

            mock_res.render = done;

            mock_res.redirect = function (p) {
                '/admin/model/formage_users_'.should.equal(p);
                should.exist(p);
                done();
            };

            this.app.handle(mock_req, mock_res);
        });
            it("Model view", function (done) {
                var mock_req = _.defaults({
                    url: "/model/formage_users_/",
                    method: "GET"
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

                var holder = this.test.parent;
                mock_res.render = function (view, options) {
                    view.should.equal("model.jade");
                    expect(options.dataTable.header).to.have.property(0).to.have.property('label').equal('Username');
                    holder._exampleUserID = options.dataTable.data[0].id.toString();
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });


            it("document view", function (done) {
                var userId = this.test.parent._exampleUserID;
                delete this.test.parent._exampleUserID;
                var mock_req = _.defaults({
                    url: "/model/formage_users_/document/" + userId,
                    method: "GET"
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);

                mock_res.render = function (view, options) {
                    view.should.equal("document.jade");
                    Number(0).should.equal(Object.keys(options.errors).length);
                    done();
                };

                this.app.handle(mock_req, mock_res);
            });
        });
    });
});
