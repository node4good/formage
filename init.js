'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var path = require('path'),
    MongooseAdmin = require('./MongooseAdmin.js'),
    _ = require('lodash'),
    forms = require('./forms'),
    ckeditorPath = require('node-ckeditor'),
    registerRoutes = require('./routes'),
    LIST_EXCLUDED_FIELDS = ['order', '_id', 'show', '__v'];


module.exports = function(app, express, models, opt) {
    opt || (opt = {});

    var admin = createAdmin(app, opt);
    admin.setAdminTitle(opt.title || app.get('site') + ' Admin');
    admin.ensureUserExists(opt.username || 'admin', opt.password || 'admin');

    serve_static(app, express, opt);
    forms.forms.set_models(models);

    Object.keys(models).sort().forEach(function(name) {
        var model = models[name];

        var paths = model.schema.paths,
            list = [],
            list_populate = [];

        Object.keys(paths).forEach(function(path) {
            var options = paths[path].options;

            if (!options.type.name) return;
            if (~LIST_EXCLUDED_FIELDS.indexOf(path)) return;
            if (options.type.name == 'File') return;

            if (options.ref)
                list_populate.push(path);

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

        if (model.single)
            admin.registerSingleRowModel(name, model, options);
        else
            admin.registerMongooseModel(name, model, options);
    });

    return admin;
};


var serve_static = module.exports.serve_static = function (app, express, options) {
    options = options || {};
    options.root = options.root || '/admin';

    if (module._is_serving_static) return;
    module._is_serving_static = true;

    app.use(options.root, express.static(path.join(__dirname, '/public')));
    app.use(options.root + '/ckeditor', express.static(ckeditorPath));
};


var createAdmin = module.exports.createAdmin = function(app, options) {
    var admin = MongooseAdmin.singleton = new MongooseAdmin(app, options);
    admin.app = registerRoutes(MongooseAdmin, app, admin.root, module.exports.version);

    return admin;
};


module.exports.version = require(path.join(__dirname, 'package.json')).version;
