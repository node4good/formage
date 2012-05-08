/*!
 * Mongoose Admin
 * Copyright (c) 2011 Marc Campbell (marc.e.campbell@gmail.com)
 * MIT Licensed
 */


 /**
  * Module dependencies
  */
var sys = require('sys'),
    MongooseAdminUser = require('./mongoose_admin_user.js').MongooseAdminUser,
    MongooseAdminAudit = require('./mongoose_admin_audit.js').MongooseAdminAudit,
    mongoose = require('mongoose'),
    _ = require('underscore'),
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

    require('./http/paths').registerPaths(app, '/' + root);
    app.use(require('express').static(__dirname + '/http/static'));

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
    this.app.set('views', __dirname + '/http/views');
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


MongooseAdmin.prototype.registerMongooseModel = function(modelName, model,fields, options) {
    options = options || {};
    options.actions = options.actions || [];
    options.actions.push({value:'delete', label:'Delete',func:function(user,ids,callback)
    {
        model.remove({_id:{$in:ids}},callback);
    }});
    this.models[modelName] = {model: model,
        options: options,
        fields: fields};

    console.log('\x1b[36mMongooseAdmin registered model: \x1b[0m %s', modelName);
};

MongooseAdmin.prototype.registerSingleRowModel = function(model,name)
{
    model.is_single = true;
    this.models[name] = {model:model,options:{},fields:{},is_single:true,modelName:name}
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
MongooseAdmin.prototype.getRegisteredModels = function(onReady) {
    var models = [];
    for (var collectionName in this.models) {
        this.models[collectionName].model.is_single = this.models[collectionName].is_single;
        models.push(this.models[collectionName].model);
    };
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
MongooseAdmin.prototype.modelCounts = function(collectionName, onReady) {
    if(this.models[collectionName].is_single)
    {
        onReady(null,1);
        return;
    }
    this.models[collectionName].model.count({}, function(err, count) {
        if (err) {
            console.log('Unable to get counts for model because: ' + err);
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
MongooseAdmin.prototype.listModelDocuments = function(collectionName, start, count, onReady) {
    var listFields = this.models[collectionName].options.list;
    if(listFields)
    {

    var query = this.models[collectionName].model.find({});
    var sorts = this.models[collectionName].options.order_by;
    if(sorts)
    {
        for(var i=0; i<sorts.length; i++)
        {
            if(sorts[i].indexOf('-') == 0)
                query.sort(sorts[i].substring(1),'descending');
            else
                query.sort(sorts[i],'ascending');
        }
    }
    query.skip(start).limit(count).execFind(function(err, documents) {
        if (err) {
            console.log('Unable to get documents for model because: ' + err);
            onReady('Unable to get documents for model', null);
        } else {
            var filteredDocuments = [];
            documents.forEach(function(document) {
                var d = {};
                d['_id'] = document['_id'];
                listFields.forEach(function(listField) {
                  d[listField] = document.get(listField);
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
    var form_type = this.models[collectionName].options.form || forms.AdminForm;
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

//    var document = new model();
//
//    for (field in this.models[collectionName].fields) {
//        if (params[field]) {
//            document[field] = params[field];
//        } else {
//            if (params[field + '_linked_document']) {
//                document[field] = mongoose.Types.ObjectId.fromString(params[field + '_linked_document']);
//            }
//        }
//    }
//
//    if (this.models[collectionName].options && this.models[collectionName].options.pre) {
//        document = this.models[collectionName].options.pre(document);
//    }
//
//    document.save(function(err) {
//        if (err) {
//            console.log('Error saving document: ' + err);
//            onReady('Error saving document: ' + err);
//        } else {
//
//            if (self.models[collectionName].options && self.models[collectionName].options.post) {
//                document = self.models[collectionName].options.post(document);
//            }
//            MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'add', null, function(err, auditLog) {
//                onReady(null, document);
//            });
//        }
//    });
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
    var self = this;
    var fields = this.models[collectionName].fields;
    var model = this.models[collectionName].model;
    var form_type = this.models[collectionName].options.form || forms.AdminForm;
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
//            for (field in fields) {
//                if (params[field]) {
//                    console.log(params['field'])
//                    // hack to handle booleans
//                    if (params[field] == 'true'){
//                        params[field] = true
//                    } else if (params[field] == 'false'){
//                        params[field] = false
//                    }
//
//                    document[field] = params[field];
//                } else {
//                    if (params[field + '_linked_document']) {
//                        document[field] = mongoose.Types.ObjectId.fromString(params[field + '_linked_document']);
//                    }
//                }
//            }
//
//            if (self.models[collectionName].options && self.models[collectionName].options.pre) {
//                document = self.models[collectionName].options.post(document);
//            }
//
//            document.save(function(err) {
//                if (err) {
//                    console.log('Unable to update document: ' + err);
//                    onReady('Unable to update docuemnt', null);
//                } else {
//
//                    if (self.models[collectionName].options && self.models[collectionName].options.post) {
//                        document = self.models[collectionName].options.post(document);
//                    }
//                    MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'edit', null, function(err, auditLog) {
//                        onReady(null, document);
//                    });
//                }
//            });
        }
    });
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
    model.findById(documentId, function(err, document) {
        if (err) {
            console.log('Error retrieving document to delete: ' + err);
            onReady('Unable to delete');
        } else {
            if (!document) {
                onReady('Document not found');
            } else {
                document.remove();
                MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, documentId, 'del', null, function(err, auditLog) {
                    onReady(null);
                });
            }
        }
    });
};

MongooseAdmin.prototype.orderDocuments =function(user,collectionName,data,onReady)
{
    //console.log(data);
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
};

MongooseAdmin.prototype.actionDocuments =function(user,collectionName,actionId,data,onReady)
{
    //console.log(data);
    var action = _.find(this.models[collectionName].options.actions, function(action){ return action.value == actionId; });
    if(action)
    {
        action.func(user,data.ids,onReady);
    }
    else
        onReady('no action');
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


