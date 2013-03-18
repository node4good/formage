'use strict';
if (!module.parent)
    console.error("Please do not call formage-admin directly.") || process.process.exit(1);

var MongooseAdmin = require('./mongoose-admin.js'),
    path = require('path'),
    formage = require('formage'),
    paths = require('./register_paths');

exports.forms = formage;
exports.init = require('./init');
exports.crypt = require('./crypt');
exports.loadApi = require('./form').loadApi;
exports.AdminForm = require('./form').AdminForm;


// Create the admin singleton object
exports.createAdmin = function(app, options) {
    options = options || {};
    var root = '/' + (options.root || 'admin');

    console.log('\x1b[36mMongooseAdmin is listening at path: \x1b[0m %s', root);
    MongooseAdmin.singleton = new MongooseAdmin(app, root);
    paths.registerPaths(MongooseAdmin, app, root);
    return MongooseAdmin.singleton;
};


// Serve static files
exports.serve_static = function (app, express, options) {
    options = options || {};
    options.root = options.root || 'admin';

    if (module._is_serving_static) return;
    module._is_serving_static = true;

    formage.serve_static(app, express);
    app.use('/' + options.root, express.static(path.join(__dirname, '/public')));
};
