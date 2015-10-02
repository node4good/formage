'use strict';
var _ = require('lodash-contrib'),
    path = require('path'),
    ckeditorPath = require('node-ckeditor'),
    log = require('nodestrum').logFor('formage');

try {
    var jugglingdb = module.parent.require("jugglingdb");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        console.info(e);
}

try {
    require('mpromise');
    delete require.cache[require.resolve('mongoose/lib/promise')];
    require.cache[require.resolve('mongoose/node_modules/mpromise/index.js')] = require.cache[require.resolve('mpromise')];
    require('mongoose/lib/promise');
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        console.info(e);
}
try {
    var mongoose = require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        console.info(e);
}

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.fields.FileField = require('./forms/FileField');
exports.fields.ArrayField = require('./forms/ArrayField');
exports.AdminForm = require('./forms/AdminForm');
exports.UserForm = require('./forms/UserForm');


exports.serve_static = _.once(function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';
    app.use(options.root, express.static(path.join(__dirname, '..', 'assets')));
    app.use(options.root + '/vendor/ckeditor', express.static(ckeditorPath));
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

    var adapter;
    switch(options.db_layer_type) {
        case 'jugglingdb':
            adapter = require('./adapters/jugglingdb')(jugglingdb);
            break;

        default:
            adapter = require('./adapters/mongoose')(mongoose);
            exports.fields.RefField = require('./forms/RefField');
    }
    var ModelRegistry = require('./registry'),
        registerRoutes = require('./routes');


    var registry = module.registry = new ModelRegistry(adapter, models, options);
    Object.getPrototypeOf(exports.fields.BaseField).registry = registry;
    registry.modelRegistrationInjection();
    registry.socketio = options.socketio;

    if (!options.no_users) {
        adapter.UsersModel = registry.registerModel(adapter.Users, 'formage_users_', {hidden: !options.admin_users_gui});
        if (!options.dont_ensure_superuser) {
            registry.ensureUser(options.username, options.password, function (err, adminUser) {
                if (err) throw err;
                log('ensured user: %s', adminUser.username);
            });
        }
    }

    exports.serve_static(rootApp, express, options);
    registerRoutes(express, rootApp, registry);

    return registry;
};
