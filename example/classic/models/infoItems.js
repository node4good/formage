"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    request = require('request'),
    MPromise = require('mpromise'),
    Types = Schema.Types;

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

schema.statics.search = function(term){
    var infoItems = this,
        expression = new RegExp(term, "i");

    var d = new MPromise;
    request.get("http://api.discogs.com/database/search?per_page=5&title=" + term + '&per_page=5', {
        headers: {
            'User-Agent': 'KZRadio/1.0',
            'Content-Type': 'application/json'
        }
    }, function(err, response, body){
        if(err) return d.reject(err);
        d.fulfill(body);
    });

    var p = d.then(function(body) {
        var query = infoItems.find({ $or: [
            { title: expression },
            { artist: expression },
            { label: expression }
        ] }).limit(5);
        var p2 = query.exec().then(
            function (items) {
                global.registry.temp_info_items = [];

//                _.forEach(JSON.parse(body).results, function(item){
//                    var temp = {
////                        item_type:'track',
////                        title: item.title,
////                        artist: item.artist,
////                        album: item.album,
////                        label: item.label,
////                        year: item.year,
////                        image:
//                    };
//                });

                var discogs_map = JSON.parse(body).results.map(function (item) {
                    return {
                        '_id': item.uri,
                        title: item.title,
                        toString: function () {
                            return this.title;
                        }
                    };
                });

                return items.concat(discogs_map);
            }
        );
        return p2;
    });
    return p;

};

schema.methods.toString = function(){
    return this.artist + ' - ' + this.title;
};


schema.formage = {
    list: ['artist', 'title', 'label', 'image'],
    filters: ['item_type'],
    search: ['title', 'artist', 'album', 'label']
};

module.exports = schema;
