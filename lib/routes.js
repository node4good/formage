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
            socket.on('selected', function (data, callback) {
                if (!ref.selected) return callback();
                ref.selected(data).then(
                    function (obj) {
                        var data = (obj && obj._id) ? obj._id.toString() : null;
                        debug("socket %s sending %j", socket.id, data);
                        callback(data);
                    }
                ).end(
                    function (err) {
                        debug("socket CB failed");
                        debug(err.stack);
                        callback();
                    }
                );
            });
        });
    });
}


module.exports = function (rootApp, registry) {
    var app = createExpressSubApp(rootApp, registry);
    rootApp.mountExpress = rootApp.mountExpress || rootApp.use;
    rootApp.mountExpress(registry.root, app);
    registry.app = rootApp.admin_app = app;

    var controllers = require('./controllers')(registry);
    var generalAuth = controllers.authMiddleware();

    app.get('/', generalAuth, controllers.userPanelMiddleware, controllers.routes.index);
    app.get('/login', controllers.routes.login);
    app.post('/login', controllers.routes.postLogin);
    app.get('/logout', controllers.routes.logout);
    app.get('/model/:modelName', controllers.authMiddleware('view'), controllers.userPanelMiddleware, controllers.routes.model);
    app.get('/model/:modelName/document/:documentId', controllers.authMiddleware('update'), controllers.routes.document);
    app.get('/model/:modelName/inline/:documentId', controllers.authMiddleware('update'), controllers.routes.documentInline);
    app.post('/model/:modelName/document/:documentId', generalAuth, controllers.singleMiddleware, controllers.routes.documentPost);
    // JSON routes
    app.post('/json/model/:modelName/document/:documentId', generalAuth, controllers.json_routes.upsertDocument);
    app.get('/json/model/:modelName/document/:documentId/dependencies', controllers.json_routes.checkDependencies);
    app.post('/json/model/:modelName/order', generalAuth, controllers.json_routes.orderDocuments);
    app.post('/json/model/:modelName/action/:actionId', generalAuth, controllers.json_routes.actionDocuments);

    debug('registered at path %s', app.mountpath || app.route);
    return app;
};


// Voodoo to get Express working with compiled templates
var Templates = require('../generated/templates');
var CompiledEngine = function CompiledEngine(templatePath, locals, callback) {
    var name = path.basename(templatePath, '.jade');
    var ret = Templates[name](locals);
    setImmediate(callback.bind(null, null, ret));
};
// End voodoo


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

    var cookieMiddleware = _(rootApp.stack).pluck('handle').find(function (handle) {
        return ~handle.name.search(/cookie/i);
    });
    if (!cookieMiddleware) {
        cookieMiddleware = require('cookie-session')({keys: [registry.title + '1234!@#$contact'], maxAge: 14 * 24 * 60 * 60});
        app.use(cookieMiddleware);
    }
    registerSockets(registry, cookieMiddleware);

    app.use('/vendor/ckeditor', statics(ckeditorPath));
    app.use(statics(path.join(__dirname, '..', 'assets')));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(multiparty());
    app.use(function (err, req, res, next) {
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
    return app;
}
