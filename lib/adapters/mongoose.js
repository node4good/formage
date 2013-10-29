module.exports = function (dblayer) {
    var models = require('../models')(dblayer);

    module.exports.getAdminUser = function (req) {
        var sessionStore = req.session._mongooseAdminUser;
        return sessionStore ? models.MongooseAdminUser.fromSessionStore(sessionStore) : false;
    };

    return module.exports;
};
