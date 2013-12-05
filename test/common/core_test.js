'use strict';
/*global makeRes */
module.exports = function (ctx) {
    describe("general", function () {
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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
                    enum: "",
                    'list_o_numbers_li0___self__': "0",
                    'list_o_numbers_li1___self__': "1",
                    'list_o_numbers_li2___self__': "2",
                    'list_li0_name': 'ggg',
                    'list_li0_list_li0_name': 'hhh',
                    'list_li0_list_li1_name': 'jjj',
                    'object.object.object.nested_string_req': "gigi"
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
        });


        it("delete", function (done) {
            var test_doc_id = module._create_id;
            delete module._create_id;
            var mock_req = _.defaults({
                url: "/json/model/Tests/action/delete",
                body: {ids:[test_doc_id]},
                method: "POST"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.json = function (lines) {
                expect(lines).to.have.length(2);
                expect(lines[0]).to.have.string(test_doc_id);
                done();
            };

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
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
            ctx.app.handle(mock_req, mock_res);
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

            ctx.app.handle(mock_req, mock_res);
        });


    });


    describe("Admin Users", function () {
        it("Model view", function (done) {
            var mock_req = _.defaults({
                url: "/model/Admin_Users/",
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            var holder = this.test.parent;
            mock_res.render = function (view, options) {
                view.should.equal("model.jade");
                holder._exampleUserID = options.dataTable.data[0].id.toString();
                done();
            };

            ctx.app.handle(mock_req, mock_res);
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
                Number(0).should.equal(Object.keys(options.errors).length);
                done();
            };

            ctx.app.handle(mock_req, mock_res);
        });


        it("Mock test admin user page post", function (done) {
            var mock_req = _.defaults({
                url: "/model/Admin_Users/document/new",
                body: {
                    username: "admin" + Math.random(),
                    password: 'gimli',
                    password_again: 'gimli'
                },
                method: "POST",
                headers: {}
            }, mock_req_proto);

            var mock_res = _.defaults({
                req: mock_req
            }, mock_res_proto);

            mock_res.render = done;

            mock_res.redirect = function (p) {
                '/admin/model/Admin_Users'.should.equal(p);
                should.exist(p);
                done();
            };

            ctx.app.handle(mock_req, mock_res);
        });
    });
};
