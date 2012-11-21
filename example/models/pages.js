var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

var s = new Schema({
    title: { type: String, required: true },
    order: { type: Number, editable: false },
    show: { type: Boolean, 'default': true }
});

s.methods.toString = function() {
    return this.title;
};

module.exports = mongoose.model('pages', s);

