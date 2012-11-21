var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

var s = new Schema({
    list: [{
        name: String,
        list: [{
            name: String
        }]
    }],
    ref: { type: ObjectId, ref: 'pages', required: true },
    string: { type: String, required: true },
    date: { type: Date, required: true },
    enum: { type: String, enum: ['1','2','3'], required: true },
    rich_text: { type: Schema.Types.Html, required: true },
    text: { type: Schema.Types.Text, required: true },
    image: { type: Schema.Types.File, required: true },
    map: { type: Schema.Types.GeoPoint, required: true },
    num: { type: Schema.Types.Integer, required: true },
    order: { type: Number, editable: false, required: true },
    bool: { type: Boolean, 'default': true, required: true },
    object: {
        object: {
            object: {
                string: { type: String, required: true }
            }
        }
    }
});

module.exports = mongoose.model('tests', s);