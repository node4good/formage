'use strict';
if (!module.parent) console.console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var AuditData = new module.parent.mongoose_module.Schema({
    created: {type: Date, required: true, 'default': new Date},
    user: {type: module.parent.mongoose_module.Schema.ObjectId, required: true},
    model: String,
    collectionName: String,
    documentId: module.parent.mongoose_module.Schema.ObjectId,
    action: {type: String, required: true},
    note: String
});
'_MongooseAdminAudit' in Object.keys(module.parent.mongoose_module['models']) || module.parent.mongoose_module.model('_MongooseAdminAudit', AuditData);

exports.MongooseAdminAudit = function (fields) {
    this.fields = fields || {};
};

/**
 * Records a single audited activity
 *
 * @param {Object} user
 * @param {String} modelName
 * @param {String} collectionName
 * @param {String} documentId
 * @param {String} action
 * @param {String} note
 *
 * @api private
 */
exports.MongooseAdminAudit.logActivity = function (user, modelName, collectionName, documentId, action, note, onReady) {
    var auditLogData = new module.parent.mongoose_module.model('_MongooseAdminAudit')();
    auditLogData.user = user.fields._id;
    auditLogData.model = modelName;
    auditLogData.collectionName = collectionName;
    auditLogData.documentId = documentId;
    auditLogData.action = action;
    auditLogData.note = note;

    auditLogData.save(function (err) {
        if (err) {
            console.log('Unable to store item in audit log because: ', err);
            onReady('Unable to store item in log', null);
        } else {
            var auditLog = new exports.MongooseAdminAudit(auditLogData);
            onReady(null, auditLog);
        }
    });
};
