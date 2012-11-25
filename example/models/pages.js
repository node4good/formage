var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

var s = new Schema({
    title: { type: String, required: true },
    ref: { type: ObjectId, ref: 'pages', required: true },
    string: { type: String, required: true },
    date: { type: Date, required: true },
    enum: { type: String, enum: ['1','2','3'], required: true },
    order: { type: Number, editable: false },
    show: { type: Boolean, 'default': true }
});

s.methods.toString = function() {
    return this.title;
};

module.exports = mongoose.model('pages', s);

