"use strict";
module.exports = function (dblayer) {
    // monkey with juggling
    dblayer.AbstractClass.findById = dblayer.AbstractClass.find
    // end monkey

    var models = {};

    module.exports.getAdminUser = function (req) {
        return {hasPermissions: function () {return true}};

        //var sessionStore = req.session._mongooseAdminUser;
        //return sessionStore ? models.Users.fromSessionStore(sessionStore) : false;
    };

    return module.exports;
};
