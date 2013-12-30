//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;
    fWidgets = require('../../../').widgets;

var schema = module.exports = new Schema({
    string: { type: String },
    string_req: { type: String, required: true, label: 'Name' },
    ref: { type: SchemaTypes.ObjectId, ref: 'pages' },
    ref_with_query: { type: SchemaTypes.ObjectId, ref: 'pages', query:'__value__', url:'/' },
    date: { type: Date },
    datetime: { type: Date, widget:fWidgets.DateTimeWidget },
    time: { type: SchemaTypes.Time },
    enum: { type: String, enum: ['1', '2', '3'] },
    rich_text: { type: SchemaTypes.Html },
    text: { type: SchemaTypes.Text },
    image: { type: SchemaTypes.Picture },
    file: { type: SchemaTypes.File, upload_to: 'assets/cdn'},
    filepicker: { type: SchemaTypes.Filepicker },
    filepicker_picture: { type: SchemaTypes.Filepicker, widget: 'FilepickerPictureWidget' },
    filepicker_aviary: { type: SchemaTypes.Filepicker, widget: 'AviaryWidget' },
    map: { type: SchemaTypes.GeoPoint, widget_options: {lang: 'nl'} },
    num: { type: SchemaTypes.Integer },
    num_validated: { type: SchemaTypes.Integer, validate: [function () {return true;}, "boo"] },
    num_with_params: { type: SchemaTypes.Integer, min: 0, max: 10, step: 2 },
    order: { type: Number, editable: false },
    bool: { type: Boolean, 'default': true },
    bool2: { type: Boolean, 'default': false },
    list: [{
        name: { type: String, required: true },
        list: [{
            name: String
        }]
    }],
    object_with_list: {
        inner_list: { type: [String], stackDir: 'top' }
    },
    list_o_numbers: [Number],
    object: {
        object: {
            object: {
                nested_string: { type: String },
                nested_string_req: { type: String, required: true }
            }
        }
    },
    embeded: {
        name1: String,
        list1: [{
            name2: String,
            embeded2: {
                name3: String,
                list3:[{
                    name4: String,
                    embeded4: {
                        nested_string5: { type: String },
                        nested_string_req5: { type: String, required: true },
                        list5:[String]
                    }
                }]
            }
        }]
    },
    mixed: SchemaTypes.Mixed
});
schema.methods.toString = function () {return this.string_req};

schema.formage = {
    filters: ['ref', 'string_req'],
    list: ['embeded.name1', 'ref', 'filepicker', 'filepicker_picture', 'filepicker_aviary', 'swizzle'],
    subCollections: [{label: 'Sub Tests', model: 'pages', field:'ref'}],
    list_populate: ['ref']
};

schema.virtual('swizzle').get(function() {
    return (this.get('string_req') || '').split('').reverse().join('');
});
