'use strict';
var path = require('path'),
    _ = require('lodash'),
    fields = require('./forms/fields'),
    mongoose_types = require('formage-mongoose-types/mongoose-types'),
    mongoose = module.parent.require('mongoose'),
    init = require('./init');

exports.forms = require('./forms/forms');
exports.widgets = require('./forms/widgets');
exports.fields = fields;
exports.AdminForm = require('./AdminForm').AdminForm;
exports.init = function () {
    return module.admin = init.apply(init, arguments);
};

exports.version = init.version;
exports.serve_static = init.serve_static;
exports.loadTypes = mongoose_types.loadTypes;
//noinspection JSUnusedGlobalSymbols
exports.set_amazon_credentials = fields.setAmazonCredentials;

exports.getMongoose = function () {return mongoose};
exports.getModel = function (name) {return module.admin.getModelConfig(name).model;};
