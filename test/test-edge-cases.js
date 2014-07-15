"use strict";
/*global makeRes,mock_req_proto,should,describe,before,after,it,expect,_,sanitizeRequireCache,framework */
describe("edge cases on mongoose", function () {
    before(function (done) {
        this.mongoose = sanitizeRequireCache(this.test.parent.title, done);
        this.formage = require('../');
    });

    after(function () {
        delete this.formage;
        this.mongoose.disconnect();
        delete this.mongoose;
        sanitizeRequireCache();
    });


    describe("no init options no models", function () {
        before(function (done) {
            this.mongoose = sanitizeRequireCache(this.test.parent.title, done);
            this.formage = require('../');
            this.app = framework();
            this.registry = this.formage.init(this.app);
        });


        after(function () {
            delete this.formage;
            this.mongoose.disconnect();
            delete this.mongoose;
            delete this.express;
            delete this.app;
            delete this.registry;
        });


        it("works", function () {
            expect(this.registry).to.be.an('object');
        });


        it("parent app works", function (done) {
            var mock_req = _.defaults({
                url: "/admin/login",
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);
            mock_res.getHeader = _.noop;
            mock_res.setHEader = _.noop;


            var adminApp = this.app.admin_app;
            mock_res.render = function (view, options) {
                expect(view).equal("login.jade");
                expect(options).property('pageTitle');
                adminApp.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };
            this.app.handle = this.app.handle || this.app.callback();
            this.app.handle(mock_req, mock_res, done);
        });


        it("show login screen", function (done) {
            var mock_req = _.defaults({
                url: "/login",
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            var adminApp = this.app.admin_app;
            mock_res.render = function (view, options) {
                view.should.equal("login.jade");
                should.exist(options);
                adminApp.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            this.app.adminRouter.handle(mock_req, mock_res, done);
        });

        it("can't log in with wrong creds", function (done) {
            var mock_req = _.defaults({
                url: "/login",
                method: "POST",
                session: {},
                body: {
                    username: "admin",
                    password: "xxx"
                }
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.redirect = function (path) {
                should.not.exist(mock_res._status);
                path.should.equal("/admin/login?error=true");
                done();
            }.bind(this);

            this.app.adminRouter.handle(mock_req, mock_res, done);
        });

        describe("login and re-enter", function () {
            it("can log in", function (done) {
                var mock_req = _.defaults({
                    url: "/login",
                    method: "POST",
                    body: {
                        username: "admin",
                        password: "admin"
                    }
                }, mock_req_proto);

                var mock_res = makeRes(mock_req, done);
                var headers;
                mock_res.writeHead = _.noop;
                mock_res.getHeader = _.noop;
                mock_res.setHeader = function (name, argHeaders) { headers = argHeaders; };
                var test = this;
                mock_res.redirect = function (path) {
                    expect(mock_res._status).not.exist;
                    expect(mock_req.session).to.have.property('formageUser');
                    expect(path).equal(test.app.admin_app.mountpath);
                    // triger save cookie
                    try {
                        this.writeHead();
                    } catch (e) {
                        console.log('\n###goo###\n');
                    }
                    expect(headers).to.have.length(2);
                    test.sessionCookie = headers.join('; ');
                    done();
                };

                this.app.adminRouter.handle(mock_req, mock_res, done);
            });


            it("can reenter after login", function (done) {
                this.registry.registerModel(require('../example/classic/models/tests'), 'tests');
                if (!this.sessionCookie) done("didn't get present");
                var mock_req = _.defaults({
                    url: "/",
                    headers: {},
                    method: "get"
                }, mock_req_proto);
                delete mock_req.admin_user;
                mock_req.headers["cookie"] = this.sessionCookie;
                delete this.sessionCookie;

                var mock_res = makeRes(mock_req, done);

                var adminApp = this.app.admin_app;
                mock_res.render = function (view, options) {
                    view.should.equal("models.jade");
                    should.exist(options);
                    adminApp.render(view, options, function (err, doc) {
                        should.exist(doc);
                        done(err);
                    });
                };

                this.app.adminRouter.handle(mock_req, mock_res, done);
            });
        });


        it("can't reenter with no session", function (done) {
            var mock_req = _.defaults({
                url: "/",
                session: {},
                method: "get"
            }, mock_req_proto);
            delete mock_req.admin_user;

            var mock_res = makeRes(mock_req, done);

            mock_res.redirect = function (path) {
                should.not.exist(mock_res._status);
                expect(mock_req.session['formageLoginReferrer']).to.equal("/");
                expect(path).include('/login');
                done();
            }.bind(this);

            this.app.adminRouter.handle(mock_req, mock_res, done);
        });


        it("logout works", function (done) {
            var mock_req = _.defaults({
                url: "/logout",
                headers: {},
                session: {formageUser: {}},
                method: "get"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.redirect = function (path) {
                should.not.exist(mock_res._status);
                should.not.exist(mock_req.session['formageLoginReferrer']);
                path.should.equal("/");
                done();
            }.bind(this);

            this.app.adminRouter.handle(mock_req, mock_res);
        });
    });
});
