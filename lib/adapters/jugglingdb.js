"use strict";
var _ = require('lodash');
var Fields = require('../forms/fields');

module.exports = function (jugglingdb) {
    // monkey with juggling
    jugglingdb.AbstractClass.findById = jugglingdb.AbstractClass.find;
    // end monkey

    var models = {};

    module.exports.getAdminUser = function (req) {
        return {hasPermissions: function () {return true}};

        //var sessionStore = req.session._mongooseAdminUser;
        //return sessionStore ? models.Users.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        var definitions = model.schema.definitions[model.modelName].properties;
        var ret = _(definitions).map(function (obj, path) {
            obj._path = path;
            obj._typeName = obj.type.name;
            return obj;
        });
        return ret;
    };

    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;

    module.exports.ensureExists = _['identity'];
    module.exports.registerModelPermissions = _['identity'];
    module.exports.getByUsernamePassword = _['identity'];

    module.exports.Users = null;

    return module.exports;
};


function getFields(model, exclude, fieldsets) {
    var paths = module.exports.getPaths(model);
    var exclude_plus = exclude.concat([getPKName(model), 'id']);
    var fields = paths
        .filter(function (path) {
            path._fieldName = path._typeName + 'Field';
            return path._fieldName in Fields;
        })
        .map(function (path) {
            return [path._path, new Fields[path._fieldName](path)];
        })
        .compact()
        .object()
        .omit(exclude_plus)
        .valueOf();

    fieldsets.push({fields: Object.keys(fields)});
    return fields;
}


function getPKName(model) {
    var paths = module.exports.getPaths(model);
    var pk = paths.find({primaryKey: true});
    return pk._path;
}


function queryDocuments(listFields, model, filters, sorts, populates, start, count, cb) {
    var pk = getPKName(model);
    listFields = _.unique(listFields.concat([pk]));
    var param = {
        where: filters,
        include: "",
        order: "",
        limit: count,
        skip: start
    };
    if (sorts && sorts.length) {
        param.order = sorts.pop();
    }
    model.all(param, function (err, docs) {
        if (err) throw err;
        var filtered = _(docs)
            .pluck('__data')
            .map(function (doc) {
                doc = _.pick(doc, listFields);
                doc._id = doc[pk];
                return doc;
            })
            .valueOf();
        cb(filtered);
    });
}
