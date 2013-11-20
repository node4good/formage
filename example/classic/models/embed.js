//noinspection JSUnresolvedVariable
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    SchemaTypes = Schema.Types;


var schema = new mongoose.Schema({
    parent: {
        child: String,
        child2: String
    },
    mother: [Number],
    number: Number,
    area: [SchemaTypes.GeoPoint],
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
var model = module.exports = mongoose.model('embed', schema);
