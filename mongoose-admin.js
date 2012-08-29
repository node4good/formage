/*!
 * Mongoose Admin
 * Copyright (c) 2011 Marc Campbell (marc.e.campbell@gmail.com)
 * MIT Licensed
 */


 /**
  * Module dependencies
  */
var MongooseAdminUser = require('./mongoose_admin_user.js').MongooseAdminUser,
    MongooseAdminAudit = require('./mongoose_admin_audit.js').MongooseAdminAudit,
    _ = require('underscore'),
    async = require('async'),
    permissions = require('./permissions'),
     mongoose = require('mongoose'),
	paths = require('./http/register_paths'),
    AdminForm = require('./form').AdminForm,
    forms = require('j-forms').forms;
	

exports = module.exports = MongooseAdmin;
exports.version = '0.0.1';

var app;

/** 
 * Create the admin singleton object
 *
 * @param {String} dbUri
 * @param {Number} port
 *
 * @api public
 */
exports.createAdmin = function(app,options) {
//    if (options.port) {
//        var app = app || (app = require('http'));
//
//        app.listen(options.port);
//        require('http/paths').registerPaths(app, '/');
//
//        console.log('\x1b[36mMongooseAdmin is listening on port: \x1b[0m %d', options.port);
//        console.log('\x1b[36mMongooseAdmin is connected using db: \x1b[0m %s', dbUri);
//
//        MongooseAdmin.singleton = new MongooseAdmin(app, '');
//        return MongooseAdmin.singleton;
//    } else if (options.app && options.root) {
    options = options || {};
    var root = options.root || '';
    console.log('\x1b[36mMongooseAdmin is listening at path: \x1b[0m %s', root);
//        console.log('\x1b[36mMongooseAdmin is connected using db: \x1b[0m %s', dbUri);


    paths.registerPaths(MongooseAdmin, app, '/' + root);
	
    app.use(require('express').static(__dirname + '/public'));

    MongooseAdmin.singleton = new MongooseAdmin(app, '/' + root);
	
    return MongooseAdmin.singleton;
//    }
};

/**
 * MongooseAdmin Constructor
 *
 * @api private
 */
function MongooseAdmin(app, root) {
    //mongoose.connect(dbUri);
    this.app = app;
    this.root = root;
    this.models = {};
    this.title = "Backoffice";
};

/**
 * Build a full path that can be used in a URL
 *
 * @param {String} path
 */
MongooseAdmin.prototype.buildPath = function(path) {
    return this.root + path;
};

MongooseAdmin.prototype.getAdminTitle = function(){
    return this.title;
};

MongooseAdmin.prototype.setAdminTitle = function(title)
{
    this.title = title;
};

/**
 * Push the mongoose-admin express config to the current config
 *
 */
MongooseAdmin.prototype.pushExpressConfig = function() {
    var currentViewsPath = MongooseAdmin.singleton.app.set('views');
    this.app.set('views', __dirname + '/views');
    return {'views': currentViewsPath};
};

/**
 * Replace the mongoose-admin express config with the original
 */
MongooseAdmin.prototype.popExpressConfig = function(config) {
    this.app.set('views', config.views);
};

/**
 * Stop listening and end the admin process
 *
 * @api public
 */
MongooseAdmin.prototype.close = function() {
    this.app.close();
};

function buildModelFilters(model,filters,dict) {
    if(!filters)
        return;
    setTimeout(function() {
        async.forEach(filters,function(filter,cbk) {
            model.collection.distinct(filter, function(err,results) {
                if(results) {
                    if(results[0] && Array.isArray(results[0])) {
                        results = _.flatten(results);
                    }
		    if(results.length > 30)
                        results.splice(5);
                    if(model.schema.paths[filter] && model.schema.paths[filter].options.ref) {
                        mongoose.model(model.schema.paths[filter].options.ref).find()
                            .where('_id').in(results).exec(function(err,refs) {
                                if(refs)
                                    dict.push( {key:filter, isString:false, values: _.map(refs,function(ref) { return { value:ref.id, text:ref.toString()};  }) });
                                cbk(err);
                            })
                    }
                    else {
                        dict.push({key:filter, values: _.map(results, function(result) {
                            return { value: result, text:result, isString:model.schema.paths[filter] && model.schema.paths[filter].options && model.schema.paths[filter].options.type == String };
                        })});
                        cbk();
                    }
                }
                else
                    cbk(err);
            })

        },function(){
        })
    },1000);
};

MongooseAdmin.prototype.registerMongooseModel = function(modelName, model,fields, options) {
    options = options || {};
    options.actions = options.actions || [];
    options.actions.push({value:'delete', label:'Delete',func:function(user,ids,callback)
    {
        async.parallel(_.map(ids,function(id)
        {
            return function(cbk)
            {
                forms.checkDependecies(modelName,id,cbk);
            }
        }),function(err,results)
        {
            if(err)
                callback(err);
            else
            {
                var no_dependecies = _.filter(ids,function(result,index)
                {
                    return results[index].length == 0;
                });
                model.remove({_id:{$in:no_dependecies}},callback);
            }
        });
    }});
    var filters = [];
    buildModelFilters(model,options.filters,filters);

    this.models[modelName] = {model: model,
        filters:filters,
        modelName:modelName,
        options: options,
        fields: fields};

    console.log('\x1b[36mMongooseAdmin registered model: \x1b[0m %s', modelName);

    permissions.registerModel(modelName);
};

MongooseAdmin.prototype.registerSingleRowModel = function(model,name,options)
{
    model.is_single = true;
    this.models[name] = {model:model,options:options||{},fields:{},is_single:true,modelName:name}
    permissions.registerModel(name);
};


/**
* Register a new mongoose model/schema with admin
*
* @param {String} modelName
* @param {Object} fields
* @param {Object} options
*
* @api public
*/
MongooseAdmin.prototype.registerModel = function(model, name, options) {
    this.models[name] = {model: model,
        modelName:name,
        options: options
    };
    console.log('\x1b[36mMongooseAdmin registered model: \x1b[0m %s', name);

};

/** 
 * Retrieve a list of all registered models
 *
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.getRegisteredModels = function(user,onReady) {
    var models = [];
    for (var collectionName in this.models) {
        this.models[collectionName].model.is_single = this.models[collectionName].is_single;
        models.push(this.models[collectionName]);
    };
    models = _.filter(models,function(model)
    {
        return permissions.hasPermissions(user,model.modelName,'view');
    });
    onReady(null, models);
};

/**
 * Get a single model from the registered list with admin
 *
 * @param {String} collectionName
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.getModel = function(collectionName, onReady) {
    onReady(null, this.models[collectionName].model, this.models[collectionName].fields, this.models[collectionName].options);
};

/** 
 * Get the counts of a model
 * 
 * @param {String} collectionName
 *
 * @api public
 */
MongooseAdmin.prototype.modelCounts = function(collectionName,filters, onReady) {
    if(this.models[collectionName].is_single)
    {
        onReady(null,1);
        return;
    }
    this.models[collectionName].model.count(filters, function(err, count) {
        if (err) {
            console.error('Unable to get counts for model because: ' + err);
            onReady(null,0);
        } else {
            onReady(null, count);
        }
    });
};

/**
 * List a page of documents from a model
 *
 * @param {String} collectionName
 * @param {Number} start
 * @param {Number} count
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.listModelDocuments = function(collectionName, start, count,filters,sort, onReady) {
    var listFields = this.models[collectionName].options.list;
    if(listFields)
    {
	    var model;
		try{
			model = mongoose.model(collectionName);
		}
		catch( e) {
			model = this.models[collectionName].model;
		}
        _.each(filters,function(value,key) {
		    if(model.schema) {
				var type = model.schema.paths[key].options.type;
				if(type == String)
					filters[key] = new RegExp(value,'i');
		    }
        });
        var query = this.models[collectionName].model.find(filters);
        var sorts = this.models[collectionName].options.order_by || [];
        var populates = this.models[collectionName].options.list_populate;
        if(sort)
            sorts.unshift(sort);
        if(sorts) {
            for(var i=0; i<sorts.length; i++)
                query.sort(sorts[i]);
        }
        if(populates)
        {
            _.each(populates,function(populate)
            {
                query.populate(populate);
            });
        }
        query.skip(start).limit(count).execFind(function(err, documents) {
            if (err) {
                console.error('Unable to get documents for model because: ' + err);
                onReady(null,[]);
            } else {
                var filteredDocuments = [];
                documents.forEach(function(document) {
                    var d = {};
                    d['_id'] = document['_id'];
                    listFields.forEach(function(listField) {
                      d[listField] = typeof(document[listField])=='function'? document[listField]() : document.get(listField);
                    });
                    filteredDocuments.push(d);
                });

                onReady(null, filteredDocuments);
            }
        });
    }
    else
    {
        onReady(null,[]);
    }
};

/** 
 * Retrieve a single document
 * 
 * @param {String} collectionName
 * @param {String} documentId
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.getDocument = function(collectionName, documentId, onReady) {
    this.models[collectionName].model.findById(documentId, function(err, document) {
        if (err) {
            console.log('Unable to get document because: ' + err);
            onReady('Unable to get document', null);
        } else {
            onReady(null, document);
        }
    });
};

/** 
 * Create a new document
 *
 * @param {String} collectionName
 * @param {Object} params
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.createDocument = function(req,user, collectionName, params, onReady) {
    var self = this;
    var model = this.models[collectionName].model;
    var form_type = this.models[collectionName].options.form || AdminForm;
    if(permissions.hasPermissions(user,collectionName,'create'))
    {

        var form = new form_type(req,{data:params},model);
        form.is_valid(function(err,valid)
        {
            if(err)
            {
                onReady(err);
                return;
            }
            if(valid)
            {
                form.save(function(err,document)
                {
                    if (err) {
                        //console.log('Error saving document: ' + err);
                        onReady(form);
                    } else {

                        if (self.models[collectionName].options && self.models[collectionName].options.post) {
                            document = self.models[collectionName].options.post(document);
                        }
                        MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'add', null, function(err, auditLog) {
                            onReady(null, document);
                        });
                    }
                });
            }
            else
            {
                onReady(form,null);
            }
        });
    }
    else
    {
        onReady('unauthorizaed');
    }
};

/**
 * Update a document
 *
 * @param {String} collectionName
 * @param {String} documentId
 * @param {Object} params
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.updateDocument = function(req,user, collectionName, documentId, params, onReady) {
    onReady = _.once(onReady);
    var self = this;
    var fields = this.models[collectionName].fields;
    var model = this.models[collectionName].model;
    if(permissions.hasPermissions(user,collectionName,'update'))
    {

        var form_type = this.models[collectionName].options.form || AdminForm;
    model.findById(documentId, function(err, document) {
        if (err) {
            console.log('Error retrieving document to update: ' + err);
            onReady('Unable to update', null);
        } else {

            var form = new form_type(req,{instance:document,data:params},model);
            form.is_valid(function(err,valid)
            {
                if(err)
                {
                    onReady(err, null);
                    return;
                }
                if(valid)
                {
                    form.save(function(err,document)
                    {
                        if (err) {
//                            console.log('Unable to update document: ' + err);
                            onReady(form, null);
                        } else {

                            if (self.models[collectionName].options && self.models[collectionName].options.post) {
                                document = self.models[collectionName].options.post(document);
                            }
                            MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'edit', null, function(err, auditLog) {
                                onReady(null, document);
                            });
                        }

                    });
                }
                else
                {
                    onReady(form,null);
                }
            });
        }
    });
    }
    else
    {
        onReady('unauthorized');
    }
};

/**
 * Delete, remove a document
 *
 * @param {String} collectionName
 * @param {String} documentId
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.deleteDocument = function(user, collectionName, documentId, onReady) {
    var self = this;
    var model = this.models[collectionName].model;
    if(permissions.hasPermissions(user,collectionName,'delete'))
    {
        model.findById(documentId, function(err, document) {
        if (err) {
            console.log('Error retrieving document to delete: ' + err);
            onReady('Unable to delete');
        } else {
            if (!document) {
                onReady('Document not found');
            } else {
                forms.unlinkDependencies(self.models[collectionName].modelName,documentId,function(err) {
                    if(err)
                        onReady('unlink dependencies failed');
                    else {
                        document.remove();
                        MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, documentId, 'del', null, function(err, auditLog) {
                            onReady(null);
                        });
                    }
                });
            }
        }
    });
    }
    else
    {
        onReady('unauthorized')
    }
};

MongooseAdmin.prototype.orderDocuments =function(user,collectionName,data,onReady)
{
    //console.log(data);
    if(permissions.hasPermissions(user,collectionName,'order'))
    {
            var sorting_attr = this.models[collectionName].options.sortable;
        if(sorting_attr)
        {
            for(var id in data)
            {
                var set_dict = {};
                set_dict[sorting_attr] = data[id];
                    this.models[collectionName].model.update({_id:id},{$set:set_dict},function(err,r)
                    {
                    });
            }
        }

        onReady(null);
    }
    else
        onReady('unauthorized');
};

MongooseAdmin.prototype.actionDocuments =function(user,collectionName,actionId,data,onReady)
{
    //console.log(data);
    if(permissions.hasPermissions(user,collectionName,'action'))
    {
            var action = _.find(this.models[collectionName].options.actions, function(action){ return action.value == actionId; });
        if(action)
        {
            action.func(user,data.ids,onReady);
        }
        else
            onReady('no action');
    }
    else
        onReady('unauthorized');
};



/**
 * Deserialize a user from a session store object
 *
 * @param {Object} sessionStore
 * 
 * @api private
 */
MongooseAdmin.userFromSessionStore = function(sessionStore) {
    return MongooseAdminUser.fromSessionStore(sessionStore);
};

/** 
 * Create an admin user account
 * 
 * @param {String} username
 * @param {Stirng} password
 *
 * @api public
 */
MongooseAdmin.prototype.ensureUserExists = function(username, password) {
    MongooseAdminUser.ensureExists(username, password, function(err, adminUser) {
        if (!err) {
            console.log('Created admin user: ' + adminUser.fields.username);
        }
    });
};

/** 
 * Log in as a user
 *
 * @param {String} username
 * @param {String} password
 * @param {Function} onReady
 *
 * @api public
 */
MongooseAdmin.prototype.login = function(username, password, onReady) {
    MongooseAdminUser.getByUsernamePassword(username, password, function(err, adminUser) {
        onReady(err, adminUser);
    });
};


exports.loadApi = require('./form').loadApi;

exports.AdminForm = AdminForm;