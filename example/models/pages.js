var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types;

var schema = new mongoose.Schema({
    title: { type: String, required: true },
    picture: { type: Types.Picture },
    author: { type: Types.ObjectId, ref: 'users', required: true }
});

schema.methods.toString = function() {
    return this.title;
};

var pages = module.exports = mongoose.model('pages', schema);
pages.singular = 'page';
//pages.formage = {section:'cms'};
