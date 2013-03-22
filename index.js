'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var MongooseAdmin = require('./MongooseAdmin.js'),
    path = require('path'),
    paths = require('./register_paths'),
    express = require.main.require('express');



exports.forms = require('./forms');
exports.init = require('./init');
exports.loadApi = require('./AdminForm').loadApi;
exports.AdminForm = require('./AdminForm').AdminForm;


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

    app.use('/' + options.root, express.static(path.join(__dirname, '/public')));
};


module.exports.load_types = function () {
    if (this._types_loeaded) return;
    this._types_loeaded = true;

    module.exports.forms.load_types();
};


module.exports.register_models = function (models, opt) {
    if (this._models_registered) return;
    this._models_registered = true;

    exports.init(app, express, models, opt);
    module.exports.models = models;
    module.exports.forms.register_models(models);
};


module.exports.set_amazon_credentials = module.exports.forms.set_amazon_credentials;
