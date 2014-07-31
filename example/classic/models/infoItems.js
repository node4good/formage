"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    request = require('request'),
    MPromise = require('mpromise'),
    _ = require('lodash-contrib'),
    Types = Schema.Types;

var ITEM_LIMT = 10;

var schema = new Schema({
    item_type: { type: String, enum: ['track', 'text', 'artist', 'image', 'interview', 'article', 'other'], default: 'track'},
    title: { type: String, important: 1},
    artist: { type: String, important: 1 },
    album: { type: String, important: 1 },
    label: { type: String },
    year: { type: String },
    text: Types.Text,
    image: { type: Types.Filepicker, widget: 'FilepickerPictureWidget' },
    url: { type: String }
});

schema.statics.selected = function (item) {
    var InfoItems = this;
    var item_to_save = _.find(InfoItems._tempDiscogs, {'id': item.id});
//    request.post('https://www.filepicker.io/api/store/S3?key=AxlFO5ZRNQse9kP2RpUFez', {form: {'url': 'http://api.discogs.com/image/R-90-5757801-1401826971-3778.jpeg'}}, function(err, res, data){
//        console.log(err, res);
//    });
    if (!item_to_save) return MPromise.fulfilled(item);
    return item_to_save.save();
};

schema.statics.getFromDiscogs = function getFromDiscogs(term) {
    var InfoItems = this;
    var p = new MPromise;
    request.get("http://api.discogs.com/database/search?per_page=5&title=" + term + '&per_page=5', {
        timeout: 1500,
        headers: {
            'User-Agent': 'KZRadio/1.0',
            'Content-Type': 'application/json'
        }
    }, function (err, response, body) {
        if (err) {
            console.log(err.stack);
            return p.fulfill([]);
        }
        if (response.statusCode > 200) return p.fulfill([]);
        try {
            var results = JSON.parse(body).results;
            var temp = results.map(
                function (item) {
                    return new InfoItems({
                        title: item.title,
                        image: item.thumb,
                        artist: item.artist,
                        album: item.title,
                        year: item.year,
                        label: item.label ? item.label[0] : ""
                    });
                }
            );
            InfoItems._tempDiscogs = (InfoItems._tempDiscogs || []).concat(temp);
            var discogs = temp.map(function (item) {
                return { 'id': item.id, text: item.title, type: 'discogs' };
            });
            console.log("found %d items from discogs", discogs.length);
            return p.fulfill(discogs);
        } catch (e) {
            console.log("Bad discogs response for", term);
            console.log(e.stack);
            return p.fulfill([]);
        }
    });
    return p;
};


schema.statics.search = function (term) {
    var InfoItems = this;
    var discogs = [];
    var p = InfoItems.getFromDiscogs(term).then(
        function (argDiscogs) {
            discogs = (argDiscogs && argDiscogs.length) ? [{ 'id': null, text: "==== from discogs ==="}].concat(argDiscogs) : [];

            var terms = term.split(' ').map(function (t) {
                try {
                    return new RegExp(t, "i");
                } catch (e) {
                    console.log(e);
                }
            });

            var t = terms.pop();
            var q = InfoItems.find({ $or: [
                { title: t },
                { artist: t },
                { label: t }
            ]});
            q = terms.reduce(function (q1, t) {
                return q1.and({ $or: [
                    { title: t },
                    { artist: t },
                    { label: t }
                ]});
            }, q);
            return q.limit(ITEM_LIMT).exec();
        }
    ).then(
        function (items) {
            items = (items || [])
                .map(function (item) { return { 'id': item._id.toString(), text: item.toString() }; })
                .concat(discogs);
            return items;
        }
    );
    return p;
};

schema.methods.toString = function () {
    return this.artist + ' - ' + this.title;
};

schema.pre('save', function (next, done) {
    console.log(done);
    next();
});


schema.formage = {
    list: ['artist', 'title', 'label', 'image'],
    filters: ['item_type'],
    search: ['title', 'artist', 'album', 'label']
};

module.exports = schema;
