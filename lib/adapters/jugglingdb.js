"use strict";
var _ = require('lodash');

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
    var fields = {};
    fields = _.omit(fields, exclude);
    fieldsets.push({fields: fields});
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
        params.order = sorts.pop();
    }
    model.all(filters, function (err, docs) {
        if (err) throw err;
        var filtered = _(docs)
            .pluck('__data')
            .tap(console.log.bind(console, "%j"))
            .map(function (doc) {
                doc = _.pick(doc, listFields);
                doc._id = doc[pk];
                return doc;
            })
            .valueOf();
        cb(filtered);
    });
}
