var salt = 'wherestheninja';
var crypto = require('crypto');
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
        return new model(sessionStore);
    };


    schema.statics.registerModelPermissions = function (modelName, permissions) {
        if (!permissions) permissions = actions;
        permissions.forEach(function (permission) {
            permissions_by_name.push(toName(modelName, permission));
        });
    };


    schema.statics.ensureExists = function (username, password, callback) {
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
        model.findOne({'username': username}, function (err, admin_user) {
            if (err) throw err;
            if (!admin_user) return callback();
            if (!model.compareSync(password, admin_user.passwordHash)) return callback();
            // update last visit out-of-band
            admin_user.lastVisit = new Date();
            admin_user.save(function (err) { if (err) console.error('error updating admin user', err) });
            return callback(admin_user);
        });
    };


    schema.statics.compareSync = crypt.compareSync;
    schema.statics.encryptSync = crypt.encryptSync;


    var model = mongoose.model('_FormageUser_', schema);
    model.formage = {
        section: 'Administration',
        form: require('../forms/AdminUserForm'),
        list: ['username'],
        order_by: ['username']
    };
    return model;
};

