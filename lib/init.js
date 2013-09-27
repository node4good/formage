'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var path = require('path'),
    _ = require('lodash'),
    ckeditorPath = require('node-ckeditor'),
    MongooseAdmin = require('./MongooseAdmin.js'),
    registerRoutes = require('./routes');

var LIST_EXCLUDED_FIELDS = ['order', '_id', 'show', '__v'];


module.exports = function (rootApp, express, models, options) {
    options = _.assign({}, {
        title: rootApp.get('site') + ' Admin',
        root: '/admin',
        default_section: 'Main',
        username: 'admin',
        password: 'admin'
    }, options);
    var admin = new MongooseAdmin(options);
    var controllers = require('./controllers')(admin);
    admin.app = registerRoutes(express, controllers, rootApp, admin.options.root, version);
    admin.ensureUserExists(options.username, options.password);

    serve_static(rootApp, express, options);

    Object.keys(models).sort().forEach(function (name) {
        var model = models[name],
            paths = model.schema.paths,
            list = [],
            list_populate = [];

        Object.keys(paths).forEach(function (path) {
            var options = paths[path].options;

            if (!options.type.name) return;
            if (~LIST_EXCLUDED_FIELDS.indexOf(path)) return;
            if (options.type.name == 'File') return;

            if (options.ref) {
                list_populate.push(path);
            }

            list.push(path);
        });

        list.length = list.length > 3 ? 3 : list.length;

        var options = _.extend({
            list: list,
            list_populate: list_populate,
            cloneable: true
        }, model.formage);

        if (paths.order) {
            options.order_by = ['order'];
            options.sortable = 'order';
        }

        if (model.single) {
            admin.registerSingleRowModel(name, model, options);
        }
        else {
            admin.registerMongooseModel(name, model, options);
        }
    });

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
