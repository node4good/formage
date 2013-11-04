var mongoose = require('mongoose');
var Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    fieldset: {
        name: String,
        age: Number
    },
    listfield: [String],
    listfield2: [{
        name: String
    }]
});

module.exports = mongoose.model('lists', schema);
