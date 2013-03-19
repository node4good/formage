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

module.exports.statics_path = path.join(__dirname, 'public');
module.mongoose_module = require.main.require('mongoose');

module.exports.setAmazonCredentials = module.exports.fields.setAmazonCredentials;


module.exports.serve_static = function(app, express) {
    app.use('/', express.static(module.exports.statics_path));
};

module.exports.loadTypes = function (mongoose) {
    module.mongoose_module = module.exports.mongoose_module = module.exports.mongoose_module || mongoose;
    exports.types.loadTypes(mongoose);
};

module.exports.register_models = function (models) {
    module.models = module.exports.models = models;
    module.exports.forms.set_models(models);
};

module.exports.registerModel = function (name, model) {
    module.exports.forms.registerModel(name, model);
};
