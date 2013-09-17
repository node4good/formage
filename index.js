'use strict';
var path = require('path'),
    _ = require('lodash'),
    forms = require('./forms/forms'),
    fields = require('./forms/fields'),
    mongoose_types = require('formage-mongoose-types/mongoose-types');

exports.forms =
exports.init = require('./init');
exports.AdminForm = require('./AdminForm').AdminForm;

exports.version = exports.init.version;
exports.serve_static = exports.init.serve_static;
exports.loadTypes = mongoose_types.loadTypes;
exports.register_models = forms.set_models;
exports.set_amazon_credentials = fields.setAmazonCredentials;
