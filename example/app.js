'use strict';
Error.stackTraceLimit = Infinity;
require('../utils/CompileTempletes.js');


var express = require('express'),
    http = require('http'),
    path = require('path'),
    formage = require('../lib/index');

//noinspection JSUnresolvedVariable
var MONGO_URL = process.env.MONGO_URL,
    MONGOLAB_URI = process.env.MONGOLAB_URI,
    title = process.env.ADMIN_TITLE;

var app = express();
app.set('port', process.env.PORT || 8080);
app.set('mongo', MONGO_URL || MONGOLAB_URI || 'mongodb://localhost/formage-example');
app.set("view options", { layout: false, pretty: true });

app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('magical secret admin'));
app.use(express.cookieSession({cookie: { maxAge: 1000 * 60 * 60 *  24 }}));
app.use(express.static(path.join(__dirname, 'public')));
formage.serve_static(app, express);

app.configure('development', function() {
    app.locals('pretty', true);
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

//noinspection JSUnresolvedVariable
app.use(app.router);

var mongoose = require('mongoose');
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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

exports.app = app;
