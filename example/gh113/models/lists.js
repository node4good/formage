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
    }],
    num_arr : [{type:Number,default:0}]
});

module.exports = mongoose.model('lists', schema);
