var mongoose = require('mongoose'),
    Types = mongoose.Schema.Types,
    ObjectId = Types.ObjectId;
    fWidgets = require('../../forms/widgets');

var schema = new mongoose.Schema({
    list: [{
        name: { type: String, required: true },
        list: [{
            name: String
        }]
    }],
    list_o_list: {
        inner_list: [String]
    },
    ref: { type: Types.ObjectId, ref: 'pages', required: true },
//    second_ref: { type: ObjectId, ref: 'users', limit: 500, query: '/__value__/i.test(this.email)', required: true },
    string: { type: String, required: true },
    date: { type: Date, required: true },
    datetime: { type: Date, required: true, widget:fWidgets.DateTimeWidget },
    time: { type: Types.Time },
    enum: { type: String, enum: ['1', '2', '3'], required: true },
    rich_text: { type: Types.Html, required: true },
    text: { type: Types.Text, required: true },
    image: { type: Types.Picture, required: true },
    map: { type: Types.GeoPoint, required: true, widget_options: {lang: 'nl'}},
    num: { type: Types.Integer, required: true },
    order: { type: Number, editable: false },
    bool: { type: Boolean, 'default': true },
    object: {
        object: {
            object: {
                string: { type: String, required: true }
            }
        }
    },
    mixed: Types.Mixed,
    spilon_steps: [
        {
            rewards: {
                xp: {type: Types.Integer, 'default': 0},
                cash: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}},
                tokens: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}},
                morale: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}},
                reputation: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}},
                intimidation: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}},
                members: {min: {type: Types.Integer, min: 0, 'default': 0}, max: {type: Types.Integer, min: 0, 'default': 0}}
            },
            loot: {
                items: [
                    {item_id: {type: Types.ObjectId, ref: 'pages', required: true},
                        amount: {type: Types.Integer, min: 0, 'default': 0},
                        percent: {type: Types.Integer, min: 0, max: 100, 'default': 0},
                        is_mandatory: {type: Boolean, 'default': false}}
                ]
            },
            action_word: String
        }
    ]
});

var model = module.exports = mongoose.model('tests', schema);
model.formage = {
    filters: ['ref'],
    list: ['string', 'date', 'image']
};
