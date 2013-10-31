'use strict';
var _ = require('lodash'),
    ckeditorPath = require('node-ckeditor'),
    log = require('nodestrum').logFor('formage');

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.AdminForm = require('./forms/AdminForm');
exports.set_amazon_credentials = exports.fields.setAmazonCredentials;
exports.getModel = function (name) {return module.registry.models[name].model;};

if (process.env['FORMAGE_DB_LAYER'] === 'jugglingdb') {
    var jugglingdb = module.parent.require("jugglingdb");
    exports.adapter = require('./adapters/jugglingdb')(jugglingdb);
} else {
    var mongoose = module.parent.require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
    exports.adapter = require('./adapters/mongoose')(mongoose);
    exports.fields.RefField = require('./forms/RefField')(exports.fields.EnumField, exports.getModel, mongoose.Schema.ObjectId);
    exports.fields.ArrayField = require('./forms/ArrayField')(exports.fields.BaseField);
}


exports.serve_static = _.once(function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';
    app.use(options.root, express.static('../assets'));
    app.use(options.root + '/ckeditor', express.static(ckeditorPath));
});


exports.init = _.once(function (rootApp, express, models, options) {
    var ModelRegistry = require('./registry'),
        registerRoutes = require('./routes');

    options = _.assign({}, {
        title: rootApp.get('site') + ' Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin',
        admin_users_gui: false
    }, options);

    var registry = module.registry = new ModelRegistry(exports.adapter, models, options);

    exports.adapter.ensureExists(options.username, options.password, function (err, adminUser) {
        if (err) throw err;
        log('ensured user: %s', adminUser.username);
    });

    exports.serve_static(rootApp, express, options);
    registerRoutes(express, rootApp, registry);

    return registry;
});
