//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types,
    ObjectId = SchemaTypes.ObjectId;
    fWidgets = require('../..').widgets;

var schema = new Schema({
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
    ref: { type: SchemaTypes.ObjectId, ref: 'pages', required: true },
    string: { type: String, required: true },
    date: { type: Date, required: true },
    datetime: { type: Date, required: true, widget:fWidgets.DateTimeWidget },
    time: { type: SchemaTypes.Time },
    enum: { type: String, enum: ['1', '2', '3'], required: true },
    rich_text: { type: SchemaTypes.Html, required: true },
    text: { type: SchemaTypes.Text, required: true },
    image: { type: SchemaTypes.Picture, required: true },
    map: { type: SchemaTypes.GeoPoint, required: true, widget_options: {lang: 'nl'}},
    num: { type: SchemaTypes.Integer, required: true },
    order: { type: Number, editable: false },
    bool: { type: Boolean, 'default': true },
    object: {
        object: {
            object: {
                string: { type: String, required: true }
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
schema.methods.toString = function () {return this.string};


var model = module.exports = mongoose.model('tests', schema);
model.formage = {
    filters: ['ref'],
    list: ['string', 'date', 'image'],
    subCollections: [{label: 'Spilon Users', model: 'spilon_user', field:'current_tier_id'}]
};
