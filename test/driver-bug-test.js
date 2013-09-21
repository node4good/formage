'use strict';
Error.stackTraceLimit = Infinity;

var s = 'mongodb://localhost/mongodb-driver-find-bug';

exports.driverBugWithDriver = function (test) {
    var mongodb = require('mongodb');
    mongodb.connect(s, function (err, db) {
        db.collection('_formageuser_s').remove({}, function () {
            db.collection('_formageuser_s').findOne({'username': ''}, function (err) {
                if (err) throw err;
            });

            throw new Error('let me out');
        });
    });
    test.done();
};


exports.driverBugWithMongoose = function (test) {
    var mongoose = require('mongoose');
    mongoose.set('debug', true);
    var db = mongoose.createConnection(s);
    db.collection('_formageuser_s').remove({}, function () {
        db.collection('_formageuser_s').findOne({'username': ''}, function (err) {
            if (err) throw err;
        });

        throw new Error('let me out');
    });
    test.done();
};
