"use strict";
/*global _,makeRes,mock_req_proto,describe,before,after,it,expect,sanitizeRequireCache,framework */


describe("GitHub #113", function () {
    before(function (done) {
        this.mongoose = sanitizeRequireCache(this.test.parent.title, done);
        this.formage = require('../');
        this.app = framework();
        this.registry = this.formage.init(this.app, {
            team: require('../example/gh113/models/team'),
            Player: require('../example/gh113/models/Player')
        });
    });

    after(function () {
        delete this.registry;
        delete this.app;
        delete this.formage;
        this.mongoose.disconnect();
        delete this.mongoose;
    });


    it("load", function (done) {
        expect(this.registry).to.be.an('object');
        done();
    });


    it("render (with modelName)", function (done) {
        var mock_req = _.defaults({
            url: "/admin/model/Player/document/new",
            method: "GET",
            headers: {}
        }, mock_req_proto);
        var mock_res = makeRes(mock_req, done);

        mock_res.render = function (temple, locals) {
            expect(locals.form.fields.team.widget.data.modelname).equal = "team";
            done();
        };
        this.app.handle(mock_req, mock_res);
    });
})
;
