'use strict';

exports.widgets = require('./forms/widgets');
exports.fields = require('./forms/fields');
exports.AdminForm = require('./forms/AdminForm');
//noinspection JSUnusedGlobalSymbols
exports.set_amazon_credentials = exports.fields.setAmazonCredentials;

if (process.env['FORMAGE_DB_LAYER'] === 'jugglingdb') {
    exports.dblayer = module.parent.require("jugglingdb");
    exports.adapter = require('./adapters/jugglingdb')(exports.dblayer);
} else {
    exports.dblayer = module.parent.require('mongoose');
    require('formage-mongoose-types/mongoose-types').loadTypes_DI(exports.dblayer);
    exports.adapter = require('./adapters/mongoose')(exports.dblayer);
    exports.fields.RefField = require('./forms/RefField')(exports.fields.EnumField, exports.getModel, exports.dblayer.Schema.ObjectId);
    exports.fields.ArrayField = require('./forms/ArrayField')(exports.fields.BaseField);
}


var init = require('./init');
exports.serve_static = init.serve_static;
exports.init = function () {
    return module.admin = init.apply(init, arguments);
};
exports.getModel = function (name) {return module.admin.models[name].model;};
