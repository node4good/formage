'use strict';
Error.stackTraceLimit = Infinity;
var buster = require('buster');
buster.spec.expose(); // Make some functions global
var express = require('express');
var supertest = require('supertest');
var sinon = require('sinon');


describe("A module", function () {
    it("states the obvious", function () {
        expect(true).toEqual(true);
    });
});


module.exports = {
    "init": function (test) {
        test.ok(true);
        test.done();
    },


//    "http": function (test) {
//        test.expect(1);
//        nodeunit.utils.httputil(app.router, function (server, client) {
//            client.fetch('GET', '/', {}, function (resp) {
//                test.equals('hello world', resp.body);
//                test.done();
//            });
//        });
//    },


//    "Test Path shit": function (test) {
//        var url_join = require('../paths.js').testable_url_join;
//        test.equal(url_join(), '.', 'Empty Args');
//        test.equal(url_join(''), '.', 'empty string');
//        test.equal(url_join('/'), '/', 'Just root');
//        test.equal(url_join('/', '/'), '/', 'Empty Args');
//        test.equal(url_join('/s', '/'), '/s/', 'Empty Args');
//        test.equal(url_join('/s', '/g'), '/s/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', ''), '/s/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', '/'), '/s/g/', 'Empty Args');
//        test.equal(url_join('/s', '/g', '/g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', 'g', '/g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', '/g', 'g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('/s', 'g', 'g'), '/s/g/g', 'Empty Args');
//        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
//        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
//        test.equal(url_join(null, 'g'), 'g', 'Empty Args');
//        test.equal(url_join(null, 'g', 'g'), 'g/g', 'Empty Args');
//        test.done();
//    },


    "For the trick in AdminForm.index": function (test) {
        test.ok('gaga' in {'gigi': 1, 'gogo': 1, 'gaga': 1} === true, "In array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gaga')) === true, "Might be a bug");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gigi')) === false, "When first it's false");
        test.ok(['gigi', 'gogo', 'gaga'].indexOf('gagu') === -1, "Not in array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('xxx')) !== false, "-1 when not in array");
        test.ok(Boolean(~['gigi', 'gogo', 'gaga'].indexOf('gigi')) === true, "Binary not");
        test.done();
    },


    "Minimal Mock to init": function (test) {
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        //noinspection JSUnresolvedFunction
        var mock_app = {
            get: sinon.spy(),
            post: sinon.spy(),
            delete: sinon.spy(),
            use: sinon.spy()
        };

        var admin = admin_module.createAdmin(mock_app, null, mock_mongoose);
        test.done();
    },


    "Init with real app": function (test) {
        var express = require('express');
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);
        var server = app.listen(3456, function () {
            server.close();
            test.done();
        });
    },


    "Init with supertest app": function (test) {
        var express = require('express');
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {
            },
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);
        var server = supertest(app).get('/')
            .expect('Content-Type', 'text/html')
            .expect('Content-Length', '20')
            .expect(200)
            .end(function (err, res) {
                //test.equal(err, null);
                test.ok(res);
                test.done();
            });
    },



    "Mock test first page": function (test) {
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {},
            Schema: function () {
                this.methods = {}
            }
        };

        var app = express();
        var admin = admin_module.createAdmin(app, null, mock_mongoose);

        var mock_req = {session: {_mongooseAdminUser: {}}};
        var mock_res = {};
        app.admin_app.routes.get[0].callbacks[0](mock_req, mock_res, sinon.spy());
    }
};


