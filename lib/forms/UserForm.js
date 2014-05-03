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
    this.fields['current_password'] = new StringField({widget: 'PasswordWidget', label: 'Current Password', name: 'current_password'});
    this.fields['password'] = new StringField({widget: 'PasswordWidget', label: 'New Password', name: 'password'});
    this.fields['password_again'] = new StringField({widget: 'PasswordWidget', label: 'Again', name: 'password_again'});
};


UserForm.prototype.validate = function () {
    var self = this;
    var p = new Promise();
    if (self.errors) {
        p.fulfill(_.isEmpty(self.errors));
        return p;
    }

    AdminForm.prototype.validate.call(this).then(function (isValid) {
        if (!isValid) {
            return p.fulfill(false);
        }

        if (_([self.data.current_password, self.data.current_password, self.data.password_again]).compact().isEmpty()) {
            return p.fulfill(true);
        }

        if (!self.instance.isNew) {
            if (!self.data.current_password) {
                self.errors['current_password'] = self.fields['current_password'].errors = ['Missing password'];
                return p.fulfill(false);
            }

            if (!UserForm.compareSync(self.data.current_password, self.instance.passwordHash)) {
                self.errors['current_password'] = self.fields['current_password'].errors = ['Password incorrect'];
                return p.fulfill(false);
            }
        }

        if (self.data.password != self.data.password_again) {
            self.errors['password_again'] = self.fields['password_again'].errors = ['typed incorrectly'];
            return p.fulfill(false);
        }

        return p.fulfill(true);
    });
    return p;
};


UserForm.prototype.save = function (callback) {
    var self = this;
    return this.validate().then(function (isValid) {
        if (!isValid) throw new Error('Not Valid');
        if (self.data.password)
            self.instance.passwordHash = UserForm.encryptSync(self.data.password);
        return AdminForm.prototype.save.call(self, callback);
    });
};

module.exports = UserForm;
