"use strict";
describe("edge cases on mongoose", function () {
    this.timeout(2000);
    before(function (done) {
        _.each(require.cache, function (mod, modName) {
            if (~modName.indexOf('formage') || ~modName.indexOf('mongoose') || ~modName.indexOf('jugglingdb'))
                delete require.cache[modName];
        });
        this.formage = require('../index');
        this.mongoose = require("mongoose");
        this.mongoose.connect('mongodb://localhost/formage-test', function () {
            this.express = require('express');
            done()
        }.bind(this));
    });

    after(function (done) {
        delete this.formage;
        this.mongoose.disconnect();
        delete this.mongoose;
        delete this.express;
        done()
    });


    describe("no init options, no models", function () {
        before(function (done) {
            this.app = this.express();
            this.app.use(this.express.cookieParser('magical secret admin'));
            this.app.use(this.express.cookieSession({cookie: { maxAge: 1000 * 60 * 60 *  24 }}));
            this.registry = this.formage.init(this.app, this.express);
            done();
        });

        it("works", function (done) {
            should.exist(this.registry);
            done()
        });

        it("can log in", function (done) {
            var mock_req = _.defaults({
                url: "/login",
                method: "POST",
                body: {
                    username: "admin",
                    password: "admin"
                }
            }, mock_req_proto);

            var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

            mock_res.redirect = function (path) {
                should.not.exist(mock_res._status);
                "admin".should.equal(mock_req.session._mongooseAdminUser.username);
                path.should.equal(mock_req.app.route);
                done();
            }.bind(this);

            this.app.admin_app.handle(mock_req, mock_res);
        });
    });
});
