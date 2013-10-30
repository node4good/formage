'use strict';
var path = require('path'),
    nodestrum = require('nodestrum'),
    log = nodestrum.logFor('formage');

// Voodoo to get Express working with compiled templates
var Templates = require('../generated/templates');
var CompiledEngine = function CompiledEngine(templatePath, locals, callback) {
    var name = path.basename(templatePath, '.jade');
    var ret = Templates[name](locals);
    callback(null, ret);
};
// End voodoo

module.exports = function (express, rootApp, admin) {

    var app = express();

    var controllers = require('./controllers')(admin);

    app.engine('jade', nodestrum.isDebug('views') ? require('jade').__express : CompiledEngine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));

    app.use(nodestrum.domain_wrapper_middleware);
    app.locals.version = admin.version;

    app.get('/', controllers.authMiddleware(), controllers.userPanelMiddleware, controllers.routes.index);
    app.get('/login', controllers.routes.login);
    app.post('/login', controllers.routes.postLogin);
    app.get('/logout', controllers.routes.logout);
    app.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    app.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    app.post('/model/:modelName/document/:documentId', [controllers.authMiddleware(), controllers.singleMiddleware], controllers.routes.documentPost);

    app.post('/json/model/:modelName/document/:documentId', controllers.authMiddleware(), controllers.json_routes.upsertDocument);
    app.get('/json/model/:modelName/document/:documentId/dependencies', controllers.json_routes.checkDependencies);
    app.delete('/json/model/:collectionName/document/:documentId', controllers.authMiddleware(), controllers.json_routes.deleteDocument);
    app.post('/json/model/:collectionName/order', controllers.authMiddleware(), controllers.json_routes.orderDocuments);
    app.post('/json/model/:collectionName/action/:actionId', controllers.authMiddleware(), controllers.json_routes.actionDocuments);

    app.admin_root = admin.options.root;
    rootApp.use(app.admin_root, app);
    rootApp.admin_app = app;
    admin.app = app;

    log('registered at path %s', app.admin_root);

    return app;
};
