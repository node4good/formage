var async = require('async');
var _ = require('lodash-contrib');

exports.check = function (models, modelName, id, callback) {
    //noinspection JSValidateTypes
    var models_with_deps = _(models)
        .filter('schema')
        .map(function(model) {
            var queryParts = _(model.schema.paths)
                // Take only paths that are refs to our model
                .filter(function (innerRef) {return innerRef.options.ref == modelName;})
                .pluck('path')
                // map each path to the id of our parent
                .map(function(path) {return _.object([[path, id]]);})
                .valueOf();
            if (_.isEmpty(queryParts)) return null;
            return {model:model, queryParts:queryParts};
        })
        .compact()
        .valueOf();

    return async.map(
        models_with_deps,
        function (tuple, cb) {
            tuple.model.find().or(tuple.queryParts).limit(3).exec(function (err, res) {
                if (err || _.isEmpty(res)) return cb(err, null);
                var ret = [tuple.model.modelName, res];
                cb(err, ret);
            });
        },
        function (err, results) {
            if (_.isEmpty(_.compact(results))) return callback(err, null);
            var all_dep_docs = _.object(results);
            return callback(null, [id, all_dep_docs]);
        }
    );
};

exports.depsToLines = function depsToLines(deps) {
    var lines = _(deps)
        .map(function (docs, modelName) {
            // Turn a dependency into a beautiful line .... <3 <3 <3
            return docs.map(function (doc) {return [modelName, ': ', (doc.name || doc.title || doc.toString()), ' - ', doc.id].join('');});
        })
        .flatten()
        .valueOf();
    return lines;
};


exports.unlink = function (models, model, id, callback) {
    exports.check(models, model, id, function (err, deps_pair) {
        if (err || !deps_pair) return callback(err);
        var deps = deps_pair[1];

        return async.forEach(deps, function (dep, cbk) {
            var schema = dep.schema,
                action = null;

            Object.keys(schema.paths).filter(function (fieldName) {
                return schema.paths[fieldName].options.ref === model && dep[fieldName] === id;
            }).forEach(function (fieldName) {
                action = schema.paths[fieldName].options['onDelete'];
                if (action === 'setNull')
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
