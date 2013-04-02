'use strict';
var testCase = require('nodeunit').testCase,
    express = require('express'),
    request = require('request'),
    chai = require('chai'),
    spies = require('chai-spies'),
    supertest = require('supertest'),
    nconf = require("nconf");

chai.spy = function () {};
chai.use(spies);

nconf.set('database:host', '127.0.0.1');
nconf.set('database:port', 5983);
nconf.get('database');

var dep = require('../dependencies');

module.exports = testCase({
    "0": function (test) {
        test.ok(true);
        test.done();
    },

    "no deps": function(test) {
        var models = {
            users: {},
            posts: {}
        };

        dep.check(models, 'users', 2341234, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    },

    "one dep": function (test) {
        var id = 22512;

        var models = {
            users: {},
            posts: {
                model: {
                    schema: { paths: {
                        author: { options: { ref: 'users' } }
                    } },
                    find: function(query, cb) {
                        var res = models.posts.data.filter(function(item) {
                            return item.author == id;
                        });
                        cb(null, res);
                    }
                },
                data: [
                    { author: id },
                    { author: id },
                    { author: 2 },
                ]
            }
        };

        dep.check(models, 'users', 2341234, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    },

    "two dep": function (test) {
        var id = 234298;

        var models = {
            users: {},
            message: {
                model: {
                    schema: { paths: {
                        from: { options: { ref: 'users' } },
                        to: { options: { ref: 'users' } }
                    } },
                    find: function(query, cb) {
                        console.log('query', query);
                        var res = models.message.data.filter(function(item) {
                            return item.from == id ||
                                item.to == id;
                        });
                        cb(null, res);
                    }
                },
                data: [
                    { from: id, to: 2 },
                    { from: 2, to: id },
                ]
            }
        };

        dep.check(models, 'users', id, function(err, res) {
            console.log('result:', res);
            test.done(!!err);
        });
    }
});
