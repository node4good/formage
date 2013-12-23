'use strict';
var _ = require('lodash-contrib'),
    path = require('path'),
    ckeditorPath = require('node-ckeditor'),
    log = require('nodestrum').logFor('formage');

//noinspection EmptyCatchBlockJS,UnusedCatchParameterJS
try {
    var jugglingdb = module.parent.require("jugglingdb");
} catch (e) {}

//noinspection EmptyCatchBlockJS,UnusedCatchParameterJS
try {
    var mongoose = module.parent.require('mongoose');
    var mpromise = require('mpromise');
    var mpromise_index = _.find(require.cache, function (val, key) {return /.*formage.node_modules.mpromise.index.js/.test(key);});
    var mpromise_promise = _.find(require.cache, function (val, key) {return /.*formage.node_modules.mpromise.lib.promise.js/.test(key);});
    _.forEach(require.cache, function (val, key, cache) {
        if (/.*mpromise.index.js/.test(key)) cache[key] = mpromise_index;
        if (/.*mpromise.lib.promise.js/.test(key)) cache[key] = mpromise_promise;
    });
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
} catch (e) {}

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.fields.FileField = require('./forms/FileField');
exports.fields.ArrayField = require('./forms/ArrayField');
exports.AdminForm = require('./forms/AdminForm');


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

    var getModel = function (name) {return module.registry.models[name].model;};

    var adapter;
    switch(options.db_layer_type) {
        case 'jugglingdb':
            adapter = require('./adapters/jugglingdb')(jugglingdb);
            break;

        default:
            adapter = require('./adapters/mongoose')(mongoose);
            exports.fields.RefField = require('./forms/RefField')(getModel);
    }
    var ModelRegistry = require('./registry'),
        registerRoutes = require('./routes');


    if (!options.no_users) {
        if (options.admin_users_gui) {
            models.Admin_Users = adapter.Users;
        }
        // Some DI magic. Sorry :(
        exports.AdminForm.DI = {getFields: adapter.getFields};
        if (!options.dont_ensure_superuser) {
            adapter.Users.ensureExists(options.username, options.password, function (err, adminUser) {
                if (err) throw err;
                log('ensured user: %s', adminUser.username);
            });
        }
    }
    var registry = module.registry = new ModelRegistry(adapter, models, options);

    exports.serve_static(rootApp, express, options);
    registerRoutes(express, rootApp, registry);

    return registry;
};
