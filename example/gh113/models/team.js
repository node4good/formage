'use strict';
//noinspection JSUnresolvedVariable
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamSchema = new Schema({

        location: {type: String},
        name: {type: String},
        abbreviation: {type: String},

        color: {type: String, 'default': "#000000"},

        statsTeamId: {type: Number},

        createdAt: {type: Date},
        updatedAt: {type: Date}
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

teamSchema.options.toJSON.transform = function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
};

teamSchema.pre('save', function(next) {
    this.updatedAt = new Date;
    if ( !this.createdAt ) {
        this.createdAt = new Date;
    }
    next();
});

teamSchema.methods.toString = function(){
    return this.location + " " + this.nickname;
};

module.exports = mongoose.model('team', teamSchema);
