"use strict";
var debug = require('debug')('formage'),
    UserForm = require('../forms/UserForm');


module.exports = function (mongoose) {
    var actions = ['view', 'delete', 'create', 'update', 'order'];

    var toName = function (modelName, action) {
        return modelName + '_' + action;
    };

    var schema = new mongoose.Schema({
        username: {type: String, required: true, unique: true},
        passwordHash: {type: String, editable: false},
        is_superuser: {type: Boolean, 'default': false},
        permissions: [
            { type: String, 'enum': [] }
        ],
        lastVisit: {type: Date, 'default': Date.now, editable: false}
    }, {strict: true});


    // **** Methods ****
    schema.methods.toSessionStore = function () {
        if (this.doubleHash) return this.doubleHash;
        return String(this.id);
    };


    schema.methods.hasPermissions = function (modelName, action) {
        return this.is_superuser || ~this.permissions.indexOf(toName(modelName, action));
    };


    // **** Statics ****
    schema.statics.fromSessionStore = function (sessionStore) {
        return this.findById(sessionStore).exec();
    };


    schema.registerModelPermissions = function (modelName, permissions) {
        if (!permissions) permissions = actions;
        permissions.forEach(function (permission) {
            schema.paths.permissions.caster.options.enum.push(toName(modelName, permission));
            schema.tree.permissions[0].enum = schema.paths.permissions.caster.options.enum;
        });
    };


    schema.statics.getByUsernamePassword = function getByUsernamePassword(username, password) {
        return this.findOne({'username': username}).exec().then(function (admin_user) {
            if (!admin_user) return;
            if (!UserForm.compareSync(password, admin_user.passwordHash)) return;
            // update last visit out-of-band
            admin_user.lastVisit = new Date();
            admin_user.save(function (err) {
                if (err) debug('error updating admin user\n', err.stack || err);
            });
            return admin_user;
        });
    };


    schema.formage = {
        section: 'Administration',
        form: UserForm,
        list: ['username'],
        order_by: ['username']
    };

    return schema;
};
