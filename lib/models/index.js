module.exports = function (mongoose) {
    return {
        MongooseAdminAudit: require('./MongooseAdminAudit')(mongoose),
        MongooseAdminUser: require('./MongooseAdminUser')(mongoose)
    };
};
