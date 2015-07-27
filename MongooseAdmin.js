'use strict';
var MongooseAdminUser = require('./models/mongoose_admin_user.js').MongooseAdminUser,
    AdminForm = require('./AdminForm').AdminForm,
    _ = require('lodash'),
    forms = require('./forms').forms,
    async = require('async'),


    dependencies = require('./dependencies');
    var permissions = require('./models/permissions');


var mongoose = require('mongoose');
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
	this.tabs = [];
	this.dialogs = {};
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
                if(typeof(filter) == 'object'){
                    dict.push(filter);
                    return cbk();
                }
                if(model.schema.paths[filter] && model.schema.paths[filter].type == Boolean){
                    dict.push({key:filter,values:[{value:true,text:'True'},{value:false,text:'False'}]});
                    return cbk();
                }
                if(model.schema.paths[filter] && model.schema.paths[filter].options && model.schema.paths[filter].options.enum){
                    dict.push({key:filter,values:model.schema.paths[filter].options.enum.map(function(option) { return {value:option,text:option,isString:true}; })});
                    return cbk();
                }
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
                                return { value: result, text: result };
                            }), isString: model.schema.paths[filter] && model.schema.paths[filter].options && model.schema.paths[filter].options.type == String});
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
            console.trace();
            if(MongooseAdmin.singleton.ignoreDependencies)
                return removeDocs(ids,callback);

            //noinspection JSUnresolvedFunction
            async.map(
                ids,
                _.partial(dependencies.check,true, models, name),
                function (err, results) {
                    if (err) return callback(err);
                    results = _(results).compact().object().valueOf();
                    var with_deps = ids.filter(function (id) {return id in results;});
                    if(with_deps.length)
                        return callback(new Error("can't delete " + with_deps.join(',') + " as they have dependencies"));

                    var no_dependencies = _.difference(ids, with_deps);
                    removeDocs(no_dependencies,callback);
                }
            );

            function removeDocs(ids,cbk){
                console.log(ids);
                model.find().where('_id').in(ids).exec(function(err,docs){
                    if(err)
                        return cbk(err);

                    async.each(docs,function(doc,cbk){
                        doc.remove(cbk);
                    },function(err){
                        cbk(err);
                    });
                });
            }
        }
    });
    if(model.schema.paths._preview){
        options.preview = model.schema.paths._preview.options.link;
        initPreviewModel(model);
    }

    var filters = [];
    buildModelFilters(model, options.filters, filters);

    this.models[name] = {
        model: model,
        filters: filters,
        modelName: name,
        options: options,
        label : options.label || model.label,
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
        modelName: name,
        label:options.label || model.label
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

MongooseAdmin.prototype.renderUserPanel = function(req,cbk){
    var user = req.admin_user.fields;
    var html = [
        '<div>Hello '+ user.username  + (user.lastVisit ? ', your last visit was on ' + new Date(user.lastVisit).toLocaleDateString() : '' ) + '</div>'
    ];
    cbk(null,html.join(''));
}

MongooseAdmin.prototype.getRegisteredModels = function (user, callback) {
    var raw_models = this.models;
    var out_models = Object.keys(raw_models).map(function (collectionName) {
        var out_model = raw_models[collectionName];
        out_model.model.is_single = out_model.is_single;
        return out_model;
    }).filter(function(model){
            return !model.options.hideFromMain;
        })
        .filter(function (model) {
        return permissions.hasPermissions(user, model.modelName, 'view');
    });
    callback(null, out_models);
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
 * @api public
 * @param {String} collectionName
 * @param {Number} start
 * @param {Number} count
 * @param filters
 * @param sort
 * @param {Function} onReady
 */
MongooseAdmin.prototype.listModelDocuments = function(collectionName, start, count,filters,sort, onReady) {
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
    query._admin = true;
    return query.skip(start).limit(count).exec(function (err, documents) {
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


MongooseAdmin.prototype.getDocument = function(collectionName, documentId, onReady) {
    var self = this;
    var query = this.models[collectionName].model.findById(documentId);
    query._admin = true;
    query.exec(function(err, document) {
        if (err) {
            console.log('Unable to get document because: ' + err);
            onReady('Unable to get document', null);
        } else {
            onReady(null, document);
        }
    });
};


MongooseAdmin.prototype.createDocument = function (req, user, collectionName, params, onReady) {
    var self = this;
    var model = this.models[collectionName].model;
    //noinspection LocalVariableNamingConventionJS
    var FormType = this.models[collectionName].options.form || AdminForm;
    if (!permissions.hasPermissions(user, collectionName, 'create')) return onReady('unauthorizaed');
    var form = new FormType(req, {data: params}, model);
    return form.is_valid(function (err, valid) {
        if (err) return onReady(err);
        if (!valid) return onReady(form, null);
        return form.save(function (err, document) {
            if (err) {
                console.error('Admin save error',err);
                return onReady(form);
            }
            if (self.models[collectionName].options && self.models[collectionName].options.post) {
                document = self.models[collectionName].options.post(document);
            }
//          MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'add', null, function(err, auditLog) {
            return onReady(null, document);
//          });
        });
    });
};


/**
 * Sets the preview model so it will init the
 * @param model
 */
function initPreviewModel(model){
    var _init = model.prototype.init;
    model.prototype.init = function(doc,query,cbk){
        var self = this;
        if(query._admin)
            return _init.call(this,doc,query,cbk);

        _init.call(this,doc,query,function(err){
            if(err) return cbk(err);
            if(self._preview){
                var previewDict;
                try {
                    previewDict = JSON.parse(self._preview);
                }
                catch(e) { }
                if(previewDict && previewDict._previewDate && new Date() - new Date(previewDict._previewDate) < 1000 * 60) {
                    delete previewDict._previewDate;
                    for(var key in previewDict)
                        self[key] = previewDict[key];
                    // disable save for preview items
                    self.save = function(cbk) { return cbk && cbk(null,this); };
                }
                else
                    self._preview = null;
            }
            cbk();
        });
    };
}


MongooseAdmin.prototype.saveForPreview = function(form,cbk){

    var previewDict = {};
    for (var field_name in form.clean_values) {
        if(field_name != '_preview')
            previewDict[field_name] = form.clean_values[field_name];
    }

    if(Object.keys(previewDict).length){
        previewDict._previewDate = new Date();
        form.instance._preview = JSON.stringify(previewDict);
        form.instance.markModified('_preview');
    }
    form.instance.save(cbk);
}


MongooseAdmin.prototype.updateDocument = function (req, user, collectionName, documentId, params, onReady) {
    var self = this,
        model = this.models[collectionName].model;

    if (!permissions.hasPermissions(user, collectionName, 'update')) return onReady('unauthorized');
    var FormType2 = this.models[collectionName].options.form || AdminForm;
    var qry =  model.findById(documentId);
    qry._admin = true;
    return qry.exec(function (err, document) {
        if (err) return onReady(err, null);
        var preview = params['_preview'];
        delete params['_preview'];
        var form = new FormType2(req, { instance: document, data: params }, model);
        form.init_fields();
        return form.is_valid(function (err, valid) {
            if (err || !valid) return onReady(err || form, null);
            if(preview){
                self.saveForPreview(form,onReady);
                return;
            }
            return form.save(function (err, document) {
                if (err) {
                    console.error('Admin save error',err);
                    return onReady(form, null);
                }
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


MongooseAdmin.prototype.deleteDocument = function(user, collectionName, documentId, onReady) {
    var self = this;
    var model = this.models[collectionName].model;
    if (!permissions.hasPermissions(user, collectionName, 'delete')) return onReady('unauthorized');
    var qry = model.findById(documentId);
    qry._admin = true;
    return qry.exec(function (err, document) {
        if (err) return onReady(err);
        if (!document) {
            return onReady('Document not found');
        }
        if(self.ignoreDependencies)
            return document.remove(onReady);

        return dependencies.unlink(self.models, collectionName, documentId, function (err) {
            if (err) return onReady('unlink dependencies failed');
            document.remove();
//          MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, documentId, 'del', null, function(err, auditLog) {
            return onReady(null);
//          });
        });
    });
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


MongooseAdmin.prototype.actionDocuments = function (user, collectionName, actionId, data, onReady) {
    if (!permissions.hasPermissions(user, collectionName, 'action')) return onReady('unauthorized');
    var action = _.find(this.models[collectionName].options.actions, {value: actionId});
    if (!action) return onReady('no action');
    return action.func(user, data.ids, onReady,data.data);
};


/**
 * Deserialize a user from a session store object
 *
 * @param {Object} sessionStore
 *
 * @api private
 */
MongooseAdmin.userFromSessionStore = function(sessionStore) {
    return sessionStore ? MongooseAdminUser.fromSessionStore(sessionStore) : false;
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
    console.log(arguments);
    MongooseAdminUser.getByUsernamePassword(username, password, function(err, adminUser) {
        onReady(err, adminUser);
    });
};


exports.loadApi = require('./AdminForm').loadApi;

exports.AdminForm = AdminForm;

exports.AdminUserForm = require('./AdminForm').AdminUserForm;

MongooseAdmin.prototype.registerAdminUserModel = function(name,options){
    this.registerMongooseModel(name || 'Admin Users',mongoose.model('MongooseAdminUser'),null, _.extend({
        form:exports.AdminUserForm,
        list:['username'],
        order_by:['username']
    },options||{}));
};