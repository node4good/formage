"use strict";
var inherits = require('util').inherits,
    PasswordWidget = require('./widgets').PasswordWidget,
    StringField = require('./fields').StringField,
    AdminForm = require('./AdminForm'),
    crypt = require('../../utils/crypt');


/**
 *
 * @param request
 * @param options
 * @param MongooseAdminUser
 * @constructor
 */
function AdminUserForm(request, options, MongooseAdminUser) {
    this.init(request, options, MongooseAdminUser);
}
inherits(AdminUserForm, AdminForm);

AdminUserForm.prototype.init_fields = function () {
    AdminForm.prototype.init_fields.call(this);
    delete this.fields['passwordHash'];
    this.fields['current_password'] = new StringField({widget: PasswordWidget, label: 'Current Password'});
    this.fields['password'] = new StringField({widget: PasswordWidget, label: 'New Password'});
    this.fields['password_again'] = new StringField({widget: PasswordWidget, label: 'Again'});
    this.fieldsets[0].fields = ['username', 'is_superuser', 'permissions', 'current_password', 'password', 'password_again'];
};


AdminUserForm.prototype.is_valid = function (callback) {
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
};


AdminUserForm.prototype.actual_save = function (callback) {
    if (this.data.password)
        this.instance.passwordHash = crypt.encryptSync(this.data.password);
    AdminForm.prototype.actual_save.call(this, callback);
};

module.exports = AdminUserForm;
