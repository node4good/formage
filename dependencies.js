var async = require('async');
var _ = require('lodash');

var NO_UNLINK_POLICY = 0;
var REMOVE_POLICY = 1;
var UPDATE_POLICY = 2;

exports.check = function (remove,modelPrefs, modelName, id, callback) {
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
                .map(function(path) {return _.object([[path,id]]);})
                .valueOf();
            if (!new_paths.length) return null;
            return {model:model, query:new_paths, paths:ref_paths};
        })
        .compact()
        .valueOf();

    return async.map(
        models_with_deps,
        function (tuple, cb) {
            tuple.model.find({ '$or': tuple.query}).exec(cb);
        },
        function (err, results) {
            var all_dep_docs = _.flatten(results);
            if (!all_dep_docs.length) return callback(err, null);
            if(!remove)
                return callback(err,[id, all_dep_docs]);
            var policies = all_dep_docs.map(function(doc){
                return checkDependencyPolicy(doc,modelName,id);
            });
            if(policies.indexOf(NO_UNLINK_POLICY) > -1)
                return callback(null, [id, all_dep_docs]);
            else{
                async.each(all_dep_docs,function(dep,cbk,i){
                    var policy = policies[i];
                    if(policy == REMOVE_POLICY)
                        dep.remove(cbk);
                    else
                        dep.save(cbk);
                },function(err){
                    return callback(err,[]);
                });
            }

        }
    );
}

/**
 * Check the unlink policy of this document
 * @param doc
 * Dependent document
 * @param modelName
 * Root model name
 * @param id
 * Root document id
 * @return {Number}
 * 0 - no policy,
 * 1 - remove dependency,
 * 2 - update dependency
 */
function checkDependencyPolicy(doc,modelName,id){
    var schema = doc.schema,
        shouldSave = false,
        shouldRemove = false;

    Object.keys(schema.paths).forEach(function (fieldName) {
        if ((schema.paths[fieldName].options.ref) && (schema.paths[fieldName].options.ref === modelName) && (doc[fieldName] + '' === id)) {
            //noinspection JSUnresolvedVariable
            switch (schema.paths[fieldName].options.onDelete) {
                case 'delete':
                    shouldRemove = true;
                    break;

                case 'setNull':
                    doc[fieldName] = null;
                    shouldSave = true;
                    break;
            }
        }
    });
    return shouldRemove ? REMOVE_POLICY :( shouldSave ? UPDATE_POLICY : NO_UNLINK_POLICY);
}

exports.unlink = function(modelPrefs,modelName,id,cbk){
    exports.check(true,modelPrefs,modelName,id,cbk);
};
