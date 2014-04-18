"use strict";
module.exports = function (mongoose) {
    return {
        MongooseAdminAudit: require('./MongooseAdminAudit')(mongoose),
        FormageUser: require('./FormageUser')(mongoose)
    };
};
