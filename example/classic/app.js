'use strict';
var express = require('express'),
    mongoose = require('mongoose'),
    formage = require('../..');

//noinspection JSUnresolvedVariable
var MONGO_URL = process.env.MONGO_URL,
    MONGOLAB_URI = process.env.MONGOLAB_URI,
    title = process.env.ADMIN_TITLE;

var app = exports.app = express();
app.set('port', process.env.PORT || 8080);
app.set('mongo', MONGO_URL || MONGOLAB_URI || 'mongodb://localhost/formage-example');

app.use(express.favicon());
app.use(express.methodOverride());
app.use(express.cookieParser('magical secret admin'));
app.use(express.cookieSession({cookie: { maxAge: 1000 * 60 * 60 *  24 }}));

// A nice feature so that we server the admin statics before the logger
formage.serve_static(app, express);

app.configure('development', function() {
    app.locals('pretty', true);
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

app.use(app.router);

mongoose.connect(app.get('mongo'));

//mongoose.set('debug', true);
var admin = formage.init(app, express, require('./models'), {
    title: title || 'Formage Example',
    default_section: 'Main',
    admin_users_gui: true
});

admin.app.locals.global_head = "<script>\n" + "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n})(window,document,'script','//www.google-analytics.com/analytics.js','ga');\nga('create', 'UA-15378843-16', 'www.formage.io');\nga('send', 'pageview');" + "\n</script>";

app.get('/', function(req, res) {
    res.redirect('/admin');
});

var server = app.listen(app.get('port'));
console.log('Express server listening on port ', server.address().port);

