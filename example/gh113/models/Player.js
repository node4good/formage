'use strict';
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var playerSchema = new Schema({

//    sport: {type: Schema.Types.ObjectId, ref: 'Sport'},
        team: {type: Schema.Types.ObjectId, ref: 'team'},

        statsPlayerId: {type: Number, editable: false},

        firstName: {type: String},
        lastName: {type: String},

        active: {type: Boolean},
        injured: {type: Boolean},
        suspended: {type: Boolean},

        positionName: {type: String},
        positionAbbreviation: {type: String},

        rookieYear: {type: Number},
        experience: {type: Number},

        uniformNumber: {type: String},

        profileImageURL: {type: String, editable: false},

        createdAt: {type: Date, editable: false},
        updatedAt: {type: Date, editable: false}
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

playerSchema.options.toJSON.transform = function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
};

playerSchema.pre('save', function(next) {
    this.updatedAt = new Date;
    if ( !this.createdAt ) {
        this.createdAt = new Date;
    }
    next();
});

playerSchema.virtual('abbreviatedName').get(function () {
    return this.firstName.charAt(0) + ". " + this.lastName;
});

playerSchema.methods.toString = function(){
    return this.firstName + " " + this.lastName;
};

module.exports = mongoose.model('Player', playerSchema);

playerSchema.formage = {
    list: ['firstName', 'lastName', 'uniformNumber', 'positionName'],
    list_populate: ['team']
};
