var async = require('async');
var _ = require('lodash');

exports.check = function (modelPrefs, modelName, id, callback) {
    //noinspection JSValidateTypes
    var models_with_deps = _(modelPrefs)
        .pluck('model')
        .filter('schema')
        .map(function(model) {
            var ref_paths;
            var new_paths = _(model.schema.paths)
                // Take only paths that are refs to our model
                .filter(function (innerModel) {return innerModel.options.ref == modelName;})
                .pluck('path')
                .tap(function(paths) {ref_paths = paths})
                // map each path to the id of our parent
                .map(function(path) {return _.object([[path, {'$in': id}]]);})
                .valueOf();
            if (!new_paths.length) return null;
            return {model:model, query:new_paths, paths:ref_paths};
        })
        .compact()
        .valueOf();

    return async.map(
        models_with_deps,
        function (tuple, cb) {
            tuple.model.find({ '$or': tuple.paths}).limit(3).exec(cb);
        },
        function (err, results) {
            var all_dep_docs = _.flatten(results);
            if (!all_dep_docs.length) return callback(err, null);
            return callback(null, [id, all_dep_docs]);
        }
    );
};


exports.unlink = function (models, model, id, callback) {
    exports.check(models, model, id, function (err, deps_pair) {
        if (err || !deps_pair) return callback(err);
        var deps = deps_pair[1];

        return async.forEach(deps, function (dep, cbk) {
            var schema = dep.schema,
                action;

            Object.keys(schema.paths).filter(function (fieldName) {
                return schema.paths[fieldName].options.ref === model && dep[fieldName] === id;
            }).forEach(function (fieldName) {
                action = schema.paths[fieldName].options.onDelete;
                if ('setNull' === action)
                    dep[fieldName] = null;
            });
            switch (action) {
                case 'delete':
                    return dep.remove(cbk);

                case 'setNull':
                    return dep.save(cbk);

                default:
                    return cbk();
            }
        }, callback);
    });
};
