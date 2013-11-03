//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;
    fWidgets = require('../..').widgets;

module.exports = new Schema({
    string: { type: String },
    string_req: { type: String, required: true },
    ref: { type: SchemaTypes.ObjectId, ref: 'pages' },
    date: { type: Date },
    datetime: { type: Date, widget:fWidgets.DateTimeWidget },
    time: { type: SchemaTypes.Time },
    enum: { type: String, enum: ['1', '2', '3'] },
    rich_text: { type: SchemaTypes.Html },
    text: { type: SchemaTypes.Text },
    image: { type: SchemaTypes.Picture },
    file: { type: SchemaTypes.File },
    map: { type: SchemaTypes.GeoPoint, widget_options: {lang: 'nl'} },
    num: { type: SchemaTypes.Integer },
    num_validated: { type: SchemaTypes.Integer, validate: [function (val) {return true;}, "boo"] },
    num_with_params: { type: SchemaTypes.Integer, min: 0, max: 10, step: 2 },
    order: { type: Number, editable: false },
    bool: { type: Boolean, 'default': true },
    list: [{
        name: { type: String, required: true },
        list: [{
            name: String
        }]
    }],
    list_o_list: {
        inner_list: [String]
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
    mixed: SchemaTypes.Mixed,
    spilon_steps: [
        {
            rewards: {
                xp: {type: SchemaTypes.Integer, 'default': 0},
                cash: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}},
                tokens: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}},
                morale: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}},
                reputation: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}},
                intimidation: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}},
                members: {min: {type: SchemaTypes.Integer, min: 0, 'default': 0}, max: {type: SchemaTypes.Integer, min: 0, 'default': 0}}
            },
            loot: {
                items: [
                    {item_id: {type: SchemaTypes.ObjectId, ref: 'pages', required: true},
                        amount: {type: SchemaTypes.Integer, min: 0, 'default': 0},
                        percent: {type: SchemaTypes.Integer, min: 0, max: 100, 'default': 0},
                        is_mandatory: {type: Boolean, 'default': false}}
                ]
            },
            action_word: String
        }
    ]
});
module.exports.methods.toString = function () {return this.string_req};

module.exports.formage = {
    filters: ['ref'],
    list: ['string_req', 'date', 'image'],
    subCollections: [{label: 'Sub Tests', model: 'pages', field:'ref'}],
    list_populate: ['ref']
};
