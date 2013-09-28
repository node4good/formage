'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var path = require('path'),
    _ = require('lodash'),
    ckeditorPath = require('node-ckeditor'),
    MongooseAdmin = require('./MongooseAdmin.js'),
    registerRoutes = require('./routes');


module.exports = function (rootApp, express, models, options) {
    options = _.assign({}, {
        title: rootApp.get('site') + ' Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin',
        admin_users_gui: false
    }, options);
    var admin = new MongooseAdmin(options);
    var controllers = require('./controllers')(admin);
    admin.app = registerRoutes(express, controllers, rootApp, admin.options.root, version);
    admin.ensureUserExists(options.username, options.password);

    serve_static(rootApp, express, options);

    _.forEach(models, admin.registerModel.bind(admin));

    if (options.admin_users_gui)
        admin.registerAdminUserModel();

    admin.postRegistrationInit();

    return admin;
};


var serve_static = module.exports.serve_static = function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';

    if (module._is_serving_static) return;
    module._is_serving_static = true;

    app.use(options.root, express.static(path.join(__dirname, '..', '/assets')));
    app.use(options.root + '/ckeditor', express.static(ckeditorPath));
};


var version = module.exports.version = require(path.join(__dirname, '..', 'package.json')).version;
