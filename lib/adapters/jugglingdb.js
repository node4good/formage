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


function queryDocuments(listFields, dbModel, filters, sorts, populates, start, count, cb) {
    listFields.unshift('id');
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
    dbModel.all(filters, function (err, docs) {
        if (err) throw err;
        docs = _.pluck(docs, '__data');
        var filtered = _.pick(docs, listFields);
        cb(filtered);
    });
}
