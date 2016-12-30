'use strict';
const _ = require('lodash-contrib'),
    path = require('path'),
    nodestrum = require('nodestrum'),
    debug = require('debug')('formage');


function registerSockets(registry, cookieMiddleware) {
    const sio = registry.socketio;
    if (!sio) return;
    registry.userSockets = {};
    sio.set('browser client minification', true);
//    sio.set('transports', registry.SOCKET_TRANSPORTS);
    sio.set('polling duration', 10);
    sio.set('log level', 0);
    sio.set('log colors', true);
    sio.set('heartbeat timeout', 20);
    sio.set('heartbeat interval', 9);

    if (debug.enabled) {
        sio.set('log level', 3);
        sio.set('browser client minification', false);
    }

    sio.set('authorization', function (handshake, callback) {
        debug("Trying to authenticate user by cookie");
        const mockReq = {headers: handshake.headers};
        cookieMiddleware(mockReq, null, _.noop);
        handshake.formageUser = mockReq.formageUser || (mockReq.session && mockReq.session.formageUser);
        callback(null, !_.isEmpty(handshake.formageUser));
    });

    registry.fio = sio.of('/formage');
    registry.fio.on('connection', function (socket) {
        const user = socket.handshake.formageUser;
        registry.userSockets[user.id] = socket;
        debug("User '%s' connected to socket %s", user.username, socket.id);

        socket.once('disconnect', function () {
            delete registry.userSockets[user.id];
            debug("User '%s' disconnected from socket", user.username);
        });

        _(registry.ref_fields).map('ref').unique('modelName').forEach(function (ref) {
            const modelName = ref.modelName;
            debug("socket listening on", modelName);
            socket.on(modelName, function (term, cb) {
                const queryP = (ref.search) ? ref.search(term) : ref.$where('~JSON.stringify(this).search(/' + (_.regexEscape(term) || '.') + '/i);').limit(5).exec();
                queryP.then(function (objs) {
                    debug("socket %s getting %j", socket.id, objs);
                    const res = objs.map(function (obj) {
                        return {id: obj.id, text: obj.toString()};
                    });
                    cb(res);
                }).catch(console.error.bind(console));
            });
        });
    });
}


module.exports = function (express, rootApp, registry) {
    const app = express();

    const engine = nodestrum.isDebug('views') ? require('jade').__express : CompiledEngine;
    app.locals.pretty = true;
    app.engine('jade', engine);
    app.set('view engine', 'jade');
    app.set('views', path.join(__dirname, '..', 'views'));
    if (!process.env.FORMAGE_DISABLE_DOMAINS) app.use(nodestrum.domain_wrapper_middleware);
    app.locals.version = registry.version;

    const controllers = require('./controllers')(registry);
    const generalAuth = controllers.authMiddleware();
    const multipartyMiddleware = require('connect-multiparty')();
    const rootCookieMiddleware = _(rootApp.stack).map('handle').find(function (handle) {
        return ~handle.name.search(/cookie/i);
    });
    registerSockets(registry, rootCookieMiddleware);

    app.use(express.urlencoded());
    app.use(express.json());
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
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        try {
            res.send(500, 'Something broke!');
        } catch (e) {
            console.error(e.stack);
            err = e;
        }
        next(err);
    });
    rootApp.use(registry.root, app);
    rootApp.admin_app = app;
    registry.app = app;

    debug('registered at path %s', app.route);

    return app;
};


// Voodoo to get Express working with compiled templates
const Templates = require('../generated/templates');
const CompiledEngine = function CompiledEngine(templatePath, locals, callback) {
    const name = path.basename(templatePath, '.jade');
    const ret = Templates[name](locals);
    process.nextTick(callback.bind(null, null, ret));
};
// End voodoo
