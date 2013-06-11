Error.stackTraceLimit = Infinity;
var testFiles = ["D:/empeeric/formage-admin/node_modules/supertest/test/supertest.js"];
var Mocha = require('mocha');
var mocha = new Mocha;
mocha.reporter('tap').ui('bdd');
for (var i = 0; i < testFiles.length; i++) {
    mocha.addFile(testFiles[i]);
}
var runner = mocha.run(function () {
    console.log('finished');
    process.exit(0);
});
