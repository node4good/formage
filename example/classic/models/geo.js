//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types,
    Schema = mongoose.Schema,
    formage = require('../../../.');


var schema = new Schema({
    map: { type: Types.GeoPoint }
});


var model = module.exports = mongoose.model('geo', schema);
