var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;


var schema = new Schema({
    parent: { type: ObjectId, ref: 'navigation' },
    meta: [{
        name: { type: String },
        content: { type: SchemaTypes.Text }
    }],
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true, lowercase: true, unique: true },
    order: { type: Number, editable: false },
    menu: { type: Boolean, 'default': true },
    show: { type: Boolean, 'default': true }
});

schema.formage = {
    list_populate: ['parent'],
    list: ['title', 'parent', 'url', 'menu', 'show'],
    filters: ['parent'],
    order_by: ['order'],
    sortable: 'order'
};

schema.methods.toString = function() {
    return this.title;
};

module.exports = schema;
