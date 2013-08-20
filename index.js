'use strict';
var path = require('path'),
    _ = require('lodash'),
    mongoose_types = require('./forms/mongoose-types');

exports.forms = require('./forms');
exports.init = require('./init');
exports.AdminForm = require('./AdminForm').AdminForm;

exports.version = exports.init.version;
exports.serve_static = exports.init.serve_static;
exports.loadTypes = mongoose_types.loadTypes;
//noinspection JSUnusedGlobalSymbols
exports.register_models = exports.forms.forms.set_models;
exports.set_amazon_credentials = exports.forms.set_amazon_credentials;
