"use strict";
var fs = require("fs");
var path = require("path");
var jade = require("jade");
var jadert = require("jade/runtime");

var js = "function joinClasses(val) {return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;};function nulls(val) {return val != null && val !== '';};var jade = {};\n";
js += "jade.attrs=" + jadert.attrs.toString() + ";\n";
js += "jade.escape=exports.escape=" + jadert.escape.toString() + ";\n";
var jadeFiles  = fs.readdirSync(path.join(__dirname, 'views')).filter(function(file) {
    return file.substr(-5) === ".jade";
});
jadeFiles.forEach(function(file) {
    var key = file.substr(0, file.indexOf("."));
    var filePath = path.join(__dirname, 'views', file);
    var src = fs.readFileSync(filePath);
    try {
        var compiled = jade.compile(src, {
            debug: false,
            compileDebug: false,
            client: true,
            filename: filePath
        });
        js += "module.exports." + key + " = " + compiled.toString() + "; \n\n";
    } catch (e) {
        console.log(e);
        throw e;
    }
});
fs.writeFileSync(path.join(__dirname, 'templates.js'), js);
