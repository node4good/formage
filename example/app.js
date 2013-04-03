/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure('all', function(){
    app.set('port', process.env.PORT || 80);
    app.set('mongo', process.env.MONGO_URL || 'mongodb://localhost/formage-admin-example');
    app.set("view options", { layout: false, pretty: true });

    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('magical secret admin'));
    app.use(express.cookieSession({cookie: { maxAge: 1000 * 60 * 60 *  24 }}));
    app.use(app.router);
});

app.configure('development', function(){
//    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

require('mongoose').connect(app.get('mongo'));
//require('./admin')(app);
var formage = require('../index');
var admin = formage.init(app, express, require('./models'), {
    title: 'Formage-Admin Example'
});

app.get('/', function(req, res){
    res.redirect('/admin');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
