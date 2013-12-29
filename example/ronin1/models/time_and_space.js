var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    Types = Schema.Types;

var schema = module.exports = new Schema({
    title: String,
    Date: Date,
    Time: Types.Time,
    location: Types.GeoPoint
});
schema.methods.toString = function() {
    return this.title;
};
