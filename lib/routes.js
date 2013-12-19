'use strict';
var path = require('path'),
    nodestrum = require('nodestrum'),
    log = nodestrum.logFor('formage');


module.exports = function (express, rootApp, registry) {
    var app = express();

    var engine = nodestrum.isDebug('views') ? require('jade').__express : CompiledEngine;
    app.locals.pretty = true;
    app.engine('jade', engine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));
    if (!process.env.FORMAGE_DISABLE_DOMAINS) app.use(nodestrum.domain_wrapper_middleware);
    app.locals.version = registry.version;

    var controllers = require('./controllers')(registry);
    var connect_multiparty = require('connect-multiparty')();
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());
    app.get('/', controllers.authMiddleware(), controllers.userPanelMiddleware, controllers.routes.index);
    app.get('/login', controllers.routes.login);
    app.post('/login', controllers.routes.postLogin);
    app.get('/logout', controllers.routes.logout);
    app.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    app.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    app.post('/model/:modelName/document/:documentId', [connect_multiparty, controllers.authMiddleware(), controllers.singleMiddleware], controllers.routes.documentPost);
    // JSON routes
    app.post('/json/model/:modelName/document/:documentId', [connect_multiparty, controllers.authMiddleware()], controllers.json_routes.upsertDocument);
    app.get('/json/model/:modelName/document/:documentId/dependencies', controllers.json_routes.checkDependencies);
    app.post('/json/model/:modelName/order', controllers.authMiddleware(), controllers.json_routes.orderDocuments);
    app.post('/json/model/:modelName/action/:actionId', controllers.authMiddleware(), controllers.json_routes.actionDocuments);
    app.use(function(err, req, res, next){
        console.error(err.stack);
        try{
            res.send(500, 'Something broke!');
        } catch (e) {
            console.error(e.stack);
        }
    });
    rootApp.use(registry.root, app);
    rootApp.admin_app = app;
    registry.app = app;

    log('registered at path %s', app.route);

    return app;
};


// Voodoo to get Express working with compiled templates
var Templates = require('../generated/templates');
var CompiledEngine = function CompiledEngine(templatePath, locals, callback) {
    var name = path.basename(templatePath, '.jade');
    var ret = Templates[name](locals);
    process.nextTick(callback.bind(null, null, ret));
};
// End voodoo
