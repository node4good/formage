'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var async = require('async'),
    mongoose = require.main.require('mongoose'),
    _ = require('underscore');

var Schema = new mongoose.Schema({
    name : {type:String, required:true}
});

Schema.methods.toString = function(){
    return this.name;
};

exports.model = mongoose.model('_MongooseAdminPermission', Schema);

var permodel_permission = ['view','delete','create','update','order'];

var permissions_by_name = {};

exports.registerModel = function (modelName, permissions, callback) {
    if (typeof(permissions) === 'function' || typeof(permissions) === 'undefined') {
        callback = permissions;
        permissions = permodel_permission;
    }
    async.forEach(permissions, function (action, callback) {
        exports.model.update({name: modelName + '_' + action}, {$set: {name: modelName + '_' + action}}, {upsert: true}, function (err) {
            if(err)
                callback(err);
            else
                exports.model.findOne({name: modelName + '_' + action}, function (err, doc) {
                if(doc)
                    permissions_by_name[doc.name] = doc.id;
                callback(err);
            });
        });
    },callback||function(){});
};

exports.getPermission = function (modelName, action) {
    return permissions_by_name[modelName + '_' + action];
};

exports.hasPermissions = function (user, modelName, action) {
    if(user.fields)
        user = user.fields;
    return user.is_superuser || _.indexOf(user.permissions,exports.getPermission(modelName,action)) > -1;
};
