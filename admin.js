var Class = require('sji')
    , async = require('async')
    , AdminModel = require('./admin-model')
    , AdminUser = require('./mongoose_admin_user').MongooseAdminUser
    , permissions = require('./permissions')
    , formage = require('formage')
    , paths = require('./paths');

/**
 * Admin app model
 * @type {*}
 */
var FormageAdmin = module.exports = Class.extend({
    /**
     * Inits the admin with an express app and options
     * @param app
     * @param options
     * {root:'/', title:'Backoffice'}
     */
    init:function (app, options) {
        options = options || {};

        this.app = app;
        this.root = options.root || '/';

        if(this.root[0] != '/')
            this.root = '/' + this.root;
        console.log('FormageAdmin is listening at path: ', this.root);

        paths.registerPaths(this, app, this.root);

        app.use(require('express').static(__dirname + '/public'));
        this.title = options.title || 'Backoffice';
        this.models = {};
    },
    /**
     * Build a full path that can be used in a URL
     *
     * @param {String} path
     */
    buildPath:function (path) {
        return this.root + path;
    },
    getAdminTitle:function () {
        return this.title;
    },
    setAdminTitle:function (title) {
        this.title = title;
    },
    /**
     * Push the mongoose-admin express config to the current config
     *
     */
    pushExpressConfig:function () {
        var currentViewsPath = this.app.set('views');
        this.app.engine('jade', require('jade').__express);
        this.app.set('views', __dirname + '/views');
        return {'views':currentViewsPath};
    },

    /**
     * Replace the mongoose-admin express config with the original
     */
    popExpressConfig:function (config) {
        this.app.set('views', config.views);
    },
    /**
     * Stop listening and end the admin process
     *
     * @api public
     */
    close:function () {
        this.app.close();
    },
    /**
     * Register an AdminModel to the Admin
     * @param model_name
     * string for the model
     * @param admin_model
     * AdminModel instance
     */
    register:function (model_name, admin_model) {
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
    unRegister:function (model_name) {
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
    registerMongooseModel:function (model_name, model, fields, options) {
        var admin_model = new AdminModel(model, options);
        return this.register(model_name, admin_model);
    },
    registerSingleRowModel: function(model,model_name, options){
        options.is_single = true;
        var admin_model = new AdminModel(model,options);
        return this.register(admin_model,admin_model);
    },

ensureUserExists : function(username, password) {
        AdminUser.ensureExists(username, password, function(err, adminUser) {
            if (!err) {
                console.log('Created admin user: ' + adminUser.fields.username);
            }
        });
    },

    middleware:function(req,res){
        var self = this;
        var adminUser = req.session._mongooseAdminUser ? AdminUser.fromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            console.log('redirecting to', this.buildPath('/login'));
            res.redirect(this.buildPath('/login'));
            return false;
        }
        req.adminUser = adminUser;
        res.handle500 = function(err){
            console.error('admin encountered 500',err);
            console.trace();
            var config = self.pushExpressConfig();
            res.render('500',{error:err});
            self.popExpressConfig(config);
        };
        res.handle404 = function(err){
            console.error('admin encountered 404',req.url);
            console.trace();
            var config = self.pushExpressConfig();
            res.render('404');
            self.popExpressConfig(config);
        };
        res.handle401 = function(user,model,permission){
            var config = self.pushExpressConfig();
            res.render('401',{user:user,model:model,permission:permission});
            self.popExpressConfig(config);
        };
        return true;
    },
    // Routes
    login:function(req,res){
        var config = this.pushExpressConfig();
        res.render('login.jade',
            {layout:'layout.jade',
            'pageTitle':'Admin Login',
            'rootPath':this.root
            });
        this.popExpressConfig(config);
    },
    loginPost:function(req,res){
        AdminUser.getByUsernamePassword(req.body.username, req.body.password, function(err, adminUser) {
            if (err)
                return res.send(500);

            if (!adminUser)
                return res.send(401, 'Not authorized');

            req.session._mongooseAdminUser = adminUser.toSessionStore();
            res.writeHead(200, {"Content-Type": "application/json"});
            res.write("{}");
            return res.end();
        });
    },
    logout:function(req,res){
        req.session._mongooseAdminUser = undefined;
        res.redirect(this.buildPath('/'));
    },
    index:function(req,res){
        if(!this.middleware(req,res))
            return;
        var config = this.pushExpressConfig();
        res.render('models.jade',
            {layout:'layout.jade',
                'pageTitle':'Admin Site',
                'models':this.models,
                'renderedHead':'',
                'adminTitle':this.title,
                'rootPath':this.root
            });
        this.popExpressConfig(config);
    },
    model:function(req,res){

        if(!this.middleware(req,res))
            return;
        var model_name = req.params.modelName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        if (!permissions.hasPermissions(req.adminUser, model_name, 'view')) {
            res.handle401(req.adminUser, model_name, 'view');
            return;
        }
        this.models[model_name].index(req,res);
    },
    document:function(req,res){
        if(!this.middleware(req,res))
            return;

        var model_name = req.params.modelName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        if (!permissions.hasPermissions(req.adminUser, model_name, 'update')) {
            res.handle401(req.adminUser, model_name, 'update');
            return;
        }
        this.models[model_name].document(req,res);
    },
    documentPost:function(req,res){
        if(!this.middleware(req,res))
            return;

        var model_name = req.params.modelName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        if (req.body._id && req.body._id != '') {
            if (!permissions.hasPermissions(req.adminUser, model_name, 'update')) {
                res.handle401(req.adminUser, model_name, 'update');
                return;
            }
            this.models[model_name].documentUpdate(req,res);
        }
        else{
            if (!permissions.hasPermissions(req.adminUser, model_name, 'new')) {
                res.handle401(req.adminUser, model_name, 'new');
                return;
            }
            this.models[model_name].documentNew(req,res);
        }
    },
    actionDocuments:function(req,res){
        if(!this.middleware(req,res))
            return;

        var model_name = req.params.modelName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        //console.log(data);
        if(!permissions.hasPermissions(req.adminUser,model_name,'action')){
            res.handle401(req.adminUser,model_name,'action');
            return;
        }

        this.models[model_name].action(req,res);
    },
    orderDocuments:function(req,res){
        if(!this.middleware(req,res))
            return;

        var model_name = req.params.collectionName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        //console.log(data);
        if(!permissions.hasPermissions(req.adminUser,model_name,'order')){
            res.handle401(req.adminUser,model_name,'order');
            return;
        }
        this.models[model_name].order(req,res);
    },
    checkDependencies:function(req,res){
        var modelName = req.body.model;
        var id = req.body.id;
        formage.forms.checkDependecies(modelName,id,function(err,results)
        {
            var json = results.map(function(result) {
                return result.name || result.title || result.toString();
            });
            res.json(json,200);
        });
    },
    deleteDocument:function(req,res){
        if(!this.middleware(req,res))
            return;

        var model_name = req.params.collectionName;
        if(!model_name in this.models){
            res.handle404();
            return;
        }
        //console.log(data);
        if(!permissions.hasPermissions(req.adminUser,model_name,'delete')){
            res.handle401(req.adminUser,model_name,'delete');
            return;
        }
        this.models[model_name].delete(req,res);
    }

});
