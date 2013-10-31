'use strict';

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.AdminForm = require('./forms/AdminForm');
//noinspection JSUnusedGlobalSymbols
exports.set_amazon_credentials = exports.fields.setAmazonCredentials;

var init = require('./init');
exports.serve_static = init.serve_static;
exports.init = function (rootApp, express, models, options) {
    return module.registry = init(rootApp, express, models, exports.adapter, options);
};
exports.getModel = function (name) {return module.registry.models[name].model;};

if (process.env['FORMAGE_DB_LAYER'] === 'jugglingdb') {
    var jugglingdb = module.parent.require("jugglingdb");
    exports.adapter = require('./adapters/jugglingdb')(jugglingdb);
} else {
    var mongoose = module.parent.require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(mongoose);
    exports.adapter = require('./adapters/mongoose')(mongoose);
    exports.fields.RefField = require('./forms/RefField')(exports.fields.EnumField, exports.getModel, mongoose.Schema.ObjectId);
    exports.fields.ArrayField = require('./forms/ArrayField')(exports.fields.BaseField);
}
