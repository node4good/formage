"use strict";
var _ = require('lodash-contrib'),
    Promise = require('mpromise'),
    Fields = require('../forms/fields'),
    JugglingDB;

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


function getFields(model, exclude) {
    var paths = module.exports.getPaths(model);
    var exclude_plus = exclude.concat([getPKName(model), 'id']);
    var fields = paths
        .filter(function (path) {
            path._fieldType = path._fieldType || (path.type.name + 'Field');
            return path._fieldType in Fields;
        })
        .map(function (path) {
            return [path.db_path, new Fields[path._fieldType](path)];
        })
        .compact()
        .object()
        .omit(exclude_plus)
        .valueOf();

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
        if (!_.find(cleanSchema, {primaryKey: true})) cleanSchema.id = {type: Number, primaryKey: true};
        _.forEach(cleanSchema, function (val, key) {
            var type = val.type.name;
            switch (type) {
                case 'Html':
                    val.widget = 'RichTextAreaWidget';
                    val.type = function Text() {};
                    break;

                case 'Picture':
                    val._fieldType = 'PictureField';
                    val.type = function JSON() {};
                    break;

//                case 'File':
//                    val._fieldType = 'FileField';
//                    val.type = function JSON() {};
//                    break;

                case 'Filepicker':
                    val._fieldType = 'FilepickerField';
                    val.type = function JSON() {};
                    break;

                case 'GeoPoint':
                    val._fieldType = 'GeoPointField';
                    val.type = function JSON() {};
                    break;

                case 'Integer':
                    val._fieldType = 'NumberField';
                    val.type = Number;
                    break;

            }
            if (val.enum) {
                val._fieldType = 'EnumField';
            }

        });
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
    model.prototype.validate = function () {
        var p = new Promise();
        var doc = this;
        doc.isValid(function (valid) {
            if (valid) p.fulfill();
            else p.reject({errors: doc.errors.codes});
        });
        return p;
    };
    model.prototype.set = function (path, val) {this[path] = val;};
    // end monkey
    model.isJugglingDB = true;
    return model;
}
