'use strict';
Error.stackTraceLimit = Infinity;

var s = 'mongodb://localhost/mongodb-driver-find-bug';

exports['Driver Bug'] = {
    'With Driver': function (test) {
        var domain = require('domain');
        var d = domain.create();
        var errOrig = new TypeError('let me out');
        d.once('error', function (err) {
            test.equals(err, errOrig);
            test.done();
        });
        d.run(function () {
            var mongodb = require('mongodb');
            mongodb.connect(s, {w: 1}, function (err, db) {
                db.on('error', function (err) {
                    test.equals(err, errOrig);
                    throw err;
                });
                db.collection('_formageuser_s').remove({}, function () {
                    db.collection('_formageuser_s').findOne({'username': ''}, function (err) {
                        if (err) throw err;
                    });

                    throw errOrig;
                });
            });
        });
    }
}
