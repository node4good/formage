"use strict";

var mongoose = require('mongoose'),
    models = require('../models'),
    Schema = mongoose.Schema,
    async = require('async'),
    _ = require('lodash-contrib'),
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
    lineup: [{
        lineupItem: { type: Types.ObjectId, ref: 'infoItems', socket:true },
        timestamp: String
    }]
});

schema.methods.toString = function () {
    return this.title;
};

schema.statics.lastShow = function (callback) {
    var shows = this;
    shows.findOne()
        .populate('broadcaster')
        .populate('channel')
        .populate('lineup.lineupItem')
        .sort({ date: -1})
        .where({ date: { $lte: Date.now() }})
        .where({ $or : [{'status': 'archived', archive_url: { "$ne": ''}}, {'status': 'on-air'}]})
        .lean()
        .exec(function (err, show) {
            if (err) throw err;
            parseShowData(show, function(err, results){
                shows.findPrevAndNext(results, function(err, prev_next){
                    results.prev_next = prev_next;
                    callback(err, results);
                });
            });
        });
};

schema.statics.firstShow = function (channel_id, callback) {
    var shows = this;
    shows.findOne()
        .sort({ date: 1})
        .where('channel', channel_id)
        .where({'status': 'archived', archive_url: { "$ne": ''}})
        .lean()
        .exec(function (err, show) {
            callback(err, show);
        });
};

schema.statics.showById = function (id, callback) {
    var shows = this;
    shows
        .findById(id)
        .populate('lineup.lineupItem')
        .populate('broadcaster')
        .populate('channel')
        .lean()
        .exec(function (err, res_show) {
            if (err) throw err;
            parseShowData(res_show, function(err, results){
                shows.findPrevAndNext(results, function(err, prev_next){
                    results.prev_next = prev_next;
                    callback(err, results);
                });
            });
        });
};

schema.statics.findPrevAndNext = function(show, callback) {
    var shows = this,
        curr_show = show,
        ret = {};
    var base_query = shows
        .findOne()
        .where('channel', show.channel._id)
        .where({ $or : [{'status': 'archived', archive_url: { "$ne": ''}}, {'status': 'on-air'}]})
        .populate('broadcaster')
        .populate('channel')
        .populate('lineup.lineupItem')
        .lean();

    var q1 = base_query.toConstructor();
    q1().where({ date: { $gt: curr_show.date }}).sort({ date: 1}).exec()
        .then(
            function(next_show) {
                ret.next_show = next_show ? next_show._id : null;
                return q1().where({ date: { $lt: curr_show.date }}).sort({ date: -1}).exec();
            }
        ).then(
            function(prev_show){
                ret.prev_show = prev_show ? prev_show._id : null;
                callback(null, ret);
            }
        ).end(
            function (err) {
                console.error(err.stack);
                callback(err);
            }
        );
};

schema.statics.recentShows = function (cbk) {
    var shows = this;
    var date = Date.now();
    shows
        .find()
        .populate('broadcaster')
        .populate('channel')
        .where({ $or : [{'status': {$in: ['ready', 'archived']}, archive_url: { "$ne": ''}}, {'status': 'on-air'}]})
        .sort({'date': -1})
        .where({ date: { $lt: date }})
        .lean()
        .exec(function (err, res) {
            shows.setShowPicture(res, function(results){
                cbk(err, results);
            });
        });
};

schema.statics.showsByChannel = function (channel_id, limit) {
    return this
        .find()
        .where('channel', channel_id)
        .populate('channel')
        .populate('broadcaster')
        .where({ $or : [{'status': {$in: ['ready', 'archived']}, archive_url: { "$ne": ''}}, {'status': 'on-air'}]})
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
        .where({ $or : [{'status': {$in: ['ready', 'archived']}, archive_url: { "$ne": ''}}, {'status': 'on-air'}]})
        .limit(limit)
        .sort({'date': -1})
        .lean()
        .exec();
};

schema.statics.setShowPicture = function(shows, cbk){
    var config;
    models.config.getConfig(function(conf){
        config = conf;
        _.each(shows, function(show){
            var default_image = show.channel && show.channel.default_info_item.image && show.channel.default_info_item.image !== "" ? show.channel.default_info_item.image : config.default_picture;
            if(show.default_info_item){
                if(!show.default_info_item.picture || show.default_info_item.picture === "" ) {
                    show.default_info_item.image = default_image;
                }
            } else {
                show.default_info_item = {
                    picture : default_image
                };
            }
            if(show.status == "on-air" && show.archive_url === ''){
                show.archive_url = config.default_live_url;
            }
            if(!show.picture || show.picture === "") {
                show.picture = show.channel.picture;
            }
        });
        cbk(shows);
    });
};

schema.pre('save', function(next){
    if(this._originalStatus == 'ready' && this.status == 'on-air') {
        global.registry.socketio.sockets.emit('on air', this.toObject());
    }
    next();
});

schema.post( 'init', function() {
    this._originalStatus = this.toObject().status;
});

var parseShowData = function(show, callback){
    models.shows.setShowPicture([show], function(results) {
        var res_show = results[0];
        if (!res_show || !res_show.lineup) {
            callback(null, res_show);
            return;
        }
        async.each(show.lineup, function (item, cbk) {
            if (!item.lineupItem) {
                item.comments = [];
                cbk(null);
                return;
            }
            if (!item.lineupItem.image) {
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

schema.formage = {
    list: ['date', 'channel', 'title', 'description', 'broadcaster', 'picture'],
    list_populate: ['navigation', 'channel', 'broadcaster'],
    filters: ['status', 'channel', 'broadcaster'],
    search: ['title', 'description', 'broadcaster'],
    sortable: '-date'
};

module.exports = schema;
