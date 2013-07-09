'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var fa = require('./index.js'),
    _ = require('lodash'),
    LIST_EXCLUDED_FIELDS = ['order', '_id', 'show', '__v'];

module.exports = function(app, express, models, opt) {
    opt || (opt = {});

    var admin = fa.createAdmin(app, opt);
    admin.setAdminTitle(opt.title || app.get('site') + ' Admin');
    admin.ensureUserExists(opt.username || 'admin', opt.password || 'admin');

    fa.serve_static(app, express, opt);
    fa.register_models(models);

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
            cloneable: true,
            disable_forms_css: true,
            disable_forms_js: true
        }, model.formage);

        if (paths.order) {
            options.order_by = ['order'];
            options.sortable = 'order';
        }

        if (model.single)
            admin.registerSingleRowModel(model, name, options);
        else
            admin.registerMongooseModel(name, model, null, options);
    });

    require('./AdminForm').loadApi(app, '/admin-api');

    return admin;
};
