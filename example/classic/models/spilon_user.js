var mongoose = require("mongoose");
//noinspection JSUnresolvedVariable
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Mixed = Schema.Types.Mixed;
var File = Schema.Types.File;


var Mission_Progress = new Schema({
    mission_id:{type:ObjectId, ref:'tests'},
    step_number:{type:Number, min:0},
    date:Date
});


var Crew_Member = new Schema({
    image: File,
    title: {type: String},
    Charachter: {charachter_id: {type: ObjectId, ref: 'tests'}},
    skill_level: {type: Number, min: 1, max: 20, 'default': 1},
    status: {type: String, 'enum': ['NOT_IN_TRAINING', 'IN_TRAINING'], 'default': 'NOT_IN_TRAINING'},
    is_personlized: {type: Boolean, 'default': false},
    personlized: {
        is_friend: {type: Boolean, 'default': false},
        friend: {
            first_name: String,
            last_name: String,
            email: String,
            fb_access_token: String,
            fb_uniq: String,
            fb_profile_pic_url: String
        },
        mercenary: {
            image: File,
            name: String
        }
    },
    training: {
        date_started: {type: Date, 'default': null},
        date_to_finish: {type: Date, 'default': null},
        training_time: {
            hours: {type: Number, min: 0, 'default': 0},
            minutes: {type: Number, min: 0, 'default': 0}
        },
        training_cost: {
            price_tokens: {type: Number, min: 0, 'default': 0},
            price_softcash: {type: Number, min: 0, 'default': 0},
            complete_now_cost: {
                price_tokens: {type: Number, min: 0, 'default': 0},
                price_softcash: {type: Number, min: 0, 'default': 0}
            },
            xp_for_sending: {type: Number, min: 0, 'default': 0},
            xp_for_back: {type: Number, min: 0, 'default': 0}
        }
    },
    impact: {
        cash: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        },
        tokens: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        },
        members: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        },
        morale: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        },
        reputation: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        },
        intimidation: {
            amount: {type: Number, min: 0, 'default': 0},
            percentage: {type: Number, min: 0, 'default': 0}
        }
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////// exported schemas ///////////////////////////////////////
var card_in_carusel = exports.card_in_carusel = new Schema({
    obj_id: ObjectId,
    obj_type: {type: String, enum: ['MISSION', 'EVENT']},
    event: {type: Mixed, 'default': null, editable: false},
    mission: {type: Mixed, 'default': null, editable: false},
    index_in_tier: {type: Number, 'default': 0, editable: false},
    status: String,
    progress: {type: Number, 'default': 0},
    start: Boolean,
    date_pushed: Date,
    time_left: Date,
    popup_title: String,
    title: String,
    description: String,
    event_type: String
});


var tier_order_schema = exports.tier_order_schema = new Schema({
    tier_number: Number,
    missions: [card_in_carusel]
});


var active_card = exports.active_card = new Schema({
    tier: Number,
    obj_type: { type: String, enum: ['MISSION', 'EVENT']},
    obj_title: String,
    obj_id: ObjectId,
    date: Date
});


var user = exports.user = new Schema({
    is_rejected_during_alpha: Boolean,
    is_rejected_during_beta: Boolean,
    is_published: {type: Boolean, 'default': false},
    first_name: String,
    last_name: String,
    email: String,
    energy_refill_in: Date,
    birthday: Date,
    gender: String,
    location: String,
    news_counter: {type: Number, min: 0, 'default': 0},
    active_tier_number: {type: Number, min: 1, 'default': 1},
    unlock_last_tier_time_stamp: Date,
    last_activity_time_stamp: Date,
    show_tutorial: {type: Boolean, 'default': true},
    locale: {type: String, 'default': 'en_US'},
    fb_access_token: String,
    current_tier_id: {type: ObjectId, ref: 'tests'},
    current_tier_number: {type: Number, min: 1, 'default': 1},
    random_fictional_event_active: {type: Boolean, 'default': false}, //If false - it's the time after tiering up before random-fictional-events start occurring
    last_random_event_date: Date,
    fb_uniq: {type: String},
    fb_profile_pic_url: String,
    last_mission_played: {mission_id: {type: ObjectId, ref: 'tests'}},
    fanclub: {
        image: File,
        background_image: File,
        interact_background: String,
        team_id: {type: ObjectId, ref: 'tests'},
        team_name: String,
        country_id: {type: ObjectId, ref: 'tests'},
        fanclub_name: String,
        is_set: {type: Boolean, 'default': false}
    },
    Indicators: {
        energy: {
            container_size: {type: Number, min: 0},
            left: {type: Number, min: 0, 'default': 0}
        },
        cash: {type: Number, min: 0, 'default': 0},
        tokens: {type: Number, min: 0, 'default': 0},
        members: {type: Number, min: 0, 'default': 0},
        morale: {type: Number, min: 0, max: 100, 'default': 0},
        reputation: {type: Number, min: 0, max: 100, 'default': 0},
        intimidation: {type: Number, min: 0, max: 100, 'default': 0},
        level: {type: Number, min: 1, 'default': 1},
        xp: {type: Number, min: 0, 'default': 0},
        xp_to_complete_level: {type: Number, min: 0, 'default': 0},
        xp_gui: {
            value: {type: Number, min: 0, 'default': 0},
            container_size: {type: Number, min: 0, 'default': 0}
        }
    },
    last_mission_viewed: {
        mission_id: {type: ObjectId, ref: 'tests'},
        tier_number: {type: Number, min: 1, 'default': 1}
    },
    visible_missions: [
        {
            mission_id: {type: ObjectId, ref: 'tests'}
        }
    ],
    history: {
        events_history: [
            {
                data: Date,
                event_id: {type: ObjectId, ref: 'tests'},
                tier_number: {type: Number, min: 1, 'default': 1},
                index_in_tier: {type: Number, min: 1, 'default': 1}
            }
        ],
        missions_history: [
            {
                data: Date,
                mission_id: {type: ObjectId, ref: 'tests'}
            }
        ]
    },
    pending_events: [
        {
            date_pushed: Date,
            event: {type: Mixed, editable: false},
            is_new: {type: Boolean, 'default': false, editable: false},
            tier_number: {type: Number, min: 1, 'default': 1},
            index_in_tier: {type: Number, min: 1, 'default': 1}
        }
    ],
    action_statictics: {
        good: {type: Number, min: 0, 'default': 0},
        bad: {type: Number, min: 0, 'default': 0},
        natural: {type: Number, min: 0, 'default': 0}
    },
    items: [
        new Schema({
            date: Date,
            date_activated: Date,
            item_id: {type: ObjectId, ref: 'tests'},
            amount: {type: Number, min: 0, 'default': 0},
            mission_id: {type: ObjectId, ref: 'tests'},
            is_activable: {type: Boolean, 'default': false},
            is_in_use: {type: Boolean, 'default': true}
        })
    ],
    active_cards: [active_card],
    Crew: [Crew_Member],
    mission_progress: [Mission_Progress],
    mission_order: [tier_order_schema]
});


user.methods.toString = function () {
    return this.first_name + ' ' + this.last_name;
};


user.formage = {
    // Additional actions on this model
    actions: [
        {
            value: 'release',
            label: 'Release',
            func: function (user, ids, callback) {
                console.log('You just released songs ' + ids);
                callback();
            }
        }
    ],

    // list of fields to be displayed by formage for this model
    list: ['first_name', 'last_name', 'email', 'fb_uniq'],
    search: '/__value__/i.test(this.email)||/__value__/i.test(this.fb_uniq)||/__value__/i.test(this.first_name + " " + this.last_name)',

    // list of fields that must be populated (see http://mongoosejs.com/docs/api.html#document_Document-populate)
    list_populate: ['current_tier_id']
};


module.exports = mongoose.model('SpilonUser', user);
