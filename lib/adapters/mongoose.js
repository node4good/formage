'use strict';
var _ = require('lodash');

module.exports = function (dblayer) {
    var models = require('../models')(dblayer);

    module.exports.getAdminUser = function (req) {
        var sessionStore = req.session._mongooseAdminUser;
        return sessionStore ? models.MongooseAdminUser.fromSessionStore(sessionStore) : false;
    };

    module.exports.getPaths = function (model) {
        var ret = _(model.schema.paths).map(function (obj, path) {
            var options = obj.options || {};
            options._path = path;
            return obj.options;
        });
        return ret;
    };

    module.exports.ensureExists = models.MongooseAdminUser.ensureExists.bind(models.MongooseAdminUser);
    module.exports.registerModelPermissions = models.MongooseAdminUser.registerModelPermissions.bind(models.MongooseAdminUser);
    module.exports.getByUsernamePassword = models.MongooseAdminUser.registerModelPermissions.bind(models.MongooseAdminUser);

    module.exports.Users = models.MongooseAdminUser;

    return module.exports;
};
