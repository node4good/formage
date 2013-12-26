var mongoose = require('mongoose');
var SchemaTypes = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, required: true },
    picture: SchemaTypes.Picture,
    pictures: [{ type: SchemaTypes.Filepicker, widget: 'FilepickerPictureWidget' }],
    tags: [String],
    file: SchemaTypes.Filepicker,
    fieldset: {
        name: String,
        age: Number
    },
    listfield: [String],
    listfield2: [{
        name: String
    }]
});

schema.methods.toString = function() {
    return this.title;
};

var gallery = module.exports = mongoose.model('gallery', schema);
//gallery.formage = {section:'cms'};
