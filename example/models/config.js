var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, required: true, label: 'כותרת'},
    email: { type: String, required: true, label: 'דוא"ל'}
});

var config = module.exports = mongoose.model('config', schema);
config.single = true;