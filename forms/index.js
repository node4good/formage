'use strict';
if (!module.parent) {
    console.log("Do not call formage directly. require()-ing is required.");
    process.exit(1);
}

var path = require('path');

module.exports.common = require('./common');
module.exports.types = require('./mongoose-types');
module.exports.forms = require('./forms');
module.exports.fields = require('./fields');
module.exports.widgets = require('./widgets');

module.exports.setAmazonCredentials = module.exports.fields.setAmazonCredentials;


module.exports.serve_static = function() {
    console.log("forms.serve_static is deprecated");
};

module.exports.loadTypes = function (mongoose) {
    exports.types.loadTypes(mongoose);
};

module.exports.registerModel = function (name, model) {
    module.exports.forms.registerModel(name, model);
};
