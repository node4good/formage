'use strict';
var _ = require('lodash-contrib'),
    path = require('path'),
    multiparty = require('connect-multiparty'),
    bodyParser = require('body-parser'),
    statics = require('serve-static'),
    ckeditorPath = require('node-ckeditor'),
    debug = require('debug')('formage');


function registerSockets(registry, cookieMiddleware) { // jshint ignore:line
    var sio = registry.socketio;
    if (!sio) return;
    registry.userSockets = {};

    sio.set('authorization', function (request, callback) {
        debug("Trying to authenticate user by cookie");
        var mockReq = {headers: request.headers};
        cookieMiddleware(mockReq, null, _.noop);
        request.formageUser = _.walk.pluck(mockReq, 'formageUser')[0];
        callback(null, !_.isEmpty(request.formageUser));
    });

    registry.fio = sio.of('/formage');
    registry.fio.on('connection', function (socket) {
        var user = socket.conn.request.formageUser;
        registry.userSockets[user.id] = socket;
        debug("User '%s' connected to socket %s", user.username, socket.id);

        socket.once('disconnect', function () {
            delete registry.userSockets[user.id];
            debug("User '%s' disconnected from socket", user.username);
        });

        _(registry.ref_fields).pluck('ref').unique('modelName').forEach(function (ref) {
            var modelName = ref.modelName;
            debug("socket listening on", modelName);
            socket.on(modelName, function (term, cb) {
                var queryP = (ref.search) ? ref.search(term) : ref.$where('~JSON.stringify(this).search(/' + (_.regexEscape(term) || '.') + '/i);').limit(5).exec();
                queryP.then(
                    function (objs) {
                        debug("socket %s getting %j", socket.id, objs);
                        cb(objs || []);
                    }
                ).end(
                    function (err) {
                        debug(err.stack);
                        cb([]);
                    }
                );
            });
        });
    });
}


module.exports = function (rootApp, registry) {
    var adminRouter = createExpressSubApp(rootApp, registry);
    if (rootApp.mountExpress)
        rootApp.mountExpress(registry.root, adminRouter.app);
    else
        rootApp.use(registry.root, adminRouter.app);
    registry.adminRouter = rootApp.adminRouter = adminRouter;
    registry.app = rootApp.admin_app = adminRouter.app;
    debug('registered at path %s', adminRouter.app.mountpath || adminRouter.route);

    var controllers = require('./controllers')(registry);
    var generalAuth = controllers.authMiddleware();
    adminRouter.get('/', generalAuth, controllers.userPanelMiddleware, controllers.routes.index);
    adminRouter.get('/login', controllers.routes.login);
    adminRouter.post('/login', controllers.routes.postLogin);
    adminRouter.get('/logout', controllers.routes.logout);
    adminRouter.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    adminRouter.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    adminRouter.get('/model/:modelName/inline/:documentId', controllers.authMiddleware('update'), controllers.routes.documentInline);
    adminRouter.post('/model/:modelName/document/:documentId', generalAuth, controllers.singleMiddleware, controllers.routes.documentPost);
    // JSON routes
    adminRouter.post('/json/model/:modelName/document/:documentId', generalAuth, controllers.json_routes.upsertDocument);
    adminRouter.get('/json/model/:modelName/document/:documentId/dependencies', controllers.json_routes.checkDependencies);
    adminRouter.post('/json/model/:modelName/order', generalAuth, controllers.json_routes.orderDocuments);
    adminRouter.post('/json/model/:modelName/action/:actionId', generalAuth, controllers.json_routes.actionDocuments);
    return adminRouter;
};


function createExpressSubApp(rootApp, registry) {
    var express = require('express');
    var app = express();
    var viewEngine = CompiledEngine;
    if (debug.enabled) try {
        viewEngine = require('jade').__express;
    } catch (ex) {}
    app.engine('jade', viewEngine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));
    app.locals.pretty = true;
    app.locals.version = registry.version;

    var adminRouter = express.Router();
    adminRouter.app = app;
    adminRouter.use('/vendor/ckeditor', statics(ckeditorPath));
    adminRouter.use(statics(path.join(__dirname, '..', 'assets')));
    var cookieMiddleware = _(rootApp.stack).pluck('handle').find(function (handle) {
        return ~handle.name.search(/cookie/i);
    });
    if (!cookieMiddleware) {
        cookieMiddleware = require('cookie-session')({keys: [registry.title + '1234!@#$contact'], maxAge: 14 * 24 * 60 * 60});
        adminRouter.use(cookieMiddleware);
    }
    registerSockets(registry, cookieMiddleware);
    adminRouter.use(bodyParser.urlencoded({extended: true}));
    adminRouter.use(bodyParser.json());
    adminRouter.use(multiparty());
    adminRouter.use(function formageRouterErrorHandler(err, req, res, next) {
        debug(err.stack);
        try {
            return res.send(500, err);
        } catch (e) {
            debug('cant send 500');
            debug(e.stack);
            err = e;
        }
        next(err);
    });
    return adminRouter;
}


// Voodoo to get Express working with compiled templates
var Templates = require('../generated/templates');
var CompiledEngine = function CompiledEngine(templatePath, locals, callback) {
    var name = path.basename(templatePath, '.jade');
    var ret = Templates[name](locals);
    setImmediate(callback.bind(null, null, ret));
};
// End voodoo
