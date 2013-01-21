
module.exports = require('./admin.js');

module.exports.crypt = require('./crypt');
module.exports.forms = require('formage');
module.exports.AdminForm = require('./form').AdminForm;

module.exports.loadApi = require('./form').loadApi;
