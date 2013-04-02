var async = require('async');

exports.check = function (models, model, id, callback) {
    var ref_models = Object.keys(models)
        .filter(function(name) {
            return models[name].model && models[name].model.schema;
        })
        .map(function(name) {
            var paths = models[name].model.schema.paths,
                new_paths = Object.keys(paths).reduce(function(seed, path) {
                    if (paths[path].options.ref == model) {
                        var o = {};
                        o[path] = id;
                        seed.push(o);
                    }
                    return seed;
                }, []);

            return [ name, new_paths ];
        })
        .filter(function(pair) {
            return pair[1].length;
        });

    if (!ref_models.length)
        return callback(null, []);

    async.map(
        ref_models,
        function (pair, cb) {
            models[pair[0]].model.find({ $or: pair[1] }, cb);
        },
        function (err, results) {
            callback(err, results.reduce(function (seed, res_batch) {
                return seed.concat(res_batch);
            }, []));
        }
    );
};


exports.unlink = function (models, model, id, callback) {
    exports.check(models, model, id, function (err, deps) {
        if (err)
            return callback(err);

        async.forEach(deps, function (dep, cbk) {
            var schema = dep.schema,
                shouldSave = false,
                shouldRemove = false;

            Object.keys(schema.paths).forEach(function (fieldName) {
                if (schema.paths[fieldName].options.ref && schema.paths[fieldName].options.ref === model && dep[fieldName] + '' === id) {
                    switch (schema.paths[fieldName].options.onDelete) {
                        case 'delete':
                            shouldRemove = true;
                            break;

                        case 'setNull':
                            dep[fieldName] = null;
                            shouldSave = true;
                            break;
                    }
                }
            });
            if (shouldRemove) {
                dep.remove(cbk);
            }
            else {
                if (shouldSave) {
                    dep.save(cbk);
                }
                else {
                    cbk();
                }
            }
        }, callback);
    });
};