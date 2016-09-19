"use strict";
var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: Types.Text }
});

schema.methods.toString = function() {
    return this.title;
};

var pages = module.exports = mongoose.model('pages', schema);
pages.singular = 'page';
//pages.formage = {section:'cms'};
