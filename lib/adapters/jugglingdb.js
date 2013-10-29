"use strict";
var _ = require('lodash');
module.exports = function (dblayer) {
    // monkey with juggling
    dblayer.AbstractClass.findById = dblayer.AbstractClass.find;
    // end monkey

    var models = {};

    module.exports.getAdminUser = function (req) {
        return {hasPermissions: function () {return true}};

        //var sessionStore = req.session._mongooseAdminUser;
        //return sessionStore ? models.Users.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        var definitions = model.schema.definitions[model.modelName].properties;
        var ret = _(definitions).map(function (obj, path) {obj._path = path; return obj;});
        return ret;
    };

    module.exports.ensureExists = _.identity;
    module.exports.registerModelPermissions = _.identity;
    module.exports.getByUsernamePassword = _.identity;

    module.exports.Users = null;

    return module.exports;
};
