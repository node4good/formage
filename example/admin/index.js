var admin_forms = require('../../index'),
    forms = admin_forms.forms,
    models = require('../models');

module.exports = function (app) {
    forms.serve_static(app);

    var admin = admin_forms.createAdmin(app, {root:'admin'});

    admin.setAdminTitle('Formage-Admin Example');
    admin.ensureUserExists('admin', 'admin');

    for(var name in models){
        var model = models[name];

        var paths = model.schema.paths,
            list = [],
            list_populate = [];

        for(var path in paths){
            if(!paths[path].options.type.name) continue;

            if (~['order', '_id', 'show'].indexOf(path)) continue;

            if(paths[path].options.ref)
                list_populate.push(path);

            if(paths[path].options.type.name == 'File') continue;

            list.push(path);
        }

        list.length = list.length > 3 ? 3 : list.length;

        var options = {
            list: list,
            list_populate: list_populate,
            cloneable: true,
            disable_forms_css: true,
            disable_forms_js: true
        };

        if (paths.order) {
            options.order_by = ['order'];
            options.sortable = 'order';
        }

        admin.registerMongooseModel(name, model, null, options);
    }
};