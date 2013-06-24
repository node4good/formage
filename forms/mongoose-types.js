'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var util = require('util');
var mongoose = require.main.require('mongoose');


var CDN_PREFIX = '';


var init = function () {
    var File = function File (path, options) {
        File.super_.call(this, path, options);
    };
    util.inherits(File, mongoose.Schema.Types.Mixed);
    File.prototype.cast = function (value, doc, init) {
        var ret = File.super_.prototype.cast.call(this, value, doc, init);
        if (ret && ret.path && CDN_PREFIX) {
            var file_parts = ret.path.split('/');
            ret.path = file_parts[file_parts.length - 1];
            ret.url = CDN_PREFIX + ret.path;
        }
        return ret;
    };

    mongoose.Types.File = Object;
    mongoose.Schema.Types.File = File;

    exports.File = File;

    var Picture = function Picture (path, options) {
        Picture.super_.call(this, path, options);
    };
    util.inherits(Picture, mongoose.Schema.Types.Mixed);
    Picture.prototype.cast = function (value, doc, init) {
        return Picture.super_.prototype.cast.call(this, value, doc, init);
    };

    mongoose.Types.Picture = Object;
    mongoose.Schema.Types.Picture = Picture;

    exports.Picture = Picture;


    var Time = function Time (path, options) {
        Time.super_.call(this, path, options);
    };
    util.inherits(Time, mongoose.Schema.Types.String);
    Time.prototype.cast = function (value, doc, init) {
        return Picture.super_.prototype.cast.call(this, value, doc, init);
    };

    mongoose.Types.Time = Object;
    mongoose.Schema.Types.Time = Time;

    exports.Time = Time;


    var Integer = function Integer (path, options) {
        Integer.super_.call(this, path, options);
    };
    util.inherits(Integer, mongoose.Schema.Types.Number);
    Integer.prototype.cast = function (value, doc, init) {
        var num = Integer.super_.prototype.cast.call(this, value, doc, init);
        return Math.floor(num);
    };

    mongoose.Types.Integer = Number;
    mongoose.Schema.Types.Integer = Integer;

    exports.Integer = Integer;

    var GeoPoint = function GeoPoint (path, options) {
        GeoPoint.super_.call(this, path, options);
    };
    util.inherits(GeoPoint, mongoose.Schema.Types.Mixed);

    exports.GeoPoint = GeoPoint;

    mongoose.Types.GeoPoint = Object;
    mongoose.Schema.Types.GeoPoint = GeoPoint;

    var Text = function Text (path, options) {
        Text.super_.call(this, path, options);
    };
    util.inherits(Text, mongoose.Schema.Types.String);

    exports.Text = Text;

    mongoose.Types.Text = String;
    mongoose.Schema.Types.Text = Text;

    var Html = function Html (path, options) {
        Html.super_.call(this, path, options);
    };
    util.inherits(Html, Text);

    exports.Html = Html;

    mongoose.Types.Html = String;
    mongoose.Schema.Types.Html = Html;
};

exports.setCdnPrefix = function (prefix) {
    CDN_PREFIX = prefix;
};

exports.loadTypes = init;
