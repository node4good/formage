var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, required: true },

    gallery: [{
        picture: { type: Types.Picture },
    }]
});

schema.methods.toString = function() {
    return this.title;
};

module.exports = mongoose.model('pages', schema);