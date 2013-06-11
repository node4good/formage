'use strict';
var MongooseAdminUser = require('./models/mongoose_admin_user.js').MongooseAdminUser,
    _ = require('underscore'),
    async = require('async'),
    permissions = require('./models/permissions'),
    mongoose = require.main.require('mongoose'),
    AdminForm = require('./AdminForm').AdminForm,
    forms = require('./forms').forms;

/**
 * MongooseAdmin Constructor
 *
 * @api private
 */
var MongooseAdmin = module.exports = function (app, root) {
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

MongooseAdmin.prototype.getAdminTitle = function() {
    return this.title;
};

MongooseAdmin.prototype.setAdminTitle = function(title) {
    this.title = title;
};

/**
 * Stop listening and end the admin process
 *
 * @api public
 */
MongooseAdmin.prototype.close = function() {
    this.app.close();
};

function buildModelFilters (model, filters, dict) {
    if (!filters)
        return;

    setTimeout(function () {
        async.forEach(
            filters,
            function (filter, cbk) {
                model.collection.distinct(filter, function (err, results) {
                    if (results) {
                        if (results[0] && Array.isArray(results[0])) {
                            results = _.flatten(results);
                        }
                        if (results.length > 30)
                            results.splice(5);
                        if (model.schema.paths[filter] && model.schema.paths[filter].options.ref) {
                            mongoose.model(model.schema.paths[filter].options.ref).find()
                                .where('_id').in(results)
                                .exec(function (err, refs) {
                                    if (refs)
                                        dict.push({ key: filter, isString: false, values: _.map(refs, function (ref) {
                                            return { value: ref.id, text: ref.toString()};
                                        }) });
                                    cbk(err);
                                });
                        }
                        else {
                            dict.push({key: filter, values: _.map(results, function (result) {
                                return { value: result, text: result, isString: model.schema.paths[filter] && model.schema.paths[filter].options && model.schema.paths[filter].options.type == String };
                            })});
                            cbk();
                        }
                    }
                    else
                        cbk(err);
                });

            }, function () {

            })
    }, 1000);
}


MongooseAdmin.prototype.registerMongooseModel = function (name, model, fields, options) {
    var models = this.models;

    model.label = model.label || name[0].toUpperCase() + name.slice(1).replace(/_/g,' ');

    options = options || {};
    options.actions = options.actions || [];
    options.actions.push({
        value: 'delete',
        label: 'Delete',
        func: function (user, ids, callback) {
            async.map(
                ids,
                function (id, cb) {
                    require('./dependencies').check(models, name, id, cb);
                },
                function (err, results) {
                    if (err) return callback(err);

                    var no_dependencies = ids.filter(function (result, index) {
                        return !results[index] || !results[index].length;
                    });
                    model.remove({_id: {$in: no_dependencies}}, callback);
                }
            );
        }
    });

    var filters = [];
    buildModelFilters(model, options.filters, filters);

    this.models[name] = {
        model: model,
        filters: filters,
        modelName: name,
        options: options,
        fields: fields
    };

    console.log('\x1b[36mformage-admin:\x1b[0m %s', name);

    permissions.registerModel(name);
};


MongooseAdmin.prototype.registerSingleRowModel = function(model, name, options) {
    model.label = model.label || name[0].toUpperCase() + name.slice(1).replace(/_/g,' ');

    model.is_single = true;
    this.models[name] = {
        model: model,
        options: options || {},
        fields: {},
        is_single: true,
        modelName: name
    };
    permissions.registerModel(name);
};


/**
* Register a new mongoose model/schema with admin
*
* @param {Object} model
* @param {String} name
* @param {Object} options
*
* @api public
*/
MongooseAdmin.prototype.registerModel = function(model, name, options) {
    this.models[name] = {
        model: model,
        modelName: name,
        options: options
    };
    console.log('\x1b[36mformage-admin:\x1b[0m %s', name);
};


/**
 * Retrieve a list of all registered models
 *
 * @param {Function} callback
 *
 * @api public
 */
MongooseAdmin.prototype.getRegisteredModels = function (user, callback) {
    var raw_models = this.models;
    var out_models = Object.keys(raw_models).map(function (collectionName) {
        var out_model = raw_models[collectionName];
        out_model.model.is_single = out_model.is_single;
        return out_model;
    }).filter(function (model) {
        return permissions.hasPermissions(user, model.modelName, 'view');
    });
    callback(null, out_models);
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
    var model = this.models[collectionName];
    onReady(null, model.model, model.fields, model.options);
};

/**
 * Get the counts of a model
 *
 * @param {String} collectionName
 *
 * @api public
 */
MongooseAdmin.prototype.modelCounts = function(collectionName,filters, onReady) {
    if(this.models[collectionName].is_single) {
        onReady(null,1);
        return;
    }
    var model = this.models[collectionName].model;
    this.models[collectionName].model.count(filters, function(err, count) {
        if (err) {
            console.error('Unable to get counts for model because: ' + err);
            onReady(null,0);
        } else {
            onReady(null, count);
        }
    });
};

var IS_OLD_MONGOOSE = Number(mongoose.version.split('.')[0]) < 3;

function mongooseSort(query,sort) {
    if(IS_OLD_MONGOOSE) {
        if(sort[0] === '-')
            query.sort(sort.slice(1),'descending');
        else
            query.sort(sort,'ascending');
    }
    else
        query.sort(sort);
}

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
MongooseAdmin.prototype.listModelDocuments = function(collectionName, start, count, filters, sort, onReady) {
    var listFields = this.models[collectionName].options.list;
    if (!listFields) {
        return onReady(null, []);
    }

    var model = this.models[collectionName].model;
    var query = this.models[collectionName].model.find(filters);
    var sorts = this.models[collectionName].options.order_by || [];
    var populates = this.models[collectionName].options.list_populate;
    if (sort)
        sorts.unshift(sort);
    if (sorts) {
        for (var i = 0; i < sorts.length; i++)
            mongooseSort(query, sorts[i]);
    }
    if (populates) {
        _.each(populates, function (populate) {
            query.populate(populate);
        });
    }
    query.skip(start).limit(count).execFind(function (err, documents) {
        if (err) {
            console.error('Unable to get documents for model because: ' + err);
            onReady(null, []);
        } else {
            var filteredDocuments = [];
            documents.forEach(function (document) {
                var d = {};
                d['_id'] = document['_id'];
                listFields.forEach(function (listField) {
                    d[listField] = typeof(document[listField]) == 'function' ? document[listField]() : document.get(listField);
                });
                filteredDocuments.push(d);
            });

            onReady(null, filteredDocuments);
        }
    });
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
    //noinspection LocalVariableNamingConventionJS
    var FormType = this.models[collectionName].options.form || AdminForm;
    if(permissions.hasPermissions(user,collectionName,'create'))
    {

        var form = new FormType(req,{data:params},model);
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
//                        MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'add', null, function(err, auditLog) {
                            onReady(null, document);
//                        });
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
 * @api public
 */
MongooseAdmin.prototype.updateDocument = function(req, user, collectionName, documentId, params, onReady) {
    var self = this,
        model = this.models[collectionName].model;

    if (!permissions.hasPermissions(user,collectionName,'update')) {
        return onReady('unauthorized');
    }

    var FormType2 = this.models[collectionName].options.form || AdminForm;
    return model.findById(documentId, function (err, document) {
        if (err) {
            console.log('Error retrieving document to update: ' + err);
            return onReady('Unable to update', null);
        }

        var form = new FormType2(req, { instance: document, data: params }, model);
        form.init_fields();
        form.is_valid(function (err, valid) {
            if (err || !valid)
                return onReady(err || form, null);

            return form.save(function (err, document) {
                if (err)
                    return onReady(form, null);

                if (self.models[collectionName].options && self.models[collectionName].options.post) {
                    document = self.models[collectionName].options.post(document);
                }
                // MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'edit', null, function(err, auditLog) {
                return onReady(null, document);
                // });
            });
        });
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
                require('./dependencies').unlink(self.models, collectionName, documentId, function(err) {
                    if(err)
                        onReady('unlink dependencies failed');
                    else {
                        document.remove();
//                        MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, documentId, 'del', null, function(err, auditLog) {
                            onReady(null);
//                        });
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


MongooseAdmin.prototype.orderDocuments = function (user, collectionName, data, callback) {
    if (!permissions.hasPermissions(user, collectionName, 'order')) return callback('unauthorized');
    var model = this.models[collectionName];
    var sorting_attr = model.options.sortable;
    if (!sorting_attr) return callback();
    Object.keys(data).forEach(function (id) {
        var set_dict = {};
        set_dict[sorting_attr] = data[id];
        model.model.update({_id: id}, {$set: set_dict}, function (err, r) {});
    });
    return callback();
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
    return !sessionStore ? false : MongooseAdminUser.fromSessionStore(sessionStore);
};

/**
 * Create an admin user account
 *
 * @param {String} username
 * @param {String} password
 *
 * @api public
 */
MongooseAdmin.prototype.ensureUserExists = function(username, password) {
    MongooseAdminUser.ensureExists(username, password, function(err, adminUser) {
        if (!err)
            console.log('\x1b[36mformage-admin\x1b[0m user: %s', adminUser.fields.username);
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


exports.loadApi = require('./AdminForm').loadApi;

exports.AdminForm = AdminForm;
