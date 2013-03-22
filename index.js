'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var MongooseAdmin = require('./mongoose-admin.js'),
    path = require('path'),
    formage = require('./forms'),
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

    app.use('/' + options.root, express.static(path.join(__dirname, '/public')));
};


module.exports.load_types = function (mongoose) {
    if (this._types_loeaded) return;
    this._types_loeaded = true;

    module.exports.mongoose_module = module.exports.mongoose_module || mongoose;
    module.mongoose_module = module.exports.mongoose_module;
    module.exports.formage.load_types(mongoose);
};


module.exports.register_models = function (models) {
    if (this._models_registered) return;
    this._models_registered = true;

    module.exports.models = models;
    module.exports.formage.register_models(models);
};


module.exports.set_amazon_credentials = module.exports.formage.set_amazon_credentials;


// Deprecated
module.exports.forms = module.exports.formage;
