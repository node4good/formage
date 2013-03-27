var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    email: { type: String, required: true, label: 'דוא"ל'}
});
schema.methods.toString = function() {
    return this.email;
};

var users = module.exports = mongoose.model('users', schema);
users.singular = 'user';