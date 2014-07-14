'use strict';
require('asynctrace');
//var Path = require('path');
//global.MONGOOSE_DRIVER_PATH = Path.dirname(require.resolve('grist/driver'));
//var MONGOOSE_TEST_URI = 'grist://' + __dirname + "/data";
var MONGOOSE_TEST_URI = 'mongodb://localhost/testdata';

var opinion = require('opinion'),
    mongoose = require('mongoose'),
    formage = require('../..');

//noinspection JSUnresolvedVariable
var title = process.env.ADMIN_TITLE;

var app = exports.app = opinion();
var PORT = process.env.PORT || 8080;
var MONGO_URL = process.env.MONGOLAB_URI || MONGOOSE_TEST_URI;
mongoose.connect(MONGO_URL);

//mongoose.set('debug', true);
var admin = formage.init(app, require('./models'), {
    title: title || 'Formage Example',
    default_section: 'Main',
    admin_users_gui: true
});

//admin.app.locals.global_head = "<script>\n" + "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n})(window,document,'script','//www.google-analytics.com/analytics.js','ga');\nga('create', 'UA-15378843-16', 'www.formage.io');\nga('send', 'pageview');" + "\n</script>";

app.get('/', function(req, res) {
    res.redirect('/admin');
});

var server = app.listen(PORT, function () {
    server.setTimeout(1000);
    console.log('Express server listening on port ', server.address().port);
});

