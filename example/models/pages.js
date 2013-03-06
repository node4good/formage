var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var s = new mongoose.Schema({
    title: { type: String, required: true },

    gallery: [{
        value: String,
        picture: { type: Types.Picture }
    }]
});

s.methods.toString = function() {
    return this.title;
};

module.exports = mongoose.model('pages', s);