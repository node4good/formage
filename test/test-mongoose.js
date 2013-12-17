'use strict';
/*global makeRes,mock_req_proto,mock_res_proto,should */
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
                var embed = require('../example/classic/models/embed');
                var bugs = require('../example/classic/models/bugs');
                var express = require('express');
                var app = express();
                ctx.registry = formage.init(app, express, {pages: pages, AppliesTo: AppliesTo, Tests: tests, config: config, gallery: gallery, embed:embed, bugs:bugs}, {
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
        delete ctx.registry;
        delete ctx.mongoose;
        delete ctx.app;
    });


    it("post to `tests`", function (done) {
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
                'embeded.name1': '1',
                'embeded.list1_li0_name2': '2',
                'embeded.list1_li0_embeded2.name3': '3',
                'embeded.list1_li0_embeded2.list3_li0_name4': '4',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.nested_string5': '5s',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.nested_string_req5': '5sr',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.list5_li0___self__': '6',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.list5_li1___self__': '6',
                'object.object.object.nested_string': '',
                'object.object.object.nested_string_req': '123',
                mixed: ''
            }
        }, mock_req_proto);
        var mock_res = makeRes(mock_req, done);

        mock_res.redirect = function (url) {
            var doc = this._debug_form.instance;
            var test_doc_id = doc.id;
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
            expect(doc.embeded.list1[0].embeded2.list3[0].embeded4.nested_string_req5).to.equal('5sr');
            expect(doc.embeded.list1[0].embeded2.list3[0].embeded4.list5[0]).to.equal('6');
            expect(doc.embeded.list1[0].embeded2.list3[0].embeded4.list5[1]).to.equal('6');

            Number(0).should.equal(url.indexOf("/admin/model/Test"));
            var mock_req = _.defaults({
                url: '/model/Tests/document/' + test_doc_id,
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.render = function (view, locals) {
                expect(view).to.equal("document.jade");
                expect(locals).to.have.property("form").to.have.property("instance");
                var instance = locals.form.instance;
                expect(instance).to.have.property('string_req').equal("123");
                expect(instance).to.not.have.property('enum');
                expect(instance.object.object.object).to.have.property('nested_string_req').equal("123");
                expect(doc).to.have.property('list_o_numbers').with.property('length').equal(4);
                expect(instance.list_o_numbers[0]).to.equal(1);
                expect(instance.list_o_numbers[1]).to.equal(2);
                expect(instance.list_o_numbers[2]).to.equal(3);
                expect(instance.list_o_numbers[3]).to.equal(4);

                this.req.app.render(view, locals, function (err, doc) {
                    if (err) return done(err);
                    should.exist(doc);

                    var mock_req = _.defaults({
                        url: '/json/model/Tests/action/delete',
                        body: {ids: [test_doc_id]},
                        method: "POST"
                    }, mock_req_proto);
                    var mock_res = makeRes(mock_req, done);
                    mock_res.end = function (msg) {
                        done(msg);
                    };
                    mock_res.json = function (lines) {
                        expect(lines).to.have.length(2);
                        expect(lines[0]).to.have.string(test_doc_id);
                        done();
                    };
                    return ctx.app.handle(mock_req, mock_res);
                });
            };
            ctx.app.handle(mock_req, mock_res);
        };
        ctx.app.handle(mock_req, mock_res);
    });


    it("post to `embed`", function (done) {
        var mock_req = _.defaults({
            url: "/model/embed/document/new",
            method: "POST",
            headers: {},
            body: {
                'embeded.name1': '1',
                'embeded.list1_li0_name2': '2',
                'embeded.list1_li0_embeded2.name3': '3',
                'embeded.list1_li0_embeded2.list3_li0_name4': '4',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.nested_string5': '5s',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.nested_string_req5': '5sr',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.list5_li1___self__': '5',
                'embeded.list1_li0_embeded2.list3_li0_embeded4.list5_li0___self__': '6'
            }
        }, mock_req_proto);
        var mock_res = makeRes(mock_req, done);

        mock_res.redirect = function (url) {
            expect(url).to.have.string("/admin/model/embed");

            var instance = this._debug_form.instance;
            var test_doc_id = instance.id;
            expect(instance.embeded.list1[0].embeded2.list3[0].embeded4.nested_string_req5).to.equal('5sr');
            expect(instance.embeded.list1[0].embeded2.list3[0].embeded4.list5[0]).to.equal(5);
            expect(instance.embeded.list1[0].embeded2.list3[0].embeded4.list5[1]).to.equal(6);

            var test = this;
            var pages = ctx.registry.models['pages'].model;
            var old_pages_find = pages.find;
            pages.find = function () { return {limit : function () {return {exec: function (cb) {return cb(null, [new pages({_id: '529321b430de15681b00000b', title:'gaga'})]) }}}}};
            test.rest_models = function () { pages.find = old_pages_find; };
            var mock_req = _.defaults({
                url: '/model/embed/document/' + test_doc_id,
                method: "GET"
            }, mock_req_proto);

            var mock_res = makeRes(mock_req, done);

            mock_res.render = function (view, locals) {
                // fragile
                var actual = String(locals.form);
                var expected = global.renderedEmbeded;
                expect(actual).to.equal(expected);

                this.req.app.render(view, locals, function (err, doc) {
                    test.rest_models();
                    delete test.rest_models;
                    if (err) {
                        done(err);
                        return;
                    }
                    should.exist(doc);
                    done();
                });
            };
            ctx.app.handle(mock_req, mock_res);
        };
        ctx.app.handle(mock_req, mock_res);
    });


    it("get `embed`", function (done) {
        var test = this;
        var embed = ctx.registry.models['embed'].model;
        var old_embed_findbyid = embed.findById;
        embed.findById = function (_, cb) { cb(null, new embed(embedMockObj)) };
        var pages = ctx.registry.models['pages'].model;
        var old_pages_find = pages.find;
        pages.find = function () { return {limit : function () {return {exec: function (cb) {return cb(null, [new pages({_id: '529321b430de15681b00000b', title:'gaga'})]) }}}}};
        test.rest_models = function () {embed.findById = old_embed_findbyid; pages.find = old_pages_find; };

        var mock_req = _.defaults({
            url: '/model/embed/document/mockmockmock',
            method: "GET"
        }, mock_req_proto);

        var mock_res = makeRes(mock_req, done);

        mock_res.render = function (view, locals) {
            test.rest_models();
            delete test.rest_models;

            // fragile
            var actual = String(locals.form);
            var expected = renderedEmbeded;
            expect(actual).to.equal(expected);

            this.req.app.render(view, locals, function (err, doc) {
                if (err) {
                    done(err);
                    return;
                }
                should.exist(doc);
                done();
            });
        };
        ctx.app.handle(mock_req, mock_res);
    });

    it("update `embed`", function (done) {
        var test = this;
        var embed = ctx.registry.models['embed'].model;
        var old_embed_findbyid = embed.findById;
        embed.findById = function (_, cb) { cb(null, new embed(embedMockObj)) };
        var pages = ctx.registry.models['pages'].model;
        var old_pages_find = pages.find;
        pages.find = function () { return {limit : function () {return {exec: function (cb) {return cb(null, [new pages({_id: '529321b430de15681b00000b', title:'gaga'})]) }}}}};
        test.rest_models = function () {embed.findById = old_embed_findbyid; pages.find = old_pages_find;};

        var mock_req = _.defaults({
            url: '/model/embed/document/mockmockmock',
            method: "POST",
            headers: {},
            body: {
//                'embeded.list1_li0_name2': 'a',
                'embeded.list1_li1_name2': 'updated'
            }
        }, mock_req_proto);

        var mock_res = makeRes(mock_req, done);
        mock_res.redirect = function (url) {
            test.rest_models();
            delete test.rest_models;
            expect(url).to.have.string("/admin/model/embed");

            var instance = this._debug_form.instance;
            expect(instance.embeded.list1[0].name2).to.equal('updated');
            expect(instance.embeded.list1).to.have.length(1);
            done();
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


    it("test document - post mime form with picture", function (done) {
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

        var uploadSentinal;
        require('cloudinary').uploader.upload = function (path, callback) {
            uploadSentinal = true;
            expect(path).to.exist;
            callback({});
        };

        mock_res.json = function (status, data) {
            expect(status).to.equal(200, data);
            expect(uploadSentinal).to.be.true;
            expect(data).to.have.property('title').equal(mock_req.body.title, data + mock_res._debug_form);
            done();
        };

        ctx.app.handle(mock_req, mock_res);
    });


    it("test document - post mime form with picture array", function (done) {
        var gallery_post = require('fs').readFileSync('test/fixtures/gallery-post-picture-array.mime', 'binary');
        var mock_req = _.defaults({
            url: "/json/model/gallery/document/new",
            method: "POST",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryjnXlxYPhkdwEOBWZ',
                'content-length': gallery_post.length
            },
            pipe: function (dest) {
                dest.write(gallery_post);
                dest.end();
            },
            unpipe: _.identity
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        var uploadSentinal = 0;
        require('cloudinary').uploader.upload = function (path, callback) {
            uploadSentinal++;
            expect(path).to.exist;
            callback({});
        };

        mock_res.json = function (status, data) {
            expect(status).to.equal(200, data);
            expect(uploadSentinal).to.be.equal(3);
            expect(data).to.have.property('title').equal(mock_req.body.title, data + mock_res._debug_form);
            done();
        };

        ctx.app.handle(mock_req, mock_res);
    });


    it("post mime form with picture to embed", function (done) {
        var gallery_post = require('fs').readFileSync('test/fixtures/embed-post.mime', 'binary');
        var mock_req = _.defaults({
            url: "/json/model/embed/document/new",
            method: "POST",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary4LIjID8kYT5KYTAf',
                'content-length': gallery_post.length
            },
            pipe: function (dest) {
                dest.write(gallery_post);
                dest.end();
            },
            unpipe: _.identity
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        var uploadSentinel;
        require('cloudinary').uploader.upload = function (path, callback) {
            uploadSentinel = true;
            expect(path).to.exist;
            callback({mock:'mock'});
        };

        mock_res.json = function (status, data) {
            expect(status).to.equal(200, data);
            expect(uploadSentinel).to.be.true;
            expect(data).to.have.property('embeded');
            done();
        };

        ctx.app.handle(mock_req, mock_res);
    });


    it("post mime form to bugs", function (done) {
        var gallery_post = require('fs').readFileSync('test/fixtures/bugs_ref.mime');
        var mock_req = _.defaults({
            url: "/json/model/bugs/document/new",
            method: "POST",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary0jsAEhhbswVyo6BB',
                'content-length': gallery_post.length
            },
            pipe: function (dest) {
                dest.write(gallery_post);
                dest.end();
            },
            unpipe: _.identity
        }, mock_req_proto);
        var mock_res = _.defaults({ req: mock_req }, mock_res_proto);

        mock_res.json = function (status, data) {
            expect(status).to.equal(200, data);
            expect(data).to.have.property('refs');
            done();
        };

        ctx.app.handle(mock_req, mock_res);
    });


    it("Mock test model page", function (done) {
        var mock_req = _.defaults({
            url: "/model/AppliesTo/",
            method: "GET"
        }, mock_req_proto);
        var mock_res = makeRes(mock_req, done);

        mock_res.render = function (view, options) {
            expect(view).to.equal("model.jade");
            expect(options).to.have.property('actions').with.length(1);
            expect(options).to.have.property('dataTable').with.property('header').with.length(3);
            this.req.app.render(view, options, function (err, doc) {
                done(err);
            });
        };

        ctx.app.handle(mock_req, mock_res);
    });



    describe('core screens', function () {
        require('./common/core_test')(ctx);
    });
});


var embedMockObj = {
    "_id" : "528d07cb6bb142ac2200001c",
    "embeded" : {
        "list1" : [{
            "name2" : "2",
            "_id" : "528d0b84c8851a141500001d",
            "embeded2" : {
                "name3" : "3",
                "list3" : [{
                    "name4" : "4",
                    "_id" : "528d0b84c8851a141500001e",
                    "embeded4" : {
                        "nested_string5" : "5s",
                        "nested_string_req5" : "5sr",
                        "pic" : null,
                        "list5" : [5, 6]
                    }
                }]
            }
        }],
        "name1" : "1"
    }
};
