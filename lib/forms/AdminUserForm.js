"use strict";
var _ = require('lodash'),
    util = require('util'),
    formage = require('../index'),
    AdminForm = formage.AdminForm,
    widgets = formage.widgets,
    FormageFields = formage.fields,
    crypt = require('../../utils/crypt');

var AdminUserForm = module.exports = function AdminUserForm() {
    this.init.apply(this, arguments);
};
util.inherits(AdminUserForm, AdminForm);
_.assign(AdminUserForm.prototype, {
    init: function (request, options) {
        this.__name__ = 'AdminUserForm';
        AdminForm.prototype.init.call(this, request, options, formage.models.MongooseAdminUser);
    },


    get_fields: function () {
        AdminForm.prototype.get_fields.call(this);
        var fields = this.fields;
        delete fields['passwordHash'];
        this.fields['current_password'] = new FormageFields.StringField({widget: widgets.PasswordWidget, label: 'Current Password'});
        this.fields['password'] = new FormageFields.StringField({widget: widgets.PasswordWidget, label: 'New Password'});
        this.fields['password_again'] = new FormageFields.StringField({widget: widgets.PasswordWidget, label: 'Again'});
        //noinspection JSUnresolvedVariable
        this.fieldsets[0].fields = ['username', 'is_superuser', 'permissions', 'current_password', 'password', 'password_again'];
        return fields;
    },


    is_valid: function (callback) {
        var self = this;
        AdminForm.prototype.is_valid.call(this, function (err, result) {
            if (err || !result) return callback(err, result);
            var data = self.data || {current_password: '', password_again: 'x'};
            if (data.password) {
                if (crypt.compareSync(data.current_password, self.instance.passwordHash)) {
                    if (data.password != data.password_again) {
                        self.errors['password_again'] = self.fields['password_again'].errors = ['typed incorrectly'];
                    }
                } else {
                    self.errors['current_password'] = self.fields['current_password'].errors = ['Password incorrect'];
                }
            } else {
                delete data.password;
                delete data.current_password;
                delete data.password;
            }
            var hasErrors = Object.keys(self.errors).length;
            return callback(null, !hasErrors);
        });
    },


    actual_save: function (callback) {
        if (this.data.password)
            this.instance.passwordHash = crypt.encryptSync(this.data.password);
        AdminForm.prototype.actual_save.call(this, callback);
    }
});
