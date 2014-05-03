'use strict';
var _ = require('lodash-contrib'),
    crypto = require('crypto'),
    Promise = require('mpromise'),
    inherits = require('util').inherits,
    StringField = require('../forms/fields').StringField,
    AdminForm = require('../forms/AdminForm');


var salt = 'wherestheninja';



/**
 *
 * @constructor
 */
function UserForm() {
    this.init.apply(this, arguments);
}
inherits(UserForm, AdminForm);

UserForm.encryptSync = function encryptSync(password) {
    if (!password) return password;
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};
UserForm.compareSync = function compareSync(raw, hashed) {
    var hashed_pass = UserForm.encryptSync(raw);
    return (!hashed && !raw) || hashed == hashed_pass;
};


UserForm.prototype.init_fields = function () {
    AdminForm.prototype.init_fields.call(this);
    delete this.fields['passwordHash'];
    delete this.fields['password'];
    delete this.fields['password_again'];

    this.fields['password'] = new StringField({widget: 'PasswordWidget', label: 'New Password', name: 'password'});
    this.fields['password_again'] = new StringField({widget: 'PasswordWidget', label: 'New Password Again', name: 'password_again'});
};


UserForm.prototype.validate = function () {
    var self = this;
    if (self.errors) return Promise.fulfilled(_.isEmpty(self.errors));

    return AdminForm.prototype.validate.call(this).then(function (isValid) {
        if (!isValid) {
            return false;
        }

        if (self.instance.isNew) {
            if (_.isEmpty(self.data.password)) {
                self.errors['password'] = self.fields['password'].errors = ['Missing password'];
                return false;
            }
        } else {
            if (_.isEmpty(self.data.password) && _.isEmpty(self.data.password_again)) {
                return true;
            }
        }

        if (self.data.password != self.data.password_again) {
            self.errors['password_again'] = self.fields['password_again'].errors = ['Password do not match'];
            return false;
        }

        return true;
    });
};


UserForm.prototype.save = function (callback) {
    var self = this;
    return this.validate().then(function (isValid) {
        if (!isValid) throw new Error('Not Valid');
        if (self.data.password) self.instance.passwordHash = UserForm.encryptSync(self.data.password);
        return AdminForm.prototype.save.call(self, callback);
    });
};


module.exports = UserForm;
