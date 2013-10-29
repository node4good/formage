module.exports = function (dblayer) {
    return {
        MongooseAdminAudit: require('./MongooseAdminAudit')(dblayer),
        MongooseAdminUser: require('./MongooseAdminUser')(dblayer)
    };
};
