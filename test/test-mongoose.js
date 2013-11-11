'use strict';
/*global makeRes,mock_req_proto */
describe("high level REST requests on mongoose", function () {
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
            return mongoose.connection.db.dropDatabase(function (err) {
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

    function step1(done) {
        var mock_req = _.defaults({
            url: "/model/config/document/single",
            method: "POST",
            body: {
                title: 'ref1',
                'footer.links_li0_text': 'tgf2',
                'footer.links_li0_url': 'yhg2'
            }
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);
        mock_res.render = function (view, options) {
            done(options.form.errors);
        };
        mock_res.redirect = function (url) {
            url.should.equal("/admin/model/config");
            step2(done);
        };
        ctx.app.handle(mock_req, mock_res);
    }

    function step2(done) {
        var mock_req = _.defaults({
            url: "/model/config/document/single",
            method: "GET"
        }, mock_req_proto);

        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            view.should.equal("document.jade");
            should.exist(options);
            options.form.instance.footer.links[0].text.should.equal("tgf2");
            options.form.instance.footer.links[0].url.should.equal("yhg2");
            this.req.app.render(view, options, function (err, doc) {
                if (err) throw err;
                should.exist(doc);
                Boolean(~doc.indexOf(' value="tgf2" class="optional" type="text" name="footer.links_li0_text"'))
                    .should.equal(true);
                step3(done);
            });
        };
        ctx.app.handle(mock_req, mock_res);
    }

    function step3(done) {
        var mock_req = _.defaults({
            url: "/model/config/document/single",
            method: "POST",
            body: {'footer.links_li0_text': ''}
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);
        mock_res.render = function (view, options) {
            done(options.form.errors);
        };
        mock_res.redirect = function (url) {
            url.should.equal("/admin/model/config");
            step4(done);
        };

        ctx.app.handle(mock_req, mock_res);
    }

    function step4(done) {
        var mock_req = _.defaults({
            url: "/model/config/document/single",
            method: "GET"
        }, mock_req_proto);

        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.render = function (view, options) {
            view.should.equal("document.jade");
            should.exist(options);
            this.req.app.render(view, options, function (err, doc) {
                if (err) throw err;
                should.exist(doc);
                Boolean(~doc.indexOf(' value="" class="optional" type="text" name="footer.links_li0_text"'))
                    .should.equal(true);
                return done();
            });
        };
        ctx.app.handle(mock_req, mock_res);
    }

    it("post", function (done) {
        var mock_req = _.defaults({
            url: "/model/Tests/document/new",
            method: "POST",
            headers: {},
            body: {
                string: '',
                string_req: '123',
                ref: '',
                date: '',
                datetime: '',
                time: '',
                enum: '',
                rich_text: '',
                text: '',
                'undefined': '[object Object]',
                file_picker: '{"isWriteable":true,"size":222783,"mimetype":"image/jpeg","filename":"Birthday_mail.jpg","url":"http://featherfiles.aviary.com/2013-11-08/lqe7dik7cphyefe9/bdb746685c6c408b988e91403c81e59f.png"}',
                map_address: '',
                map: '32.066158,34.77781900000002',
                num: '',
                num_validated: '',
                num_with_params: '',
                bool: 'on',
                list_li0_name: 'hhh',
                list_li0_list_li0_name: 'ttt',
                list_li0_list_li1_name: 'yyyy',
                list_li0_list_li2_name: 'uuuuu',
                'object_with_list.inner_list_li0___self__': 'ggg',
                'object_with_list.inner_list_li1___self__': 'hhh',
                list_o_numbers_li0___self__: '1',
                list_o_numbers_li1___self__: '2',
                list_o_numbers_li2___self__: '3',
                list_o_numbers_li3___self__: '4',
                'object.object.object.nested_string': '',
                'object.object.object.nested_string_req': '123',
                mixed: ''
            }
        }, mock_req_proto);
        var mock_res = makeRes(mock_req, done);

        mock_res.redirect = function (url) {
            var doc = this._debug_document;
            expect(doc).to.have.property('string_req').equal("123");
            expect(doc).to.not.have.property('enum');
            expect(doc.object.object.object).to.have.property('nested_string_req').equal("123");
            expect(doc).to.have.property('list_o_numbers').with.length(4);
            expect(doc.list_o_numbers[0]).to.equal(1);
            expect(doc.list_o_numbers[1]).to.equal(2);
            expect(doc.list_o_numbers[2]).to.equal(3);
            expect(doc.list_o_numbers[3]).to.equal(4);

            Number(0).should.equal(url.indexOf("/admin/model/Test"));
            var mock_req = _.defaults({
                url: '/model/Tests/document/' + doc.id,
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.render = function (view, options) {
                expect(view).to.equal("document.jade");
                expect(options).to.have.property("form").to.have.property("instance");
                var instance = options.form.instance;
                expect(instance).to.have.property('string_req').equal("123");
                expect(instance).to.not.have.property('enum');
                expect(instance.object.object.object).to.have.property('nested_string_req').equal("123");
                expect(doc).to.have.property('list_o_numbers').with.length(4);
                expect(instance.list_o_numbers[0]).to.equal(1);
                expect(instance.list_o_numbers[1]).to.equal(2);
                expect(instance.list_o_numbers[2]).to.equal(3);
                expect(instance.list_o_numbers[3]).to.equal(4);

                this.req.app.render(view, options, function (err, doc) {
                    if (err) return done(err);
                    should.exist(doc);
                    //doc.replace(/\r/g, '').replace(/pages\?ref=.+"/, '').should.equal(renderedDoc);
                    return done();
                });
            };
            ctx.app.handle(mock_req, mock_res);
        };
        ctx.app.handle(mock_req, mock_res);
    });


    describe("nested & embeded", function () {
        it("should get updated", function (done) {
            step1(done);
        });
    });

    describe('core screens', function () {
        require('./common/core_test')(ctx);
    });

    after(function () {
        ctx.mongoose.disconnect();
        delete ctx.mongoose;
        delete ctx.app;
    });
})
;

var section_snippet = '<div class="section"><h2><span>Configuration</span></h2><ul class="models"><li><div class="btn-group pull-right"><a href="/admin/model/config/document/single" class="btn btn-default">Edit</a></div><a href="/admin/model/config/document/single"><h3>הגדרות</h3></a></li></ul></div>';
var renderedDoc = require('fs').readFileSync('test/fixtures/rendered_doc.text', 'utf-8').replace(/\r/g, '').replace(/pages\?ref=.+"/, '');
