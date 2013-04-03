var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    name: { type: String, required: true, label: 'שם'},
    email: { type: String, required: true, label: 'דוא"ל'},
    order: { type: Number, editable: false }
});

schema.methods.toString = function() {
    return this.name + ' <' + this.email + '>';
};

var users = module.exports = mongoose.model('users', schema);
users.singular = 'user';
users.list_fields = { title: '', email: 100 };