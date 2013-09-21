'use strict';
module.exports = function (mongoose) {
    var crypto = require('crypto');

    //noinspection SpellCheckingInspection
    var salt = 'wherestheninja';

    var actions = ['view', 'delete', 'create', 'update', 'order'];

    var permissions_by_name = [];

    var toName = function (modelName, action) {
        return modelName + '_' + action
    };

    var crypt = {
        encryptSync: function (password) {
            if (!password) return password;
            return crypto.createHmac('sha1', salt).update(password).digest('hex');
        },
        compareSync: function (raw, hashed) {
            var hashed_pass = crypt.encryptSync(raw);
            return (!hashed && !raw) || hashed == hashed_pass;
        }
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
        return new MongooseAdminUser(sessionStore);
    };


    schema.statics.registerModelPermissions = function (modelName, permissions) {
        if (!permissions) permissions = actions;
        permissions.forEach(function (permission) {
            permissions_by_name.push(toName(modelName, permission));
        });
    };


    schema.statics.ensureExists = function (username, password, callback) {
        var model = this;
        model.findOne({'username': username}, function (err, adminUserData) {
            if (err) throw err;
            if (!adminUserData) {
                adminUserData = new model();
                adminUserData.username = username;
            }
            adminUserData.passwordHash = crypt.encryptSync(password);
            adminUserData.is_superuser = true;
            adminUserData.save(function (err, admin_user) {
                if (err) throw err;
                callback(null, admin_user);
            });
        });
    };


    schema.statics.getByUsernamePassword = function (username, password, callback) {
        var model = this;
        model.findOne({'username': username}, function (err, adminUserData) {
            if (err) return callback('Unable to get admin user');
            if (!adminUserData) return callback();
            if (!crypt.compareSync(password, adminUserData.passwordHash)) {
                return callback(null, null);
            }
            var admin_user = new MongooseAdminUser(adminUserData._doc);
            // update last visit
            model.update({_id: adminUserData._id}, {$set: {lastVisit: new Date()}}, function (err) { if (err) console.error('error updating admin user', err) });
            return callback(null, admin_user);
        });
    };

    return mongoose.model('_MongooseAdminUser', schema);
};
