"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Types = Schema.Types;

var schema = new Schema({
    item_type: { type: String, enum: ['track', 'text', 'artist', 'image', 'interview', 'article', 'other'], default: 'track'},
    title: { type: String },
    artist: { type: String },
    album: { type: String },
    label: { type: String },
    year: { type: String },
    text: Types.Text,
    image: { type: Types.Filepicker, widget: 'FilepickerPictureWidget' },
    url: { type: String },
    order: { type: Number, editable: false, default: 0 }
});

schema.methods.toString = function(){
    return this.title;
};

schema.formage = {
    list: ['title', 'artist', 'image'],
    list_populate: ['navigation', 'channel'],
    order_by: ['order'],
    sortable: 'order',
    section: 'Radio'
};

module.exports = schema;
