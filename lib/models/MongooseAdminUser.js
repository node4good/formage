"use strict";
var _ = require('lodash-contrib'),
    crypto = require('crypto'),
    Promise = require('mpromise'),
    inherits = require('util').inherits,
    StringField = require('../forms/fields').StringField,
    AdminForm = require('../forms/AdminForm');


var salt = 'wherestheninja';
function encryptSync(password) {
    if (!password) return password;
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
}
function compareSync(raw, hashed) {
    var hashed_pass = encryptSync(raw);
    return (!hashed && !raw) || hashed == hashed_pass;
}


module.exports = function (mongoose) {
    var actions = ['view', 'delete', 'create', 'update', 'order'];

    var permissions_by_name = [];

    var toName = function (modelName, action) {
        return modelName + '_' + action
    };

    var schema = new mongoose.Schema({
        username: {type: String, required: true, unique: true},
        passwordHash: {type: String, editable: false},
        is_superuser: {type: Boolean, 'default': false},
        permissions: [
            { type: String, enum: permissions_by_name }
        ],
        lastVisit: {type: Date, 'default': Date.now}
    }, {strict: true});


    // **** Methods ****
    schema.methods.toSessionStore = function () {
        return this.toObject();
    };

    schema.methods.hasPermissions = function (modelName, action) {
        return this.is_superuser || ~this.permissions.indexOf(toName(modelName, action));
    };


    // **** Statics ****
    schema.statics.fromSessionStore = function (sessionStore) {
        return new this(sessionStore);
    };


    schema.statics.registerModelPermissions = function (modelName, permissions) {
        if (!permissions) permissions = actions;
        permissions.forEach(function (permission) {
            permissions_by_name.push(toName(modelName, permission));
        });
    };


    schema.statics.ensureExists = function (username, password, callback) {
        var UserModel = this;
        module.superUser = new UserModel({username: username, passwordHash: encryptSync(password), is_superuser: true});
        this.findOne({'username': username}, function (err, adminUserData) {
            if (err) return callback(null, module.superUser);
            if (!adminUserData) {
                adminUserData = new UserModel();
                adminUserData.username = username;
            }
            adminUserData.passwordHash = encryptSync(password);
            adminUserData.is_superuser = true;
            return adminUserData.save(function (err, admin_user) {
                if (!err) module.superUser = admin_user;
                callback(null, module.superUser);
            });
        });
    };


    schema.statics.getByUsernamePassword = function (username, password, callback) {
        if (username === module.superUser.username && compareSync(password, module.superUser.passwordHash))
            return callback(module.superUser);

        this.findOne({'username': username}, function (err, admin_user) {
            if (err) throw err;
            if (!admin_user) return callback();
            if (!compareSync(password, admin_user.passwordHash)) return callback();
            // update last visit out-of-band
            admin_user.lastVisit = new Date();
            admin_user.save(function (err) { if (err) console.error('error updating admin user', err) });
            return callback(admin_user);
        });
    };


    schema.formage = {
        section: 'Administration',
        form: AdminUserForm,
        list: ['username'],
        order_by: ['username']
    };

    var Model = mongoose.model('_FormageUser_', schema);
    return Model;
};


/**
 *
 * @constructor
 */
function AdminUserForm() {
    this.init.apply(this, arguments);
}
inherits(AdminUserForm, AdminForm);


AdminUserForm.prototype.init_fields = function () {
    AdminForm.prototype.init_fields.call(this);
    delete this.fields['passwordHash'];
    this.fields['current_password'] = new StringField({widget: 'PasswordWidget', label: 'Current Password'});
    this.fields['password'] = new StringField({widget: 'PasswordWidget', label: 'New Password'});
    this.fields['password_again'] = new StringField({widget: 'PasswordWidget', label: 'Again'});
};


AdminUserForm.prototype.validate = function () {
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

        if (!self.data.password) {
            self.errors['password'] = self.fields['password'].errors = ['Missing password'];
            return p.fulfill(false);
        }

        if (!compareSync(self.data.current_password, self.instance.passwordHash)) {
            self.errors['current_password'] = self.fields['current_password'].errors = ['Password incorrect'];
            return p.fulfill(false);
        }

        if (self.data.password != self.data.password_again) {
            self.errors['password_again'] = self.fields['password_again'].errors = ['typed incorrectly'];
            return p.fulfill(false);
        }

        return p.fulfill(true);
    });
    return p;
};


AdminUserForm.prototype.save = function (callback) {
    var self = this;
    return this.validate().then(function (isValid) {
        if (!isValid) throw new Error('Not Valid');
        if (self.data.password)
            self.instance.passwordHash = encryptSync(self.data.password);
        return AdminForm.prototype.save.call(self, callback);
    })
};
