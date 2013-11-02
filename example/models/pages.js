var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;
require('formage-mongoose-types').loadTypes_DI(mongoose);

var schema = new mongoose.Schema({
    title: { type: String, required: true },
    picture: { type: Types.Picture },
    author: { type: Types.ObjectId, ref: 'pages', required: true }
});

schema.methods.toString = function() {
    return this.title;
};

var pages = module.exports = mongoose.model('pages', schema);
pages.singular = 'page';
//pages.formage = {section:'cms'};
