//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    name: { type: String, required: true, label: 'שם'},
    email: { type: String, required: true, label: 'דוא"ל', unique: true },
    approved: Boolean,
    order: { type: Number, editable: false }
});

schema.methods.toString = function() {
    return this.name + ' <' + this.email + '>';
};

schema.formage = {
    singular: 'user',
    order_by: ['order'],
    actions: [
        {
            id: 'approve',
            label: 'Approve',
            func: function (user, ids, cb) {
                console.log('these should be approved ' + ids);
                cb();
            }
        }
    ]
};

var users = module.exports = mongoose.model('users', schema);
