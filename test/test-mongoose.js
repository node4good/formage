'use strict';
/*global makeRes,mock_req_proto,describe,before,it,expect */
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
                var gallery = require('../example/classic/models/gallery');
                var express = require('express');
                var app = express();
                formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config, gallery: gallery}, {
                    title: 'Formage Example',
                    default_section: 'Main',
                    admin_users_gui: true
                });
                ctx.app = mock_req_proto.app = app.admin_app;
                done(err);
            })
        });
    });


    after(function () {
        ctx.mongoose.disconnect();
        delete ctx.mongoose;
        delete ctx.app;
    });


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
                bool2: 'on',
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
                'embeded.list_li0_embeded.list_li0_nested_string': '',
                'embeded.list_li0_embeded.list_li0_nested_string_req': 'nested',
                'embeded.list_li0_embeded.list_li0_list_li0___self__': 'bab',
                'embeded.list_li0_embeded.list_li0_list_li1___self__': 'aga',
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
            expect(doc).to.have.property('bool').equal(false);
            expect(doc).to.have.property('bool2').equal(true);
            expect(doc.object.object.object).to.have.property('nested_string_req').equal("123");
            expect(doc).to.have.property('list_o_numbers').with.property('length').equal(4);
            expect(doc.list_o_numbers[0]).to.equal(1);
            expect(doc.list_o_numbers[1]).to.equal(2);
            expect(doc.list_o_numbers[2]).to.equal(3);
            expect(doc.list_o_numbers[3]).to.equal(4);
            expect(doc.embeded.list[0].embeded.list[0].nested_string_req).to.equal('nested');
            expect(doc.embeded.list[0].embeded.list[0].list[0]).to.equal('bab');
            expect(doc.embeded.list[0].embeded.list[0].list[1]).to.equal('aga');

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
                expect(doc).to.have.property('list_o_numbers').with.property('length').equal(4);
                expect(instance.list_o_numbers[0]).to.equal(1);
                expect(instance.list_o_numbers[1]).to.equal(2);
                expect(instance.list_o_numbers[2]).to.equal(3);
                expect(instance.list_o_numbers[3]).to.equal(4);

                // fragile
                expect(String(options.form)).to.equal(renderedForm);

                this.req.app.render(view, options, function (err, doc) {
                    if (err) return done(err);
                    should.exist(doc);
                    return done();
                });
            };
            ctx.app.handle(mock_req, mock_res);
        };
        ctx.app.handle(mock_req, mock_res);
    });

    describe("nested & embeded", function () {
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
                throw options.form.errors.exception[0];
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

        it("should get updated", function (done) {
            step1(done);
        });
    });


    describe('core screens', function () {
        require('./common/core_test')(ctx);
    });



    it("test document - post full form", function (done) {
        var gallery_post = require('fs').readFileSync('test/fixtures/gallery-post.mime', 'binary');
        var mock_req = _.defaults({
            url: "/json/model/gallery/document/new",
            method: "POST",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryYyQBuPAzOCubnZzX',
                'content-length': gallery_post.length
            },
            pipe: function (dest) {
                dest.write(gallery_post);
                dest.end();
            },
            unpipe: _.identity
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        require('cloudinary').uploader.upload = function (path, callback) {
            expect(path).to.exist;
            callback({});
        };

        mock_res.json = function (status, data) {
            expect(status).to.equal(200, data);
            expect(data).to.have.property('title').equal(mock_req.body.title, data + mock_res._debug_form);
            done();
        };

        ctx.app.handle(mock_req, mock_res);
    });
});

var renderedForm = "<div class=\"field\">\n<label for=\"id_string\" class=\"field_label optional_label\">String</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"string\" id=\"id_string\" />\n</div>\n<div class=\"field\">\n<label for=\"id_string_req\" class=\"field_label required_label\">Name</label>\n<input  value=\"123\" class=\"required\" type=\"text\" name=\"string_req\" id=\"id_string_req\" />\n</div>\n<div class=\"field\">\n<label for=\"id_ref\" class=\"field_label optional_label\">Ref</label>\n<select class=\"optional\" data-ref=\"Pages\" name=\"ref\" id=\"id_ref\" />\n<option selected=\"selected\" value=\"\"> ... </option>\n</select>\n</div>\n<div class=\"field\">\n<label for=\"id_date\" class=\"field_label optional_label\">Date</label>\n<div class=\"input-append date\">\n<input  value=\"\" class=\"optional nf_datepicker\" type=\"text\" name=\"date\" id=\"id_date\" />\n<span class=\"add-on\"><i class=\"icon-calendar\"></i></span>\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_datetime\" class=\"field_label optional_label\">Datetime</label>\n<div class=\"input-append date\" id=\"datetimepickerdatetime\">\n<input  value=\"\" class=\"optional\" type=\"text\" data-format=\"yyyy-MM-dd hh:mm\" name=\"datetime\" id=\"id_datetime\" />\n<span class=\"add-on\">\n<i data-time-icon=\"icon-time\" data-date-icon=\"icon-calendar\"></i>\n</span>\n</div>\n<script>$('#datetimepickerdatetime').datetimepicker();</script></div>\n<div class=\"field\">\n<label for=\"id_time\" class=\"field_label optional_label\">Time</label>\n<div class=\"input-append bootstrap-timepicker-component\">\n<input  value=\"\" class=\"optional nf_timepicker\" type=\"time\" name=\"time\" id=\"id_time\" />\n<span class=\"add-on\"><i class=\"icon-time\"></i></span>\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_enum\" class=\"field_label optional_label\">Enum</label>\n<select class=\"optional nf_comb\" name=\"enum\" id=\"id_enum\" />\n<option selected=\"selected\" value=\"\"> ... </option>\n<option value=\"1\">1</option>\n<option value=\"2\">2</option>\n<option value=\"3\">3</option>\n</select>\n</div>\n<div class=\"field\">\n<label for=\"id_rich_text\" class=\"field_label optional_label\">Rich Text</label>\n<div class=\"nf_widget\">\n<textarea class=\"optional ckeditor\" name=\"rich_text\" id=\"id_rich_text\" >\n</textarea>\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_text\" class=\"field_label optional_label\">Text</label>\n<textarea class=\"optional\" name=\"text\" id=\"id_text\" >\n</textarea>\n</div>\n<div class=\"field\">\n<label for=\"id_image\" class=\"field_label optional_label\">Image</label>\n<input type=\"hidden\" name=\"image\" value=\"\" />\n<input  value=\"\" class=\"optional\" type=\"file\" name=\"image_file\" id=\"id_image_file\" />\n</div>\n<div class=\"field\">\n<label for=\"id_file\" class=\"field_label optional_label\">File</label>\n<input class=\"optional\" type=\"file\" name=\"file\" id=\"id_file\" />\n</div>\n<div class=\"field\">\n<label for=\"id_file_picker\" class=\"field_label optional_label\">File Picker</label>\n<input  value=\"{&quot;url&quot;:&quot;http://featherfiles.aviary.com/2013-11-08/lqe7dik7cphyefe9/bdb746685c6c408b988e91403c81e59f.png&quot;,&quot;filename&quot;:&quot;Birthday_mail.jpg&quot;,&quot;mimetype&quot;:&quot;image/jpeg&quot;,&quot;size&quot;:222783,&quot;isWriteable&quot;:true}\" class=\"optional _filepicker\" type=\"hidden\" name=\"file_picker\" id=\"id_file_picker\" />\n<button class=\"btn btn-primary\" id=\"id_file_picker_button\">Pick File</button><a href=\"http://featherfiles.aviary.com/2013-11-08/lqe7dik7cphyefe9/bdb746685c6c408b988e91403c81e59f.png\" target=\"_blank\">Birthday_mail.jpg</a>\n<input type=\"checkbox\" name=\"file_picker_clear\" value=\"false\" /> Clear\n<img id='id_file_picker_thumb' src='http://featherfiles.aviary.com/2013-11-08/lqe7dik7cphyefe9/bdb746685c6c408b988e91403c81e59f.png' height='110' width='150'/>\n<script>$('#id_file_picker_button').click(function (e) {e.preventDefault(); trigger_filepicker('id_file_picker_thumb');});</script></div>\n<div class=\"field\">\n<label for=\"id_map\" class=\"field_label optional_label\">Map</label>\n<div class=\"nf_widget\">\n<input type=\"text\" name=\"map_address\" id=\"id_map_address\" value=\"\" />\n<input  value=\"32.066158,34.77781900000002\" class=\"optional nf_mapview\" type=\"hidden\" address_field=\"id_map_address\" name=\"map\" id=\"id_map\" />\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_num\" class=\"field_label optional_label\">Num</label>\n<input  value=\"\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"num\" id=\"id_num\" />\n</div>\n<div class=\"field\">\n<label for=\"id_num_validated\" class=\"field_label optional_label\">Num Validated</label>\n<input  value=\"\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"num_validated\" id=\"id_num_validated\" />\n</div>\n<div class=\"field\">\n<label for=\"id_num_with_params\" class=\"field_label optional_label\">Num With Params</label>\n<input  value=\"\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"num_with_params\" id=\"id_num_with_params\" />\n</div>\n<div class=\"field\">\n<label for=\"id_bool\" class=\"field_label optional_label\">Bool</label>\n<input  value=\"on\" class=\"optional\" type=\"checkbox\" name=\"bool\" id=\"id_bool\" />\n</div>\n<div class=\"field\">\n<label for=\"id_bool2\" class=\"field_label optional_label\">Bool2</label>\n<input  value=\"on\" class=\"optional\" type=\"checkbox\" checked=\"checked\" name=\"bool2\" id=\"id_bool2\" />\n</div>\n<div class=\"field\">\n<label for=\"id_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_list_tmpl_name\" class=\"field_label required_label\">Name</label>\n<input  value=\"\" class=\"required\" type=\"text\" name=\"list_tmpl_name\" id=\"id_list_tmpl_name\" />\n</div>\n<div class=\"field\">\n<label for=\"id_list_tmpl_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"list_tmpl_list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_list_tmpl_list_tmpl_name\" class=\"field_label optional_label\">Name</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"list_tmpl_list_tmpl_name\" id=\"id_list_tmpl_list_tmpl_name\" />\n</div>\n</div>\n<ul>\n</ul>\n</div>\n</div>\n</div>\n<ul>\n<li><div class=\"field\">\n<label for=\"id_list_li0_name\" class=\"field_label required_label\">Name</label>\n<input  value=\"hhh\" class=\"required\" type=\"text\" name=\"list_li0_name\" id=\"id_list_li0_name\" />\n</div>\n<div class=\"field\">\n<label for=\"id_list_li0_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"list_li0_list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_list_li0_list_tmpl_name\" class=\"field_label optional_label\">Name</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"list_li0_list_tmpl_name\" id=\"id_list_li0_list_tmpl_name\" />\n</div>\n</div>\n<ul>\n<li><div class=\"field\">\n<label for=\"id_list_li0_list_li0_name\" class=\"field_label optional_label\">Name</label>\n<input  value=\"ttt\" class=\"optional\" type=\"text\" name=\"list_li0_list_li0_name\" id=\"id_list_li0_list_li0_name\" />\n</div>\n</li>\n<li><div class=\"field\">\n<label for=\"id_list_li0_list_li1_name\" class=\"field_label optional_label\">Name</label>\n<input  value=\"yyyy\" class=\"optional\" type=\"text\" name=\"list_li0_list_li1_name\" id=\"id_list_li0_list_li1_name\" />\n</div>\n</li>\n<li><div class=\"field\">\n<label for=\"id_list_li0_list_li2_name\" class=\"field_label optional_label\">Name</label>\n<input  value=\"uuuuu\" class=\"optional\" type=\"text\" name=\"list_li0_list_li2_name\" id=\"id_list_li0_list_li2_name\" />\n</div>\n</li>\n</ul>\n</div>\n</div>\n</li>\n</ul>\n</div>\n</div>\n<div class=\"nf_fieldset toplevel closed\">\n<h2>object_with_list</h2>\n<div>\n<div class=\"field\">\n<label for=\"id_object_with_list.inner_list\" class=\"field_label optional_label\">Inner List</label>\n<div class=\"nf_listfield\" name=\"object_with_list.inner_list\">\n<div class=\"nf_hidden_template\">\n<input class=\"optional\" type=\"text\" name=\"object_with_list.inner_list_tmpl___self__\" id=\"id_object_with_list.inner_list_tmpl___self__\" />\n</div>\n<ul>\n<li><input  value=\"ggg\" class=\"optional\" type=\"text\" name=\"object_with_list.inner_list_li0___self__\" id=\"id_object_with_list.inner_list_li0___self__\" />\n</li>\n<li><input  value=\"hhh\" class=\"optional\" type=\"text\" name=\"object_with_list.inner_list_li1___self__\" id=\"id_object_with_list.inner_list_li1___self__\" />\n</li>\n</ul>\n</div>\n</div>\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_list_o_numbers\" class=\"field_label optional_label\">List O Numbers</label>\n<div class=\"nf_listfield\" name=\"list_o_numbers\">\n<div class=\"nf_hidden_template\">\n<input class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"list_o_numbers_tmpl___self__\" id=\"id_list_o_numbers_tmpl___self__\" />\n</div>\n<ul>\n<li><input  value=\"1\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"list_o_numbers_li0___self__\" id=\"id_list_o_numbers_li0___self__\" />\n</li>\n<li><input  value=\"2\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"list_o_numbers_li1___self__\" id=\"id_list_o_numbers_li1___self__\" />\n</li>\n<li><input  value=\"3\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"list_o_numbers_li2___self__\" id=\"id_list_o_numbers_li2___self__\" />\n</li>\n<li><input  value=\"4\" class=\"optional\" min=\"\" max=\"\" step=\"any\" type=\"number\" name=\"list_o_numbers_li3___self__\" id=\"id_list_o_numbers_li3___self__\" />\n</li>\n</ul>\n</div>\n</div>\n<div class=\"nf_fieldset toplevel closed\">\n<h2>object</h2>\n<div>\n<div class=\"nf_fieldset toplevel closed\">\n<h2>object</h2>\n<div>\n<div class=\"nf_fieldset toplevel closed\">\n<h2>object</h2>\n<div>\n<div class=\"field\">\n<label for=\"id_object.object.object.nested_string\" class=\"field_label optional_label\">Nested String</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"object.object.object.nested_string\" id=\"id_object.object.object.nested_string\" />\n</div>\n<div class=\"field\">\n<label for=\"id_object.object.object.nested_string_req\" class=\"field_label required_label\">Nested String Req</label>\n<input  value=\"123\" class=\"required\" type=\"text\" name=\"object.object.object.nested_string_req\" id=\"id_object.object.object.nested_string_req\" />\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n<div class=\"nf_fieldset toplevel closed\">\n<h2>embeded</h2>\n<div>\n<div class=\"field\">\n<label for=\"id_embeded.list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_embeded.list_tmpl_embeded.list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list_tmpl_embeded.list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_embeded.list_tmpl_embeded.list_tmpl_nested_string\" class=\"field_label optional_label\">Nested String</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"embeded.list_tmpl_embeded.list_tmpl_nested_string\" id=\"id_embeded.list_tmpl_embeded.list_tmpl_nested_string\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_tmpl_embeded.list_tmpl_nested_string_req\" class=\"field_label required_label\">Nested String Req</label>\n<input  value=\"\" class=\"required\" type=\"text\" name=\"embeded.list_tmpl_embeded.list_tmpl_nested_string_req\" id=\"id_embeded.list_tmpl_embeded.list_tmpl_nested_string_req\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_tmpl_embeded.list_tmpl_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list_tmpl_embeded.list_tmpl_list\">\n<div class=\"nf_hidden_template\">\n<input class=\"optional\" type=\"text\" name=\"embeded.list_tmpl_embeded.list_tmpl_list_tmpl___self__\" id=\"id_embeded.list_tmpl_embeded.list_tmpl_list_tmpl___self__\" />\n</div>\n<ul>\n</ul>\n</div>\n</div>\n</div>\n<ul>\n</ul>\n</div>\n</div>\n</div>\n<ul>\n<li><div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list_li0_embeded.list\">\n<div class=\"nf_hidden_template\">\n<div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_tmpl_nested_string\" class=\"field_label optional_label\">Nested String</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_tmpl_nested_string\" id=\"id_embeded.list_li0_embeded.list_tmpl_nested_string\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_tmpl_nested_string_req\" class=\"field_label required_label\">Nested String Req</label>\n<input  value=\"\" class=\"required\" type=\"text\" name=\"embeded.list_li0_embeded.list_tmpl_nested_string_req\" id=\"id_embeded.list_li0_embeded.list_tmpl_nested_string_req\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_tmpl_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list_li0_embeded.list_tmpl_list\">\n<div class=\"nf_hidden_template\">\n<input class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_tmpl_list_tmpl___self__\" id=\"id_embeded.list_li0_embeded.list_tmpl_list_tmpl___self__\" />\n</div>\n<ul>\n</ul>\n</div>\n</div>\n</div>\n<ul>\n<li><div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_li0_nested_string\" class=\"field_label optional_label\">Nested String</label>\n<input  value=\"\" class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_li0_nested_string\" id=\"id_embeded.list_li0_embeded.list_li0_nested_string\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_li0_nested_string_req\" class=\"field_label required_label\">Nested String Req</label>\n<input  value=\"nested\" class=\"required\" type=\"text\" name=\"embeded.list_li0_embeded.list_li0_nested_string_req\" id=\"id_embeded.list_li0_embeded.list_li0_nested_string_req\" />\n</div>\n<div class=\"field\">\n<label for=\"id_embeded.list_li0_embeded.list_li0_list\" class=\"field_label optional_label\">List</label>\n<div class=\"nf_listfield\" name=\"embeded.list_li0_embeded.list_li0_list\">\n<div class=\"nf_hidden_template\">\n<input class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_li0_list_tmpl___self__\" id=\"id_embeded.list_li0_embeded.list_li0_list_tmpl___self__\" />\n</div>\n<ul>\n<li><input  value=\"bab\" class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_li0_list_li0___self__\" id=\"id_embeded.list_li0_embeded.list_li0_list_li0___self__\" />\n</li>\n<li><input  value=\"aga\" class=\"optional\" type=\"text\" name=\"embeded.list_li0_embeded.list_li0_list_li1___self__\" id=\"id_embeded.list_li0_embeded.list_li0_list_li1___self__\" />\n</li>\n</ul>\n</div>\n</div>\n</li>\n</ul>\n</div>\n</div>\n</li>\n</ul>\n</div>\n</div>\n</div>\n</div>\n<div class=\"field\">\n<label for=\"id_mixed\" class=\"field_label optional_label\">Mixed</label>\n<textarea class=\"optional\" name=\"mixed\" id=\"id_mixed\" >\n</textarea>\n</div>\n";
