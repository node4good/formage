'use strict';
if (!module.parent) {
    console.error('Please don\'t call me directly.I am just the main app\'s minion.');
    process.process.exit(1);
}

var util = require('util');

var mongoose_module = require.main.require('mongoose');
var CDN_PREFIX = '';


var init = function () {
    var File = function File (path, options) {
        File.super_.call(this, path, options);
    };
    util.inherits(File, mongoose_module.Schema.Types.Mixed);
    File.prototype.cast = function (value, doc, init) {
        var ret = File.super_.prototype.cast.call(this, value, doc, init);
        if (ret && ret.path && CDN_PREFIX) {
            var file_parts = ret.path.split('/');
            ret.path = file_parts[file_parts.length - 1];
            ret.url = CDN_PREFIX + ret.path;
        }
        return ret;
    };

    mongoose_module.Types.File = Object;
    mongoose_module.Schema.Types.File = File;

    exports.File = File;

    var Picture = function Picture (path, options) {
        Picture.super_.call(this, path, options);
    };
    util.inherits(Picture, mongoose_module.Schema.Types.Mixed);
    Picture.prototype.cast = function (value, doc, init) {
        return Picture.super_.prototype.cast.call(this, value, doc, init);
    };

    mongoose_module.Types.Picture = Object;
    mongoose_module.Schema.Types.Picture = Picture;

    exports.Picture = Picture;


    var Integer = function Integer (path, options) {
        Integer.super_.call(this, path, options);
    };
    util.inherits(Integer, mongoose_module.Schema.Types.Number);
    Integer.prototype.cast = function (value, doc, init) {
        var num = Integer.super_.prototype.cast.call(this, value, doc, init);
        return Math.floor(num);
    };

    mongoose_module.Types.Integer = Number;
    mongoose_module.Schema.Types.Integer = Integer;

    exports.Integer = Integer;

    var GeoPoint = function GeoPoint (path, options) {
        GeoPoint.super_.call(this, path, options);
    };
    util.inherits(GeoPoint, mongoose_module.Schema.Types.Mixed);

    exports.GeoPoint = GeoPoint;

    mongoose_module.Types.GeoPoint = Object;
    mongoose_module.Schema.Types.GeoPoint = GeoPoint;

    var Text = function Text (path, options) {
        Text.super_.call(this, path, options);
    };
    util.inherits(Text, mongoose_module.Schema.Types.String);

    exports.Text = Text;

    mongoose_module.Types.Text = String;
    mongoose_module.Schema.Types.Text = Text;

    var Html = function Html (path, options) {
        Html.super_.call(this, path, options);
    };
    util.inherits(Html, Text);

    exports.Html = Html;

    mongoose_module.Types.Html = String;
    mongoose_module.Schema.Types.Html = Html;
};

exports.setCdnPrefix = function (prefix) {
    CDN_PREFIX = prefix;
};

exports.loadTypes = function (mongoose) {
    mongoose_module = mongoose;
    init();
};

if (module.parent.mongoose_module) {
    init();
}
