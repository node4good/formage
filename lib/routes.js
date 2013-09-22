'use strict';
var path = require('path'),
    nodestrum = require('nodestrum');

var Templates = require('../generated/templates');
var CompiledEngine = function (templatePath, locals, callback) {
    var name = path.basename(templatePath, '.jade');
    var ret = Templates[name](locals);
    callback(null, ret);
}


module.exports = function (admin, outer_app, express, root, version) {
    var controllers = require('./controllers')(admin);
    var app = express();

    if (nodestrum.isDebug('views')) {
        app.engine('jade', require('jade').__express);
        app.set('view engine', 'jade');
        app.set('views', path.join(__dirname, '..', 'views'));
    } else {
        // Voodoo to get Express working with compiled templates
        app.engine('jade', CompiledEngine);
        app.set('view engine', 'jade');
        app.set('views', path.join(__dirname, '..', 'views'));
        // End voodoo
    }

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

    if (root) {
        outer_app.use(root, app);
        outer_app.admin_app = app;
        app.admin_root = root;
    }
    console.log('\x1b[36mformage:\x1b[0m at path %s', app.admin_root);

    return app;
};
