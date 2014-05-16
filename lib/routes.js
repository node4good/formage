'use strict';
var _ = require('lodash-contrib'),
    path = require('path'),
    debug = require('debug')('formage'),
    socketio = require('socket.io');



function registerSockets(registry, cookieMiddleware) {
    function socketAuthenticate(handshake, callback) {
        debug("Trying to authenticate user by cookie");
        var mockReq = {headers: handshake.headers};
        cookieMiddleware(mockReq, null, _.noop);
        handshake.formageUser = _.walk.pluck(mockReq, '_FormageUserID')[0];
        callback(null, !_.isEmpty(handshake.formageUser));
    }

    function sockedConnected(socket) {
        var user = socket.handshake.formageUser;
        registry.userSockets[user.id] = socket;
        debug("User '%s' connected to socket %s", user.username, socket.id);

        socket.once('disconnect', function () {
            delete registry.userSockets[user.id];
            debug("User '%s' disconnected from socket", user.username);
        });

        _(registry.ref_fields).pluck('ref').unique('modelName').forEach(function (ref) {
            var modelName = ref.modelName;
            var queryFunc = (ref.search) ? ref.search : function (term) { return ref.$where('~JSON.stringify(this).search(/' + (_.regexEscape(term) || '.') + '/i);'); };
            debug("socket listening on", modelName);
            socket.on(modelName, function (term, cb) {
                queryFunc(term).limit(20).exec().then(function (objs) {
                    debug("socket %s getting %j", socket.id, objs);
                    var res = objs.map(function (obj) {return {id: obj.id, text: obj.toString()}; });
                    cb(res);
                }).end(console.log.bind(console));
            });
        });
    }

    registry.userSockets = {};
    var sio = registry.socketio;
    sio.set('browser client minification', true);
    sio.set('polling duration', 10);
    sio.set('log level', 0);
    sio.set('log colors', true);
    sio.set('heartbeat timeout', 20);
    sio.set('heartbeat interval', 9);
    sio.set('authorization', socketAuthenticate);
    if (debug.enabled) {
        sio.set('log level', 3);
        sio.set('browser client minification', false);
    }
    registry.fio = sio.of('/formage').on('connection', sockedConnected);
}


module.exports = function (express, rootApp, registry) {
    function serverGrabber(req, __, next) {
        /*
        this is MAJOR voodoo in order to get a handle on the http server
        we inject a middleware that will later be passed a `req` object
        and then deject this middleware from the stack
        */

        var thisI = req.app.stack.indexOf(this); // jshint ignore:line
        if (thisI !== -1) req.app.stack.splice(thisI, 1);
        if (registry.socketio) return next();
        registry.socketio = socketio.listen(req.connection.server);
        registerSockets(registry, rootCookieMiddleware);
        return next();
    }

    function formageErrorHandler(err, __, res, next) {
        console.error(err.stack);
        try {
            res.send(500, 'Something broke!');
        } catch (e) {
            console.error(e.stack);
            err = e;
        }
        next(err);
    }


    var app = express();
    rootApp.admin_app = app;
    registry.app = app;
    var controllers = require('./controllers')(registry);

    app.locals.pretty = true;
    app.locals.version = registry.version;
    var engine = debug.enabled ? require('jade').__express : CompiledEngine;
    app.engine('jade', engine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));

    var rootCookieMiddlewareIndex = _(rootApp.stack).pluck('handle').pluck('name').findIndex(/cookie/i);
    var rootSessionMiddlewareIndex = _(rootApp.stack).pluck('handle').pluck('name').findIndex(/session/i);

    var generalAuth = controllers.authMiddleware();
    var multipartyMiddleware = require('connect-multiparty')();
    var rootCookieMiddleware = rootApp.stack[rootCookieMiddlewareIndex];
    if (!rootCookieMiddleware) {
        rootCookieMiddleware = express.cookieParser('magical secret admin');
        app.use(rootCookieMiddleware);
    }
    if (!~rootSessionMiddlewareIndex) {
        app.use(express.cookieSession({ cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }, key: "formage_auth" }));
    }
    app.use(express.urlencoded());
    app.use(express.json());

    if (!_.isEmpty(registry.ref_fields)) {
        if (!registry.socketio) {
            app.use(serverGrabber);
        } else {
            registerSockets(registry, rootCookieMiddleware);
        }
    }
    app.use(formageErrorHandler);

    app.get('/', generalAuth, controllers.userPanelMiddleware, controllers.routes.index);
    app.get('/login', controllers.routes.login);
    app.post('/login', controllers.routes.postLogin);
    app.get('/logout', controllers.routes.logout);
    app.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    app.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    app.post('/model/:modelName/document/:documentId', [multipartyMiddleware, generalAuth, controllers.singleMiddleware], controllers.routes.documentPost);
    // JSON routes
    app.post('/json/model/:modelName/document/:documentId', [multipartyMiddleware, generalAuth], controllers.json_routes.upsertDocument);
    app.get('/json/model/:modelName/document/:documentId/dependencies', controllers.json_routes.checkDependencies);
    app.post('/json/model/:modelName/order', generalAuth, controllers.json_routes.orderDocuments);
    app.post('/json/model/:modelName/action/:actionId', generalAuth, controllers.json_routes.actionDocuments);

    rootApp.use(registry.root, app);
    debug('registered at path %s', app.route);

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
