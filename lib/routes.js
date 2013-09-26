'use strict';
var path = require('path'),
    JadeForExpress = require('jade').__express,
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


module.exports = function (rootApp, express, root, version, controllers) {

    var app = express();

    app.engine('jade', nodestrum.isDebug('views') ? JadeForExpress : CompiledEngine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));

    app.use(nodestrum.domain_wrapper_middleware);
    app.locals.version = version;

    app.get('/', controllers.authMiddleware(), controllers.userPanelMiddleware, controllers.routes.index);
    app.get('/login', controllers.routes.login);
    app.post('/login', controllers.routes.postLogin);
    app.get('/logout', controllers.routes.logout);
    app.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    app.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    app.post('/model/:modelName/document/:documentId', [controllers.authMiddleware(), controllers.singleMiddleware], controllers.routes.documentPost);

    app.post('/json/dependencies', controllers.json_routes.checkDependencies);
    app.get('/json/documents', controllers.json_routes.documents);
    app.post('/json/model/:collectionName/order', controllers.json_routes.orderDocuments);
    app.post('/json/model/:collectionName/action/:actionId', controllers.json_routes.actionDocuments);
    app.post('/json/model/:collectionName/document', controllers.json_routes.createDocument);
    app.put('/json/model/:collectionName/document', controllers.json_routes.updateDocument);
    app.delete('/json/model/:collectionName/document', controllers.json_routes.deleteDocument);
    app.get('/json/model/:collectionName/linkedDocumentsList', controllers.json_routes.linkedDocumentsList);

    rootApp.use(root, app);
    rootApp.admin_app = app;
    app.admin_root = root;

    log('registered at path %s', app.admin_root);

    return app;
};
