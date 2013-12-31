var util = require('util'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;


var VehicleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    parent: { type: ObjectId, ref: 'navigation' },
    url: { type: String, trim: true, lowercase: true, unique: true },
    order: { type: Number, editable: false },
    menu: { type: Boolean, 'default': true },
    show: { type: Boolean, 'default': true },
    meta: [{
        name: { type: String },
        content: { type: SchemaTypes.Text }
    }],
    make : String
});

VehicleSchema.formage = {
    list_populate: ['parent'],
    list: ['title', 'parent', 'url', 'menu', 'show'],
    filters: ['parent'],
    order_by: ['order'],
    sortable: 'order'
};

VehicleSchema.methods.toString = function() {
    return this.title;
};

var CarSchema = Schema({
    CarSpecific: {year : Number, cc: Number}
});

var BusSchema = Schema({
    bus_specific: {route : Number, company: String}
});


var vehicle = mongoose.model('navigation', VehicleSchema);
var car = vehicle.discriminator('car', CarSchema);
var bus = vehicle.discriminator('bus', BusSchema);

module.exports = vehicle;
