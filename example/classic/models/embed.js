//noinspection JSUnresolvedVariable
var mongoose = require('mongoose');


var schema = new mongoose.Schema({
    parent: {
        child: String,
        child2: String
    },
    mother: [Number],
    number: Number
});
var model = module.exports = mongoose.model('embed', schema);
