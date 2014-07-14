"use strict";
/*global makeRes,mock_req_proto,should,describe,before,after,it,expect,_,sanitizeRequireCache */
describe("edge cases on mongoose", function () {
    before(function (done) {
        sanitizeRequireCache();
        this.formage = require('../');
        var mongoose = this.mongoose = require("mongoose");
        this.express = require('express');
        var conn_str = global.CONN_STR_PREFIX + this.test.parent.title.replace(/\s/g, '_');
        mongoose.connect(conn_str, function (err) {
            if (err) return done(err);
            return mongoose.connection.db.dropDatabase(done);
        });
    });

    after(function () {
        delete this.formage;
        this.mongoose.disconnect();
        delete this.mongoose;
        delete this.express;
        delete this.app;
        delete this.registry;
        sanitizeRequireCache();
    });


    describe("no init options no models", function () {
        before(function (done) {
            this.app = this.express();
            this.registry = this.formage.init(this.app, this.express);
            done();
        });


        after(function () {
            delete this.app;
            delete this.registry;
        });


        it("works", function () {
            expect(this.registry).to.be.an('object');
        });


        it("show login screen", function (done) {
            var mock_req = _.defaults({
                url: "/login",
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.render = function (view, options) {
                view.should.equal("login.jade");
                should.exist(options);
                this.req.app.render(view, options, function (err, doc) {
                    should.exist(doc);
                    done(err);
                });
            };

            this.app.admin_app.handle(mock_req, mock_res, done);
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

            this.app.admin_app.handle(mock_req, mock_res, done);
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
                var test = this;
                mock_res.redirect = function (path) {
                    should.not.exist(mock_res._status);
                    expect(mock_req.session).to.have.property('formageUser');
                    expect(path).equal(mock_req.app.mountpath || mock_req.app.route);
                    // triger save cookie
                    try {
                        this.writeHead();
                    } catch (e) {}
                    expect( mock_res._headers).to.have.property("set-cookie");
                    test.sessionCookie = mock_res._headers["set-cookie"].join('; ');
                    done();
                };

                this.app.admin_app.handle(mock_req, mock_res, done);
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

                mock_res.render = function (view, options) {
                    view.should.equal("models.jade");
                    should.exist(options);
                    this.req.app.render(view, options, function (err, doc) {
                        should.exist(doc);
                        done(err);
                    });
                };

                this.app.admin_app.handle(mock_req, mock_res, done);
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

            this.app.admin_app.handle(mock_req, mock_res, done);
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

            this.app.admin_app.handle(mock_req, mock_res);
        });
    });
});
