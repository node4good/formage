
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 80);
    app.set('mongo', 'mongodb://localhost/formage-admin-example');

    app.engine('html', require('consolidate').dust);
    app.set('view engine', 'html');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.favicon());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('magical secret admin'));
    app.use(express.cookieSession({cookie: { maxAge: 60 * 1000 * 20 }}));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});

require('mongoose').connect(app.get('mongo'));
require('./admin')(app);
app.get('/', function(req, res) {
    res.redirect('/admin');
});

app.get('/dust', function(req, res){
    res.render('index', { title: 'Dust JS' })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
