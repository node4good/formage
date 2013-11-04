'use strict';
var _ = require('lodash'),
    async = require('async'),
    AdminForm = require('./forms/AdminForm'),
    log = require('nodestrum').logFor('formage');

var LIST_EXCLUDED_FIELDS = ['order', '_id', 'show', '__v'];

/**
 *
 * @constructor
 */
function ModelRegistry(adapter, models, options) {
    this.models = {};
    this.adapter = adapter;
    this.options = options;
    this.version = require('../package.json').version;

    if (options.admin_users_gui) {
        models.Admin_Users = this.adapter.Users;
    }
    _.forEach(models, this.registerModel.bind(this));
    _.forEach(this.models, function (modelConfig, modelName) {
        this.adapter.Users.registerModelPermissions(modelName);
        if (!modelConfig.is_single) addDefaultModelActions(modelName, modelConfig, _.pluck(this.models, 'model'));
    }, this);
}


ModelRegistry.prototype.getDefaultFieldList = function getDefaultFieldList(model) {
    var list_populate = [];
    var list = this.adapter.getPaths(model).map(function (options) {
        if (!options.type || !options.type.name) return null;
        if (~LIST_EXCLUDED_FIELDS.indexOf(options.db_path)) return null;
        if (options.type.name == 'File') return null;
        if (options.ref) {
            list_populate.push(options.db_path);
        }
        return options.db_path;
    }).compact().valueOf();
    list.length = Math.min(list.length, 3);
    return {list_populate: list_populate, list: list};
}


ModelRegistry.prototype.registerModel = function (model, modelName, opt_options) {
    if (!model) return;
    opt_options = opt_options || {};
    if (_.all(opt_options, _.isFunction)) opt_options = {};

    model = this.adapter.adaptModel(model, modelName);

    var options = _.extend({
        cloneable: true,
        is_single: false,
        form: AdminForm,
        post: _.identity,
        actions: []
    }, this.options, model.schema.formage, opt_options);


    if (!('list' in options)) {
        var list_defaults = this.getDefaultFieldList(model);
        options = _.extend(options, list_defaults);
    }

//    if (model.schema.paths.order) {
//        options.order_by = ['order'];
//        options.sortable = 'order';
//    }
    // legacy option mapping
    if (model.single) {
        options.is_single = model.single;
        console.error('formage: model.single is deprecated. Set model.formage.is_single instead. At model ' + modelName + '.');
    }

    var filters = buildModelFilters_fireAndForget(model, this.models, options.filters);
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


ModelRegistry.prototype.getAccessibleModels = function getAccessibleModels(user) {
    var out_models = _.filter(this.models).filter(function (out_model) {
        return user.hasPermissions(out_model.modelName, 'view') && !out_model.options.hideFromMain;
    });
    return out_models;
};


function buildModelFilters_fireAndForget(model, models, filters) {
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
                var dbmodel = models[options.ref].model;
                dbmodel.find().where('_id').in(results).exec(function (err, refs) {
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

module.exports = ModelRegistry;
