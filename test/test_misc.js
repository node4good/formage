'use strict';
var testCase = require('nodeunit').testCase;
var express = require('express');
var request = require('request');
var chai = require('chai')
    , spies = require('chai-spies');
chai.spy = function () {};
chai.use(spies);
var supertest = require('supertest');
var nconf = require("nconf");
nconf;
nconf.set('database:host', '127.0.0.1');
nconf.set('database:port', 5984);
nconf.get('database');

module.exports = testCase({
    "0": function (test) {
        test.ok(true);
        test.done();
    },

    "Test Path shit": function (test) {
        var url_join = require('../paths.js').testable_url_join;
        test.equal(url_join(), '.', 'Empty Args');
        test.equal(url_join(''), '.', 'empty string');
        test.equal(url_join('/'), '/', 'Just root');
        test.equal(url_join('/', '/'), '/', 'Empty Args');
        test.equal(url_join('/s', '/'), '/s/', 'Empty Args');
        test.equal(url_join('/s', '/g'), '/s/g', 'Empty Args');
        test.equal(url_join('/s', '/g', ''), '/s/g', 'Empty Args');
        test.equal(url_join('/s', '/g', '/'), '/s/g/', 'Empty Args');
        test.equal(url_join('/s', '/g', '/g'), '/s/g/g', 'Empty Args');
        test.equal(url_join('/s', 'g', '/g'), '/s/g/g', 'Empty Args');
        test.equal(url_join('/s', '/g', 'g'), '/s/g/g', 'Empty Args');
        test.equal(url_join('/s', 'g', 'g'), '/s/g/g', 'Empty Args');
        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
        test.equal(url_join('s', 'g', 'g'), 's/g/g', 'Empty Args');
        test.equal(url_join(null, 'g'), 'g', 'Empty Args');
        test.equal(url_join(null, 'g', 'g'), 'g/g', 'Empty Args');
        test.done();
    },


    "For the trick in AdminForm.index": function (test) {
        test.ok('gaga' in {'gigi': 1, 'gogo': 1, 'gaga': 1} === true, "In array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gaga')) === true, "Might be a bug");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('gigi')) === false, "When first it's false");
        test.ok(['gigi', 'gogo', 'gaga'].indexOf('gagu') === -1, "Not in array");
        test.ok(Boolean(['gigi', 'gogo', 'gaga'].indexOf('xxx')) !== false, "-1 when not in array");
        test.ok(Boolean(~['gigi', 'gogo', 'gaga'].indexOf('gigi')) === true, "Binary not");
        test.done();
    },


    "Load the whole module": function (test) {
        require('..');
        test.done();
    },


    "Minimal Mock to init": function (test) {
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {},
            Schema: function () {
                this.methods = {}
            }
        };

        //noinspection JSUnresolvedFunction
        var mock_app = {
            get: chai.spy(function () {}),
            post: chai.spy(function () {}),
            delete: chai.spy(function () {}),
            use: chai.spy(function () {})
        };

        var admin = admin_module.createAdmin(mock_app, null, mock_mongoose);
        test.done();
    },


    "Init with real app": function (test) {
        var express = require('express');
        var admin_module = require('..');

        var mock_mongoose = {
            model: function () {},
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
            model: function () {},
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
            .end(function(err, res){
                if (err) throw err;
                test.equals(res, 'Hello')
                test.done();
            });
    },

//    'check admin form save': function (test) {
//        var mock_data = {};
//        var form = new Form(mock_data);
//        form.save(function() {
//            test.done();
//        });
//    },


//    "Mock test first page": function (test) {
//        var admin_module = require('..');
//
//        var mock_mongoose = {
//            model: function () {},
//            Schema: function () {
//                this.methods = {}
//            }
//        };
//
//        var app = chai.spy(express());
//        var admin = admin_module.createAdmin(app, null, mock_mongoose);
//
//        var mock_req = {};
//        var mock_res = {};
//        app.routes.get[0].callbacks[0](mock_req, mock_res);
//    }

});
