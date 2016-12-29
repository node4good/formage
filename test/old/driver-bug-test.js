'use strict';
const assert = require('assert');
Error.stackTraceLimit = Infinity;

const s = 'mongodb://127.0.0.1:27017/test';

describe("Driver Bug", function () {
    this.timeout(20000);
    it('With Driver', function (done) {
        const MongoClient = require('mongodb').MongoClient;
        MongoClient.connect(s, function (err, db) {
            if (err) done(err);
            if (!db) done('no db');
            done();
        });
    });
});
