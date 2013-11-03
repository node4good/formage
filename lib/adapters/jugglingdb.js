"use strict";
var _ = require('lodash');
var Fields = require('../forms/fields');
var JugglingDB;

module.exports = function (jugglingdb) {
    JugglingDB = jugglingdb;
    adaptModel(jugglingdb.AbstractClass);

    var models = {};

    module.exports.getAdminUser = function (req) {
        return {hasPermissions: function () {return true}};

        //var sessionStore = req.session._mongooseAdminUser;
        //return sessionStore ? models.Users.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        var definitions = model.schema.definitions[model.modelName].properties;
        var ret = _(definitions).map(function (obj, path) {
            obj.db_path = path;
            obj.name = path;
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
    module.exports.adaptModel = adaptModel;
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
            return [path.db_path, new Fields[path._fieldName](path)];
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
    return pk.db_path;
}


function queryDocuments(listFields, model, filters, sorts, populates, start, count, cb) {
    var pk = getPKName(model);
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


function adaptModel(model, name) {
    if (model.tree) {
        var cleanSchema = _.pick(model.tree, function (path, pathName) {return path.type});
        model = JugglingDB.connected.define(name, cleanSchema);
    }

    // monkey with juggling
    model.findById = model.find;
    model.prototype.validate = function (callback) {
        var doc = this;
        doc.isValid(function (valid) {
            if (valid) callback(null);
            else callback(doc);
        });
    };
    model.prototype.set = function (path, val) {this[path] = val;};
    // end monkey

    return model;
}
