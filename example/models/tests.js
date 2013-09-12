var mongoose = require('mongoose'),
    Schema = mongoose['Schema'],
    ObjectId = Schema.Types.ObjectId;
    fWidgets = require('../../forms/widgets');

var s = new Schema({
    list: [
        {
            name: { type: String, required: true },
            list: [
                {
                    name: String
                }
            ]
        }
    ],
    list_o_list: {
        inner_list: [String]
    },
    ref: { type: ObjectId, ref: 'pages', required: true },
//    second_ref: { type: ObjectId, ref: 'users', limit: 500, query: '/__value__/i.test(this.email)', required: true },
    string: { type: String, required: true },
    date: { type: Date, required: true },
    date2: { type: Date, required: true, widget:fWidgets.DateTimeWidget },
    time: { type: Schema.Types.Time },
    enum: { type: String, enum: ['1', '2', '3'], required: true },
    rich_text: { type: Schema.Types.Html, required: true },
    text: { type: Schema.Types.Text, required: true },
    image: { type: Schema.Types.Picture, required: true },
    map: { type: Schema.Types.GeoPoint, required: true, widget_options: {lang: 'nl'}},
    num: { type: Schema.Types.Integer, required: true },
    order: { type: Number, editable: false },
    bool: { type: Boolean, 'default': true },
    object: {
        object: {
            object: {
                string: { type: String, required: true }
            }
        }
    },
    mixed: Schema.Types.Mixed,
    spilon_steps: [
        {
            rewards: {
                xp: {type: Schema.Types.Integer, 'default': 0},
                cash: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}},
                tokens: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}},
                morale: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}},
                reputation: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}},
                intimidation: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}},
                members: {min: {type: Schema.Types.Integer, min: 0, 'default': 0}, max: {type: Schema.Types.Integer, min: 0, 'default': 0}}
            },
            loot: {
                items: [
                    {item_id: {type: Schema.ObjectId, ref: 'pages', required: true},
                        amount: {type: Schema.Types.Integer, min: 0, 'default': 0},
                        percent: {type: Schema.Types.Integer, min: 0, max: 100, 'default': 0},
                        is_mandatory: {type: Boolean, 'default': false}}
                ]
            },
            action_word: {type: String}
        }
    ]
});

module.exports = mongoose.model('tests', s);
module.exports.formage = {
    filters: ['ref'],
    list: ['string', 'date', 'image']
};
