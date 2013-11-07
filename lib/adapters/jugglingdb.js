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

    module.exports.Users = adaptModel(require('../models/MongooseAdminUser')(require('mongoose')), 'Admin_Users');
    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;
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
                doc = _.pick(doc, listFields.concat(['id']));
                doc._id = doc[pk];
                return doc;
            })
            .valueOf();
        cb(filtered);
    });
}


function adaptModel(model, name) {
    if (model.geoNear) {
        model.schema.formage = _.extend({}, model.formage, model.schema.formage);
        model = model.schema;
    }
    if (model.tree) {
        var original = model;
        var cleanSchema = _.pick(original.tree, function (path) {return path.type});
        delete cleanSchema._id;
        if (!_.find(cleanSchema, {primaryKey:true})) cleanSchema.id = {type: Number, primaryKey: true};
        model = JugglingDB.connected.define(name, cleanSchema);
        _.assign(model, original.statics);
        _.assign(model.prototype, original.methods);
        // on the model because the schema is global
        model.formage = original.formage;
        delete model.formage.subCollections;
    }

    // monkey with juggling
    model.findById = model.find;
    model.prototype.remove = model.prototype.destroy;
    model.prototype.validate = function (callback) {
        var doc = this;
        doc.isValid(function (valid) {
            if (valid) callback(null);
            else callback({errors: doc.errors.codes});
        });
    };
    model.prototype.set = function (path, val) {this[path] = val;};
    // end monkey
    model.isJugglingDB = true;
    return model;
}
