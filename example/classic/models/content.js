var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Types = Schema.Types;

var schema = new Schema({
    navigation: { type: Types.ObjectId, ref: 'navigation' },
    title: { type: String },
    picture: { type: Types.Filepicker, widget: 'AviaryWidget' },
    text: { type: Types.Html },
    order: { type: Number, editable: false },
    show: { type: Boolean, 'default': true }
});

schema.methods.toString = function(){
    return this.title;
};

schema.formage = {
    list: ['navigation', 'title', 'picture', 'show'],
    list_populate: ['navigation'],
    order_by: ['order'],
    sortable: 'order'
};

var model = module.exports = mongoose.model('content', schema);
