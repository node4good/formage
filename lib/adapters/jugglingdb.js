"use strict";
const _ = require('lodash-contrib');
const Fields = require('../forms/fields');
let JugglingDB;

module.exports = function (jugglingdb) {
    JugglingDB = jugglingdb;
    adaptModel(jugglingdb.AbstractClass);

    module.exports.getAdminUser = function () {
        return {hasPermissions: function () {return true;}};

        //var sessionStore = req.session._FormageUser;
        //return sessionStore ? models.Users.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        const definitions = model.schema.definitions[model.modelName].properties;
        const ret = _(definitions).map(function (obj, path) {
            obj.db_path = path;
            obj.name = path;
            return obj;
        });
        return ret;
    };

    module.exports.Users = adaptModel(require('../models/FormageUser')(require('mongoose')), 'Admin_Users');
    module.exports.getFields = getFields;
    module.exports.queryDocuments = queryDocuments;
    module.exports.adaptModel = adaptModel;
    return module.exports;
};


function getFields(model, exclude) {
    const paths = module.exports.getPaths(model);
    const exclude_plus = exclude.concat([getPKName(model), 'id']);
    const fields = paths
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
    const paths = module.exports.getPaths(model);
    const pk = paths.find({primaryKey: true});
    return pk.db_path;
}


function queryDocuments(listFields, model, filters, sorts, populates, start, count, cb) {
    const pk = getPKName(model);
    const param = {
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
        const filtered = _(docs)
            .map('__data')
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
        const original = model;
        const cleanSchema = _.pickBy(original.tree, function (path) {
            return path.type;
        });
        delete cleanSchema._id;
        if (!_.find(cleanSchema, {primaryKey: true})) cleanSchema.id = {type: Number, primaryKey: true};
        _.forEach(cleanSchema, function (val) {
            const type = val.type.name;
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
        const p = new Promise(res, rej => {
            const doc = this;
            doc.isValid(function (valid) {
                if (valid) res();
                else rej({errors: doc.errors.codes});
            });
        });
        return p;
    };
    model.prototype.set = function (path, val) {this[path] = val;};
    // end monkey
    model.isJugglingDB = true;
    return model;
}
