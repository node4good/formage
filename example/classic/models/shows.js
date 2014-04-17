"use strict";

var mongoose = require('mongoose'),
    models = require('../models'),
    Schema = mongoose.Schema,
    async = require('async'),
    Types = Schema.Types;

var schema = new Schema({
    title: String,
    description: { type: Types.Text },
    status: { type: String, enum: ['draft', 'ready', 'on-air', 'archived'], default: 'draft'},
    archive_url: String,
    start_time: {type: Types.Time},
    end_time: {type: Types.Time},
    date: { type: Date },
    picture: { type: Types.Filepicker, widget: 'FilepickerPictureWidget' },
    broadcaster: [
        { type: Types.ObjectId, ref: 'users'}
    ],
    default_info_item: {
        title: String,
        text: Types.Text,
        image: { type: Types.Filepicker, widget: 'FilepickerPictureWidget' },
        url: String
    },
    lineup: [{
        lineupItem: { type: Types.ObjectId, ref: 'infoItems'},
        timestamp: String
    }],
    order: { type: Number, editable: false, default: 0 }
});

schema.methods.toString = function () {
    return this.title;
};

schema.statics.lastShow = function (callback) {
    this.findOne()
        .populate('broadcaster')
        .populate('channel')
        .populate('lineup.lineupItem')
        .sort({ date: -1})
        .where({ date: { $lt: Date.now() }})
        .lean()
        .exec(function (err, show) {
            if (err) throw err;
            if (!show || !show.lineup) {
                callback(null, show);
                return;
            }
            async.each(show.lineup, function (item, cbk) {
                if (!item.lineupItem) {
                    item.comments = [];
                    cbk(null);
                    return;
                }
                if(!item.lineupItem.image){
                    item.lineupItem.image = show.default_info_item.image;
                }
                models.comments.getCommentsByTypeAndEntity(item.lineupItem._id, 'info_item').then(function (comments) {
                    item.comments = comments;
                    cbk();
                }).end();
            }, function (err) {
                callback(err, show);
            });
        });
};

schema.statics.recentShows = function (cbk) {
    var shows = this;
    var date = Date.now();
    shows
        .find()
        .populate('broadcaster')
        .populate('channel')
        .sort({'date': -1})
        .where({ date: { $lt: date }})
        .lean()
        .exec(function (err, results) {
            cbk(err, results);
        });
};

schema.statics.showById = function (id, callback) {
    var shows = this;
    shows.findById(id).populate('lineup').exec(function (err, show) {
        if (!err) {
            async.each(show.info_items, function (item, cbk) {
                models.comments.getCommentsByTypeAndEntity(item._id, 'info_item').then(function (comments) {
                    item.comments = comments;
                    cbk(err);
                });
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, show);
                }
            });
        } else {
            callback(err);
        }
    });
};

schema.statics.showsByChannel = function (channel_id, limit) {
    return this
        .find()
        .where('channel', channel_id)
        .populate('channel')
        .populate('broadcaster')
        .limit(limit)
        .sort({'date': -1})
        .lean()
        .exec();
};

schema.statics.showsByBroadcaster = function (broadcaster_id, limit) {
    return this
        .find()
        .where('broadcaster', broadcaster_id)
        .populate('channel')
        .populate('broadcaster')
        .limit(limit)
        .sort({'date': -1})
        .lean()
        .exec();
};

schema.formage = {
    list: ['title', 'broadcaster', 'channel', 'date', 'picture'],
    list_populate: ['navigation', 'channel', 'broadcaster'],
    order_by: ['order'],
    sortable: 'order',
    section: 'Radio'
};

module.exports = schema;
