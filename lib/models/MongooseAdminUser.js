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
        module.superUser = new UserModel({username: username, passwordHash: crypt.encryptSync(password), is_superuser: true});
        this.findOne({'username': username}, function (err, adminUserData) {
            if (err) return callback(null, module.superUser);
            if (!adminUserData) {
                adminUserData = new UserModel();
                adminUserData.username = username;
            }
            adminUserData.passwordHash = crypt.encryptSync(password);
            adminUserData.is_superuser = true;
            return adminUserData.save(function (err, admin_user) {
                if (!err) module.superUser = admin_user;
                callback(null, module.superUser);
            });
        });
    };


    schema.statics.getByUsernamePassword = function (username, password, callback) {
        if (username === module.superUser.username && this.compareSync(password, module.superUser.passwordHash))
            return callback(module.superUser);

        this.findOne({'username': username}, function (err, admin_user) {
            if (err) throw err;
            if (!admin_user) return callback();
            if (!crypt.compareSync(password, admin_user.passwordHash)) return callback();
            // update last visit out-of-band
            admin_user.lastVisit = new Date();
            admin_user.save(function (err) { if (err) console.error('error updating admin user', err) });
            return callback(admin_user);
        });
    };


    schema.statics.compareSync = crypt.compareSync;
    schema.statics.encryptSync = crypt.encryptSync;

    schema.formage = {
        section: 'Administration',
        form: require('../forms/AdminUserForm'),
        list: ['username'],
        order_by: ['username']
    };

    var Model = mongoose.model('_FormageUser_', schema);
    return Model;
};

