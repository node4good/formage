"use strict";
var fs = require("fs");
var path = require("path");
try {
    var jade = require("jade");
    var jadert = require("jade/runtime");
} catch (e) {
    console.log("no Jade, can't compile templates");
    return;
}

var js = "function joinClasses(val) {return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;};function nulls(val) {return val != null && val !== '';};var jade = {};\n";
js += "jade.attrs=" + jadert.attrs.toString() + ";\n";
js += "jade.escape=exports.escape=" + jadert.escape.toString() + ";\n";
var jadeFiles  = fs.readdirSync(path.join(__dirname, '..', 'views')).filter(function(file) {
    return file.substr(-5) === ".jade";
});
jadeFiles.forEach(function(file) {
    var key = file.substr(0, file.indexOf("."));
    var filePath = path.join(__dirname, '..', 'views', file);
    var src = fs.readFileSync(filePath);
    try {
        var compiled = jade.compile(src, {
            'debug': false,
            'pretty': true,
            'compileDebug': false,
            'client': true,
            'filename': filePath
        });
        js += "module.exports." + key + " = " + compiled.toString() + "; \n\n";
    } catch (e) {
        console.log(e);
        throw e;
    }
});
console.log('\x1B[36mformage\x1B[39m: compiled %d templates', jadeFiles.length);
var genDir = path.join(__dirname, '..', 'generated');
if (!fs.existsSync(genDir)) fs.mkdirSync(genDir);
fs.writeFileSync(path.join(genDir, 'templates.js'), js);
