//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;
    fWidgets = require('../../../').widgets;

module.exports = new Schema({
    contact: {
        text: { en: SchemaTypes.Html , he: SchemaTypes.Html }
    },
    refs: [{ type: SchemaTypes.ObjectId, ref: 'pages' }]
});
module.exports.methods.toString = function () {return this.string_req};

module.exports.formage = {
    filters: ['ref'],
    list: ['string_req', 'ref', 'image'],
    subCollections: [{label: 'Sub Tests', model: 'pages', field:'ref'}],
    list_populate: ['ref']
};
