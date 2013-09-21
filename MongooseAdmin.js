'use strict';
var _ = require('lodash'),
    async = require('async'),
    formage = require('./'),
    Users = formage.models.MongooseAdminUser,
//    MongooseAdminAudit = formage.models.MongooseAdminAudit,
    AdminForm = formage.AdminForm,
    dependencies = require('./dependencies');


/**
 * MongooseAdmin Constructor
 *
 * @api private
 */
var MongooseAdmin = module.exports = function (app, options) {
    this.options = _.defaults(options, MongooseAdmin.defaults);
    this.title = this.options.title;
    this.root = this.options.root;
    if (this.root[0] !== '/')
        this.root = '/' + this.root;

    this.app = app;
    this.models = {};

    console.log('\x1b[36mformage\x1b[0m at path', this.root);
};
MongooseAdmin.defaults = {
    title: 'Backoffice',
    root: '/admin',
    default_section: 'Main'
};

/**
 * Build a full path that can be used in a URL
 *
 * @param {String} path
 */
MongooseAdmin.prototype.buildPath = function(path) {
    return this.root + (path || '');
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

function buildModelFilters_fireAndForget (model, filters, dict) {
    if (!filters)
        return;

    process.nextTick(function () {
        filters.forEach(function (filter) {
            var path = model.schema.paths[filter];
            var options = path && path.options;
            model.collection.distinct(filter, function (err, results) {
                if (!results) return;
                results = _.flatten(results);
                if (results.length > 30) results.splice(5);
                if (!options.ref) {
                    dict.push({
                        key: filter,
                        isString: options.type == String,
                        values: _.map(results, function (result) {return { value: result, text: result };})
                    });
                    return;
                }
                formage.mongoose.model(options.ref).find().where('_id').in(results).exec(function (err, refs) {
                    if (!refs) return;
                    dict.push({
                        key: filter,
                        isString: false,
                        values: _.map(refs, function (ref) { return { value: ref.id, text: ref.toString() }; })
                    });
                });
            });
        })
    });
}


MongooseAdmin.prototype.registerMongooseModel = function (name, model, options) {
    var models = this.models;

    options = options || {};
    options.actions = options.actions || [];
    options.actions.push({
        value: 'delete',
        label: 'Delete',
        func: function (user, ids, callback) {
            //noinspection JSUnresolvedFunction
            async.map(
                ids,
                _.partial(dependencies.check, models, name),
                function (err, results) {
                    if (err) return callback(err);
                    results = _(results).compact().object().valueOf();
                    var with_deps = ids.filter(function (id) {return id in results;});
                    var no_dependencies = _.difference(ids, with_deps);
                    return model.remove({_id: {'$in': no_dependencies}}, function(err, docs) {
                        err = err || (!with_deps.length)? null : new Error("can't delete " + with_deps.join(',') + " as they have dependencies");
                        return callback(err, docs)
                    });
                }
            );
        }
    });
    this.registerModel(name, model, options);
};


MongooseAdmin.prototype.registerSingleRowModel = function(name, model, options) {
    model.is_single = true;
    this.registerModel(name, model, options);
};


MongooseAdmin.prototype.registerModel = function(name, model, options) {
    var filters = [];
    buildModelFilters_fireAndForget(model, options.filters, filters);
    model.label = model.label || name[0].toUpperCase() + name.slice(1).replace(/_/g,' ');
    this.models[name] = {
        model: model,
        filters: filters,
        modelName: name,
        options: options,
        label : options.label || model.label,
        fields: options.fields,
        is_single: model.is_single
    };
    Users.registerModelPermissions(name);
    console.log('\x1b[36mformage:\x1b[0m %s', name);
};

MongooseAdmin.prototype.renderUserPanel = function(req,cbk){
    var user = req.admin_user;
    var html = [
        '<div>Hello '+ user.username  + (user.lastVisit ? ', your last visit was on ' + new Date(user.lastVisit).toLocaleDateString() : '' ) + '</div>'
    ];
    cbk(null,html.join(''));
};

MongooseAdmin.prototype.getRegisteredModels = function (user, callback) {
    var raw_models = this.models;
    var out_models = _(raw_models)
        .map(function (out_model) {
            out_model.model.is_single = out_model.is_single;
            return out_model;
        })
        .filter(function (out_model) {
            //noinspection JSUnresolvedVariable
            return user.hasPermissions(out_model.modelName, 'view')
                && !out_model.options.hideFromMain;
        })
        .compact().valueOf();
    callback(null, out_models);
};


MongooseAdmin.prototype.getModelConfig = function(collectionName) {
    return this.models[collectionName] || this.models[collectionName.toLowerCase()];
};


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

function mongooseSort(query,sort) {
    if(Number(formage.mongoose.version.split('.')[0]) < 3) {
        if(sort[0] === '-')
            query.sort(sort.slice(1),'descending');
        else
            query.sort(sort,'ascending');
    }
    else
        query.sort(sort);
}

MongooseAdmin.prototype.listModelDocuments = function(collectionName, start, count, filters, sort, onReady) {
    var model_config = this.models[collectionName];
    var model = model_config.model;
    var query = model.find(filters);
    var sorts = _.clone(model_config.options.order_by) || [];
    var populates = model_config.options.list_populate;
    var listFields = model_config.options.list || ['id'];

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

    return query.skip(start).limit(count).execFind(function (err, documents) {
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


MongooseAdmin.prototype.createDocument = function (req, user, collectionName, params, onReady) {
    var self = this;
    var model = this.models[collectionName].model;
    //noinspection LocalVariableNamingConventionJS
    var FormType = this.models[collectionName].options.form || AdminForm;
    if (!user.hasPermissions(collectionName, 'create')) return onReady('unauthorizaed');
    var form = new FormType(req, {data: params}, model);
    return form.is_valid(function (err, valid) {
        if (err) return onReady(err);
        if (!valid) return onReady(form, null);
        return form.save(function (err, document) {
            if (err) return onReady(form);
            if (self.models[collectionName].options && self.models[collectionName].options.post) {
                document = self.models[collectionName].options.post(document);
            }
//          MongooseAdminAudit.logActivity(user, self.models[collectionName].modelName, collectionName, document._id, 'add', null, function(err, auditLog) {
            return onReady(null, document);
//          });
        });
    });
};


MongooseAdmin.prototype.updateDocument = function (req, user, collectionName, documentId, params, onReady) {
    var self = this,
        model = this.models[collectionName].model;

    if (!user.hasPermissions(collectionName, 'update')) return onReady('unauthorized');
    var FormType2 = this.models[collectionName].options.form || AdminForm;
    return model.findById(documentId, function (err, document) {
        if (err) return onReady(err, null);
        var form = new FormType2(req, { instance: document, data: params }, model);
        form.init_fields();
        return form.is_valid(function (err, valid) {
            if (err || !valid) return onReady(err || form, null);
            return form.save(function (err, document) {
                if (err) return onReady(form, null);
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
    if (!user.hasPermissions(collectionName, 'delete')) return onReady('unauthorized');
    return model.findById(documentId, function (err, document) {
        if (err) return onReady(err);
        if (!document) {
            return onReady('Document not found');
        }
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
    if (!user.hasPermissions(collectionName, 'order')) return callback('unauthorized');
    var model = this.models[collectionName];
    var sorting_attr = model.options.sortable;
    if (!sorting_attr) return callback();
    Object.keys(data).forEach(function (id) {
        var set_dict = {};
        set_dict[sorting_attr] = data[id];
        model.model.update({_id: id}, {'$set': set_dict}, function (err, r) {});
    });
    return callback();
};


MongooseAdmin.prototype.actionDocuments = function (user, collectionName, actionId, data, onReady) {
    if (!user.hasPermissions(collectionName, 'action')) return onReady('unauthorized');
    var action = _.find(this.models[collectionName].options.actions, {value: actionId});
    if (!action) return onReady('no action');
    return action.func(user, data.ids, onReady);
};


/**
 * Deserialize a user from a session store object
 *
 * @param {Object} sessionStore
 *
 * @api private
 */
MongooseAdmin.userFromSessionStore = function(sessionStore) {
    return sessionStore ? Users.fromSessionStore(sessionStore) : false;
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
    Users.ensureExists(username, password, function(err, adminUser) {
        if (!err)
            console.log('\x1b[36mformage\x1b[0m user: %s', adminUser.username);
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
    Users.getByUsernamePassword(username, password, function(err, adminUser) {
        onReady(err, adminUser);
    });
};


MongooseAdmin.prototype.registerAdminUserModel = function(name,options){
    this.registerMongooseModel(name || 'Admin Users', Users, null, _.extend({
        form:exports.AdminUserForm,
        list:['username'],
        order_by:['username']
    },options||{}));
};
