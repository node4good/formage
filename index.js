'use strict';
if (!module.parent) console.error('Please don\'t call me directly.I am just the main app\'s minion.') || process.process.exit(1);

var MongooseAdmin = require('./mongoose-admin.js');
var path = require('path'),
    formage = require('formage'),
    paths = require('./register_paths');

exports.forms = formage;
exports.init = require('./init');
exports.crypt = require('./crypt');
exports.loadApi = require('./form').loadApi;
exports.AdminForm = require('./form').AdminForm;


module.exports.serve_static = function (app, express, root) {
    if (module._is_serving_static) return;
    module._is_serving_static = true;

    formage.serve_static(app, express);
    app.use('/' + root, express.static(path.join(__dirname, '/public')));
};


/**
 * Create the admin singleton object
 *
 * @param {String} dbUri
 * @param {Number} port
 *
 * @api public
 */
module.exports.createAdmin = function(app, options) {
    options = options || {};
    var root = '/' + options.root || '';
    console.log('\x1b[36mMongooseAdmin is listening at path: \x1b[0m %s', root);
    paths.registerPaths(MongooseAdmin, app, root);
    MongooseAdmin.singleton = new MongooseAdmin(app, root);
    return MongooseAdmin.singleton;
};

