var sys = require('sys'),
    mongoose = require('mongoose');

try
{
    bcrypt = require('bcrypt');
}
catch(e)
{
    bcrypt = require('./example/bcrypt_mock.js');
}


function MongooseAdminUser() {
    this.fields = {};

    var AdminUserData = new mongoose.Schema({
        username:{type:String, required:true, unique:true},
        passwordHash:{type:String, required:true}
    });
    mongoose.model('_MongooseAdminUser', AdminUserData);
};

MongooseAdminUser.prototype.toSessionStore = function() {
    var serialized = {};
    for (var i in this) {
        if (typeof i !== 'function' || typeof i !== 'object') {
            serialized[i] = this[i];
        }
    }

    return JSON.stringify(serialized);
};

MongooseAdminUser.fromSessionStore = function(sessionStore) {
    var sessionObject = JSON.parse(sessionStore);
    var adminUser = new MongooseAdminUser();
    for (var i in sessionObject) {
        if (sessionObject.hasOwnProperty(i)) {
            adminUser[i] = sessionObject[i];
        }
    }

    return adminUser;
};

MongooseAdminUser.ensureExists = function(username, password, onReady) {
    var adminUser = new MongooseAdminUser();
    var adminUserModel = mongoose.model('_MongooseAdminUser');

    adminUserModel.findOne({'username': username}, function(err, adminUserData) {
        if (err) {
            console.log('Unable to check if admin user exists because: ' + err);
            oReady('Unable to check if user exist', null);
        } else {
            if (adminUserData) {
                var salt = bcrypt.gen_salt_sync(10);
                adminUserData.passwordHash = bcrypt.encrypt_sync(password, salt);
            } else {
                adminUserData = new adminUserModel();
                adminUserData.username = username;
                var salt = bcrypt.gen_salt_sync(10);
                adminUserData.passwordHash = bcrypt.encrypt_sync(password, salt);
            }
            adminUserData.save(function(err) {
                if (err) {
                    console.log('Unable to create or update admin user because: ' + err);
                    onReady('Unable to create or update admin user', null);
                } else {
                    adminUser.fields = adminUserData;
                    onReady(null, adminUser);
                }
            });
        }
    });
};

MongooseAdminUser.getByUsernamePassword = function(username, password, onReady) {
    var adminUser = new MongooseAdminUser();
    var adminUserModel = mongoose.model('_MongooseAdminUser');

    adminUserModel.findOne({'username': username}, function(err, adminUserData) {
        if (err) {
            console.log('Unable to get admin user because: ' + err);
            onReady('Unable to get admin user', null);
        } else {
            if (adminUserData) {
                if (bcrypt.compare_sync(password, adminUserData.passwordHash)) {
                    adminUser.fields = adminUserData;
                    onReady(null, adminUser);
                } else {
                    onReady(null, null);
                }
            } else {
                onReady(null, null);
            }
        }
    });
};

exports.MongooseAdminUser = MongooseAdminUser;
