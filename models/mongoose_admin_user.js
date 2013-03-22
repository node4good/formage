'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var mongoose = require.main.require('mongoose');
var crypto = require('crypto');

//noinspection SpellCheckingInspection
var salt = 'wherestheninja';

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


var AdminUserData = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    passwordHash: {type: String, editable: false},
    is_superuser: {type: Boolean, 'default': false},
    permissions: [
        {
            type: mongoose.Schema.ObjectId,
            ref: '_MongooseAdminPermission'
        }
    ]
}, {strict: true});
mongoose.model('_MongooseAdminUser', AdminUserData);


function MongooseAdminUser(data) {
    this.fields = data;
}


MongooseAdminUser.prototype.toSessionStore = function () {
    return this.fields;
};

MongooseAdminUser.fromSessionStore = function (sessionStore) {
    var admin_user = new MongooseAdminUser(sessionStore);
    return admin_user;
};

MongooseAdminUser.ensureExists = function (username, password, callback) {
    var AdminUserModel = mongoose.model('_MongooseAdminUser');

    AdminUserModel.findOne({'username': username}, function (err, adminUserData) {
        if (err) return callback(err);
        if (!adminUserData) {
            adminUserData = new AdminUserModel();
            adminUserData.username = username;
        }
        adminUserData.passwordHash = crypt.encryptSync(password);
        adminUserData.is_superuser = true;
        adminUserData.save(function (err) {
            if (err) {
                console.log('Unable to create or update admin user because: ' + err);
                callback('Unable to create or update admin user', null);
            } else {
                var admin_user = new MongooseAdminUser(adminUserData._doc);
                callback(null, admin_user);
            }
        });
    });
};

MongooseAdminUser.getByUsernamePassword = function (username, password, callback) {
    mongoose.model('_MongooseAdminUser').findOne({'username': username}, function (err, adminUserData) {
        if (err) return callback('Unable to get admin user');
        if (!adminUserData) return callback();
        if (!crypt.compareSync(password, adminUserData.passwordHash)) {
            return callback(null, null);
        }
        var admin_user = new MongooseAdminUser(adminUserData._doc);
        return callback(null, admin_user);
    });
};

exports.MongooseAdminUser = MongooseAdminUser;
