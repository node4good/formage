'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var path = require('path'),
    _ = require('lodash'),
    ckeditorPath = require('node-ckeditor'),
    ModelRegistry = require('./registry'),
    registerRoutes = require('./routes'),
    log = require('nodestrum').logFor('formage');


module.exports = function (rootApp, express, models, adapter, options) {
    options = _.assign({}, {
        title: rootApp.get('site') + ' Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin',
        admin_users_gui: false
    }, options);

    var registry = new ModelRegistry(adapter, options);
    registerRoutes(express, rootApp, registry);
    adapter.ensureExists(options.username, options.password, function (err, adminUser) {
        if (err) throw err;
        log('ensured user: %s', adminUser.username);
    });

    serve_static(rootApp, express, options);

    _.forEach(models, registry.registerModel.bind(registry));

    if (options.admin_users_gui) {
        registry.registerModel(adapter.Users, 'Admin_Users', _.extend({
            form: require('./forms/AdminUserForm'),
            list: ['username'],
            order_by: ['username']
        }, options));
        registry.postRegistrationInit();
    }


    return registry;
};


var serve_static = module.exports.serve_static = function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';

    if (module._is_serving_static) return;
    module._is_serving_static = true;

    app.use(options.root, express.static(path.join(__dirname, '..', '/assets')));
    app.use(options.root + '/ckeditor', express.static(ckeditorPath));
};
