'use strict';
var path = require('path'),
    _ = require('lodash');

try {
    exports.dblayer = module.parent.require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(exports.dblayer);
    exports.models = require('./models')(exports.dblayer);
} catch (e) {
    exports.models = {};
}
exports.adapter = require('./adapters/mongoose')(exports.models);
exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.fields.RefField = require('./forms/RefField')(exports);
exports.fields.ArrayField = require('./forms/ArrayField')(exports);
exports.AdminForm = require('./forms/AdminForm');


var init = require('./init');
exports.init = function () {
    return module.admin = init.apply(init, arguments);
};

exports.version = init.version;
exports.serve_static = init.serve_static;
//noinspection JSUnusedGlobalSymbols
exports.set_amazon_credentials = exports.fields.setAmazonCredentials;

exports.getModel = function (name) {return module.admin.models[name].model;};
