/** 
 * Module dependencies
 */
var mongoose = require('mongoose');

var AuditData = new mongoose.Schema({
    created: {type:Date, required:true, 'default':new Date},
    user: {type:mongoose.Schema.ObjectId, required:true},
    model: String,
    collectionName: String,
    documentId: mongoose.Schema.ObjectId,
    action: {type:String, required:true},
    note: String
});
mongoose.model('_MongooseAdminAudit', AuditData);

function MongooseAdminAudit() {
    this.fields = {};
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
MongooseAdminAudit.logActivity = function(user, modelName, collectionName, documentId, action, note, onReady) {
    var auditLog = new MongooseAdminAudit();
    var auditLogModel = mongoose.model('_MongooseAdminAudit');

    auditLogData = new auditLogModel();
    auditLogData.user = user.fields._id;
    auditLogData.model = modelName;
    auditLogData.collectionName = collectionName;
    auditLogData.documentId = documentId;
    auditLogData.action = action;
    auditLogData.note = note;

    auditLogData.save(function(err) {
        if (err) {
            console.log('Unable to store item in audit log because: ' + err);
            onReady('Unable to store item in log', null);
        } else {
            auditLog.fields = auditLogData;
            onReady(null, auditLog);
        }
    });
};

exports.MongooseAdminAudit = MongooseAdminAudit;
