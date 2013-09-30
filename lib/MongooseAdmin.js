'use strict';
var _ = require('lodash'),
    async = require('async'),
    formage = require('..'),
    dependencies = require('./dependencies'),
    log = require('nodestrum').logFor('formage');

var LIST_EXCLUDED_FIELDS = ['order', '_id', 'show', '__v'];


var MongooseAdmin = module.exports = function MongooseAdmin(options) {
    this.Users = formage.models.MongooseAdminUser;
    this.models = {};
    this.options = options;
};


MongooseAdmin.prototype.registerModel = function (model, modelName, opt_options) {
    opt_options = opt_options || {};
    if (_.all(opt_options, _.isFunction)) opt_options || {};
    var list_populate = [];
    var list = _(model.schema.paths).map(function (pathObj, path) {
        var options = pathObj.options;
        if (!options.type || !options.type.name) return null;
        if (~LIST_EXCLUDED_FIELDS.indexOf(path)) return null;
        if (options.type.name == 'File') return null;
        if (options.ref) {
            list_populate.push(path);
        }
        return path;
    }).compact().valueOf();
    list.length = Math.min(list.length, 3);

    var options = _.extend({
        list: list,
        list_populate: list_populate,
        cloneable: true,
        is_single: false,
        form: formage.AdminForm,
        actions: []
    }, model.formage, opt_options);

    if (model.schema.paths.order) {
        options.order_by = ['order'];
        options.sortable = 'order';
    }
    // legacy option mapping
    options.is_single = options.single;

    var filters = buildModelFilters_fireAndForget(model, options.filters);
    model.label = model.label || modelName[0].toUpperCase() + modelName.slice(1).replace(/_/g, ' ');
    this.models[modelName] = {
        model: model,
        filters: filters,
        modelName: modelName,
        options: options,
        label: options.label || model.label,
        fields: options.fields,
        is_single: options.is_single
    };
    log('registered model %s', modelName);
};


MongooseAdmin.prototype.postRegistrationInit = function (user, callback) {
    var mongooseModels = _.pluck(this.models, 'model');
    _.forEach(this.models, function(modelConfig, modelName) {
        this.Users.registerModelPermissions(modelName);
        if (!modelConfig.is_single) addDefaultModelActions(modelName, modelConfig, mongooseModels);
    }, this);
};


MongooseAdmin.prototype.getAccessibleModels = function (user, callback) {
    var raw_models = this.models;
    var out_models = _(raw_models)
        .filter(function (out_model) {
            //noinspection JSUnresolvedVariable
            return user.hasPermissions(out_model.modelName, 'view') && !out_model.options.hideFromMain;
        })
        .compact().valueOf();
    callback(null, out_models);
};


MongooseAdmin.prototype.modelCounts = function (collectionName, filters, callback) {
    if (this.models[collectionName].is_single) {
        callback(null, 1);
        return;
    }
    this.models[collectionName].model.count(filters, function (err, count) {
        if (err) throw err;
        callback(null, count);
    });
};


MongooseAdmin.prototype.listModelDocuments = function (modelName, start, count, filters, sort, callback) {
    var model_config = this.models[modelName];
    var query = model_config.model.find(filters);
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

    return query.skip(start).limit(count).exec(function (err, documents) {
        if (err) {
            console.error('Unable to get documents for model because: ' + err);
            callback(null, []);
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

            callback(null, filteredDocuments);
        }
    });
};


MongooseAdmin.prototype.documentUnbinding = function (req, modelName, document, data, callback) {
    var modelConfig = this.models[modelName];
    var modelOptions = modelConfig.options;
    var form = new modelOptions.form(req, {instance: document, data: data}, modelConfig.model);
    form.init_fields();
    return form.is_valid(function (err, valid) {
        if (err) throw err;
        if (!valid) return callback(form);
        return form.save(function (err, document) {
            if (err) throw err;
            if (modelOptions.post) {
                document = modelOptions.post(document);
            }
            return callback(null, document);
        });
    });
};


MongooseAdmin.prototype.createDocument = function (req, modelName, data, callback) {
    if (!req.admin_user.hasPermissions(modelName, 'create')) throw new Error('unauthorized');
    this.documentUnbinding(req, modelName, null, data, callback);
};


MongooseAdmin.prototype.updateDocument = function (req, modelName, documentId, data, callback) {
    if (!req.admin_user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
    this.models[modelName].model.findById(documentId, function (err, document) {
        if (err) throw err;
        this.documentUnbinding(req, modelName, document, data, callback);
    }.bind(this));
};


MongooseAdmin.prototype.deleteDocument = function (user, modelName, documentId, callback) {
    if (!user.hasPermissions(modelName, 'delete')) throw new Error('unauthorized');
    var models = this.models;
    var modelConfig = models[modelName];
    modelConfig.model.findById(documentId, function (err, document) {
        if (err) throw err;
        if (!document) throw new Error('Document not found');
        dependencies.unlink(models, modelName, documentId, function (err) {
            if (err) throw new Error('unlink dependencies failed');
            document.remove(function (err) {
                if (err) throw err;
                callback();
            });
        });
    });
};


MongooseAdmin.prototype.orderDocuments = function (user, modelName, data, callback) {
    if (!user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
    var modelConfig = this.models[modelName];
    var sorting_attr = modelConfig.options.sortable;
    if (!sorting_attr) throw new TypeError("No sorting attribute for model " + modelName);
    async.forEach(Object.keys(data), function (id, cb) {
        var set_dict = _.object([[sorting_attr, data[id]]]);
        modelConfig.model.update({_id: id}, {'$set': set_dict}, function (err) {
            if (err) throw err;
            cb();
        });
    }, callback);
};


MongooseAdmin.prototype.actionDocuments = function (user, modelName, actionId, data, callback) {
    if (!user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
    var action = _.find(this.models[modelName].options.actions, {value: actionId});
    if (!action) throw new TypeError("Cloud not find action " + actionId);
    return action.func(user, data.ids, callback);
};


MongooseAdmin.prototype.userFromSessionStore = function (sessionStore) {
    return sessionStore ? this.Users.fromSessionStore(sessionStore) : false;
};


MongooseAdmin.prototype.ensureUserExists = function (username, password) {
    this.Users.ensureExists(username, password, function (err, adminUser) {
        if (!err)
            log('ensured user: %s', adminUser.username);
    });
};


MongooseAdmin.prototype.login = function (username, password, callback) {
    this.Users.getByUsernamePassword(username, password, callback);
};


MongooseAdmin.prototype.registerAdminUserModel = function (name, options) {
    this.registerModel(this.Users, name || 'Admin Users', _.extend({
        form: require('./forms/AdminUserForm'),
        list: ['username'],
        order_by: ['username']
    }, options));
};


function buildModelFilters_fireAndForget(model, filters) {
    var output = [];
    if (!filters) return output;

    process.nextTick(function () {
        filters.forEach(function (filter) {
            var path = model.schema.paths[filter];
            var options = path && path.options;
            model.collection.distinct(filter, function (err, results) {
                if (!results) return;
                results = _.flatten(results);
                if (results.length > 30) results.splice(5);
                if (!options.ref) {
                    output.push({
                        key: filter,
                        isString: options.type == String,
                        values: _.map(results, function (result) {return { value: result, text: result };})
                    });
                    return;
                }
                formage.mongoose.model(options.ref).find().where('_id').in(results).exec(function (err, refs) {
                    if (!refs) return;
                    output.push({
                        key: filter,
                        isString: false,
                        values: _.map(refs, function (ref) { return { value: ref.id, text: ref.toString() }; })
                    });
                });
            });
        })
    });
    return output;
}



function addDefaultModelActions(name, modelConfig, models) {
    modelConfig.options.actions.push({
        value: 'delete',
        label: 'Delete',
        func: function (user, ids, callback) {
            //noinspection JSUnresolvedFunction
            async.map(
                ids,
                _.partial(dependencies.check, models, name),
                function (err, results) {
                    if (err) return callback(err);
                    results = _(results).object().valueOf();
                    var with_deps = ids.filter(function (id) {return id in results;});
                    var no_dependencies = _.difference(ids, with_deps);
                    return modelConfig.model.remove({_id: {'$in': no_dependencies}}, function (err) {
                        if (err) throw err;
                        var goodLines = no_dependencies.map(function (id) {return 'document ' + id + ' was deleted.';});
                        goodLines.push('-----------------------------');
                        var errLines = _(results)
                            .map(function (deps, id) {
                                var lines = dependencies.depsToLines(deps);
                                lines.unshift('*****');
                                lines.unshift('document ' + id + ' has dependents:');
                                lines.push('******');
                                return lines;
                            })
                            .flatten()
                            .valueOf();
                        return callback(null, goodLines.concat(errLines))
                    });
                }
            );
        }
    });
}


function mongooseSort(query, sort) {
    if (Number(formage.mongoose.version.split('.')[0]) < 3) {
        if (sort[0] === '-')
            query.sort(sort.slice(1), 'descending');
        else
            query.sort(sort, 'ascending');
    }
    else
        query.sort(sort);
}
