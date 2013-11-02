'use strict';
var _ = require('lodash'),
    path = require('path'),
    ckeditorPath = require('node-ckeditor'),
    log = require('nodestrum').logFor('formage');

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.AdminForm = require('./forms/AdminForm');


exports.serve_static = _.once(function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';
    app.use(options.root, express.static(path.join(__dirname, '..', 'assets')));
    app.use(options.root + '/ckeditor', express.static(ckeditorPath));
});


exports.init = function (rootApp, express, models, options) {
    options = _.assign({}, {
        title: rootApp.get('site') + ' Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin',
        admin_users_gui: false
    }, options);

    var getModel = function (name) {return module.registry.models[name].model;};

    var adapter;
    switch(options.db_layer_type) {
        case 'jugglingdb':
            var jugglingdb = module.parent.require("jugglingdb");
            adapter = require('./adapters/jugglingdb')(jugglingdb);
            break;

        default:
            var mongoose = module.parent.require('mongoose');
            require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
            adapter = require('./adapters/mongoose')(mongoose);
            exports.fields.RefField = require('./forms/RefField')(exports.fields.EnumField, getModel, mongoose.Schema.ObjectId);
            exports.fields.ArrayField = require('./forms/ArrayField')(exports.fields.BaseField);
    }
    var ModelRegistry = require('./registry'),
        registerRoutes = require('./routes');

    // Some DI magic. Sorry :(
    exports.AdminForm.DI = {getFields: adapter.getFields};

    var registry = module.registry = new ModelRegistry(adapter, models, options);

    adapter.ensureExists(options.username, options.password, function (err, adminUser) {
        if (err) throw err;
        log('ensured user: %s', adminUser.username);
    });

    exports.serve_static(rootApp, express, options);
    registerRoutes(express, rootApp, registry);

    return registry;
};
