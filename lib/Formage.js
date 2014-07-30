'use strict';
var _ = require('lodash-contrib'),
    debug = require('debug')('formage');

try {
    var jugglingdb = module.parent.require("jugglingdb");
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        debug(e);
}

try {
    var mongoose = require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        debug(e);
}

try {
    var MPromise = require('mpromise');
    MPromise.fulfilled = MPromise.fulfilled || function fulfilled() { var p = new MPromise; p.fulfill.apply(p, arguments); return p; };
    MPromise.rejected = MPromise.rejected || function rejected(reason) { return new MPromise().reject(reason); };
    MPromise.deferred = MPromise.deferred || function deferred() {
        var p = new MPromise;
        return {
            promise: p,
            reject: p.reject.bind(p),
            resolve: p.fulfill.bind(p),
            callback: p.resolve.bind(p)
        };
    };
} catch (e) {
    debug(e);
}

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.fields.FileField = require('./forms/FileField');
exports.fields.ArrayField = require('./forms/ArrayField');
exports.SubForm = require('./forms/SubForm');
exports.AdminForm = require('./forms/AdminForm');
exports.UserForm = require('./forms/UserForm');
exports.fields.InlineRefField = require('./forms/InlineRefField');


exports.init = function (rootApp, models, options) {
    if (_.isFunction(models)) {
        models = arguments[2];
        options = arguments[3];
    }
    options = _.assign({}, {
        title: 'Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin',
        admin_users_gui: false,
        no_users: false,
        no_superuser: false
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
    }
    if (!options.no_superuser) {
        registry.setupSuperuser(options.username, options.password);
    }

    registerRoutes(rootApp, registry);

    return registry;
};
