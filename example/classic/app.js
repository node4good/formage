'use strict';
var Path = require('path');
global.MONGOOSE_DRIVER_PATH = Path.dirname(require.resolve('grist/driver'));
var MONGOOSE_TEST_URI = 'grist://' + __dirname + "/data";

var express = require('express'),
    mongoose = require('mongoose'),
    socketio = require('socket.io'),
    formage = require('../..');

//noinspection JSUnresolvedVariable
var title = process.env.ADMIN_TITLE;

var app = exports.app = express();
var PORT = process.env.PORT || 8080;
var MONGO_URL = process.env.MONGOLAB_URI || MONGOOSE_TEST_URI;
mongoose.connect(MONGO_URL);


app.locals['pretty'] = true;

app.get('/', function(req, res) {
    res.redirect('/admin');
});

app.listen(PORT, function () {
    var io = socketio.listen(this);
    formage.init(app, require('./models'), {
        title: title || 'Formage Example',
        default_section: 'Main',
        admin_users_gui: true,
        socketio: io
    });

    this.setTimeout(1000);
    console.log('Express server listening on port ', this.address().port);
});

