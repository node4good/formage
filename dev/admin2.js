'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var Class = require('sji'),
    async = require('async'),
    formage = require('formage');
var mongoose = require.main.require('mongoose');

var AdminModel, AdminUser, permissions;


/**
 * Admin app model
 * @type {*}
 */
var Admin = module.exports = Class.extend({
    /**
     * Inits the admin with an express app and options
     * @param app
     * @param mongoose
     * @param options
     * {root:'/', title:'Formage-Admin'}
     */
    init: function (app, mongoose, options) {
        options = options || {};

        AdminModel = require('./../models/AdminModel');
        AdminUser = require('models/mongoose_admin_user').MongooseAdminUser;
        permissions = require('./../models/permissions');

        this.app = app;
        this.root = options.root || '/admin';
        this.title = options.title || 'Formage-Admin';

        if (this.root[0] != '/') {
            this.root = '/' + this.root;
        }
        console.log('FormageAdmin is listening at path: ', this.root);

        paths.registerPaths(this, app, this.root);

        app.use(require('express').static(__dirname + '/public'));
        app.use(this.middleware());
        this.models = {};
    },
    /**
     * Build a full path that can be used in a URL
     *
     * @param {String} path
     */
    buildPath: function (path) {
        return this.root + path;
    },
    getAdminTitle: function () {
        return this.title;
    },
    setAdminTitle: function (title) {
        this.title = title;
    },
    /**
     * Push the mongoose-admin express config to the current config
     *
     */
    pushExpressConfig: function () {
        var currentViewsPath = this.app.set('views');
        this.app.engine('jade', require('jade').__express);
        this.app.set('views', __dirname + '/views');
        return {'views': currentViewsPath};
    },

    /**
     * Replace the mongoose-admin express config with the original
     */
    popExpressConfig: function (config) {
        this.app.set('views', config.views);
    },
    /**
     * Stop listening and end the admin process
     *
     * @api public
     */
    close: function () {
        this.app.close();
    },
    /**
     * Register an AdminModel to the Admin
     * @param model_name
     * string for the model
     * @param admin_model
     * AdminModel instance
     */
    register: function (model_name, admin_model) {
        this.models[model_name] = admin_model;
        console.log('\x1b[36mMongooseAdmin registered model: \x1b[0m %s', model_name);
        admin_model.admin = this;
        admin_model.modelName = model_name;
        permissions.registerModel(model_name);
    },
    /**
     * Unregister admin model
     * @param model_name
     */
    unRegister: function (model_name) {
        delete this.models[model_name];
    },
    /**@depracated
     * Backwards Compatability register admin model
     * @param model_name
     * @param model
     * @param fields
     * @param options
     * @return {*}
     */
    registerMongooseModel: function (model_name, model, fields, options) {
        var admin_model = new AdminModel(model, options);
        return this.register(model_name, admin_model);
    },
    registerSingleRowModel: function (model, model_name, options) {
        options.is_single = true;
        var admin_model = new AdminModel(model, options);
        return this.register(admin_model, admin_model);
    },
    ensureUserExists: function (username, password) {
        AdminUser.ensureExists(username, password, function (err, adminUser) {
            if (!err) {
                console.log('Created admin user: ' + adminUser.fields.username);
            }
        });
    },

    middleware: function() {return function (req, res, next) {
        var self = this;
        var adminUser = req.session._mongooseAdminUser ? AdminUser.fromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            var login_path = self.buildPath('/login');
            console.log('redirecting to', login_path);
            return res.redirect(401, login_path);
        }
        req.adminUser = adminUser;
        res.handle500 = function (err) {
            console.error('admin encountered 500', err);
            console.trace();
            var config = self.pushExpressConfig();
            res.render('500', {error: err});
            self.popExpressConfig(config);
        };
        res.handle404 = function (err) {
            console.error('admin encountered 404', req.url);
            console.trace();
            var config = self.pushExpressConfig();
            res.render('404');
            self.popExpressConfig(config);
        };
        res.handle401 = function (user, model, permission) {
            var config = self.pushExpressConfig();
            res.render('401', {user: user, model: model, permission: permission});
            self.popExpressConfig(config);
        };
        return next();
    }},
    // Routes
    login: function (req, res) {
        var config = this.pushExpressConfig();
        res.render('login.jade',
            {layout: 'layout.jade',
                'pageTitle': 'Admin Login',
                'rootPath': this.root
            });
        this.popExpressConfig(config);
    },
    loginPost: function (req, res) {
        AdminUser.getByUsernamePassword(req.body.username, req.body.password, function (err, adminUser) {
            if (err) {
                return res.send(500);
            }

            if (!adminUser) {
                return res.send(401, 'Not authorized');
            }

            req.session._mongooseAdminUser = adminUser.toSessionStore();
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write("{}");
            return res.end();
        });
    },
    logout: function (req, res) {
        req.session._mongooseAdminUser = undefined;
        res.redirect(this.buildPath('/'));
    },
    index: function (req, res) {
        var config = this.pushExpressConfig();
        res.render('models.jade', {
            layout: 'layout.jade',
            'pageTitle': 'Admin Site',
            'models': this.models,
            'renderedHead': '',
            'adminTitle': this.title,
            'rootPath': this.root
        });
        this.popExpressConfig(config);
    },
    model: function (req, res) {
        var model_name = req.params.modelName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        if (!permissions.hasPermissions(req.adminUser, model_name, 'view')) {
            res.handle401(req.adminUser, model_name, 'view');
            return;
        }
        this.models[model_name].index(req, res);
    },
    document: function (req, res) {
        var model_name = req.params.modelName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        if (!permissions.hasPermissions(req.adminUser, model_name, 'update')) {
            res.handle401(req.adminUser, model_name, 'update');
            return;
        }
        this.models[model_name].document(req, res);
    },
    documentPost: function (req, res) {
        var model_name = req.params.modelName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        if (req.body._id && req.body._id != '') {
            if (!permissions.hasPermissions(req.adminUser, model_name, 'update')) {
                res.handle401(req.adminUser, model_name, 'update');
                return;
            }
            this.models[model_name].documentUpdate(req, res);
        }
        else {
            if (!permissions.hasPermissions(req.adminUser, model_name, 'new')) {
                res.handle401(req.adminUser, model_name, 'new');
                return;
            }
            this.models[model_name].documentNew(req, res);
        }
    },
    actionDocuments: function (req, res) {
        var model_name = req.params.modelName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        //console.log(data);
        if (!permissions.hasPermissions(req.adminUser, model_name, 'action')) {
            res.handle401(req.adminUser, model_name, 'action');
            return;
        }

        this.models[model_name].action(req, res);
    },
    orderDocuments: function (req, res) {
        var model_name = req.params.collectionName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        //console.log(data);
        if (!permissions.hasPermissions(req.adminUser, model_name, 'order')) {
            res.handle401(req.adminUser, model_name, 'order');
            return;
        }
        this.models[model_name].order(req, res);
    },
    checkDependencies: function (req, res) {
        var model = req.body.model,
            id = req.body.id;

        require('../dependencies').check(this.models, model, id, function (err, results) {
            if (err)
                return res.end(500);

            var json = results.map(function (result) {
                return result.name || result.title || result.toString();
            });
            res.json(json, 200);
        });
    },
    deleteDocument: function (req, res) {
        var model_name = req.params.collectionName;
        if (!model_name in this.models) {
            res.handle404();
            return;
        }
        //console.log(data);
        if (!permissions.hasPermissions(req.adminUser, model_name, 'delete')) {
            res.handle401(req.adminUser, model_name, 'delete');
            return;
        }
        this.models[model_name].delete(req, res);
    }

});


Admin.create = function(app, mongoose, models, opt) {
    var admin = new Admin(app, mongoose, opt);

    for (var name in models) {
        var model = models[name];

        var paths = model.schema.paths,
            list = [],
            list_populate = [];

        for (var path in paths){
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

        if (model.single)
            admin.registerSingleRowModel(model, name, options);
        else
            admin.registerMongooseModel(name, model, null, options);
    }

    return admin;
};
