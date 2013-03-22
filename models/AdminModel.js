var Class = require('sji'),
    forms = require('../forms'),
    jest = require('jest'),
    MongooseAdminAudit = require('./mongoose_admin_audit.js').MongooseAdminAudit,
    async = require('async'),
    _ = require('underscore');

var AdminModel = module.exports = Class.extend({
    init: function (options) {
        options = options || {};
        this.name = options.name || null;
        this.model = options.model || null;
        this.form_type = options.form_type || forms.AdminForm;
        this.resource = options.resource || jest.MongooseResource(this.model);
        this.list = [];
        this.sortable = null;
        this.actions = [];
        this.is_single = false;
    },

    update: function (req, user, document_id, params, callback) {
        var self = this;
        var model = self.model;
        var form_type = self.form_type;
        var form = null;
        async.waterfall([
            function (cbk) {
                model.findById(document_id, function (err, document) {
                    cbk(err, document);
                });
            },
            function (document, cbk) {
                form = new form_type(req, {instance: document, data: params}, model);
                form.is_valid(function (err, valid) {
                    cbk(err || valid);
                });
            },
            function (cbk) {
                form.save(cbk);
            },
            function (document, cbk) {

                MongooseAdminAudit.logActivity(user, self.name, document._id, 'edit', null, function (err, auditLog) {
                    cbk(null, document);
                });
            }],
            callback);
    },

    count: function (callback) {
        if (this.is_single)
            this.model.count({}, callback);
        else
            callback(null, 1);
    }
});
