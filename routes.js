'use strict';
var Url = require('url'),
    querystring = require('querystring'),
    async = require('async'),
    _ = require('lodash'),
    forms = require('./forms').forms,
    permissions = require('./models/permissions'),
    AdminForm = require('./AdminForm').AdminForm,
    path = require('path');

var MongooseAdmin;


var json_routes = {
    documents: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) return res.json(401);

        var query = querystring.parse(Url.parse(req.url).query);
        return MongooseAdmin.singleton.modelCounts(query.collection, function (err, totalCount) {
            if (err) return res.json(500);

            return MongooseAdmin.singleton.listModelDocuments(query.collection, query.start, query.count, function (err, documents) {
                if (err) return res.json(500);

                return res.json({
                    totalCount: totalCount,
                    documents: documents
                });
            });
        });
    },


    checkDependencies: function (req, res) {
        var name = req.body.model,
            id = req.body.id;

        var dependencies = require('./dependencies');
        dependencies.check(MongooseAdmin.singleton.models, name, id, function (err, results) {
            var json = _.map(results, function (result) {
                return result.name || result.title || result.toString();
            });
            res.json(json, 200);
        });
    },


    createDocument: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.createDocument(req, admin_user, req.params.collectionName, req.body, function (err) {
            if (err) {
                if (typeof(err) == 'object') {
                    res.json(err, 400);
                }
                else {
                    res.writeHead(500);
                    res.end();
                }
            } else {
                res.writeHead(201, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    },


    updateDocument: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.updateDocument(req, admin_user, req.params.collectionName, req.body._id, req.body, function (err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    },

    orderDocuments: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.orderDocuments(admin_user, req.params.collectionName, req.body, function (err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    },


    actionDocuments: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) return res.send(401);

        /** @namespace req.params.actionId */
        return MongooseAdmin.singleton.actionDocuments(admin_user, req.params.collectionName, req.params.actionId, req.body, function (err) {
            if (err) return res.json(422, {error: err.message});
            return res.json({"collection": req.params.collectionName});
        });
    },


    deleteDocument: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }

        /** @namespace req.query.document_id */
        MongooseAdmin.singleton.deleteDocument(admin_user, req.params.collectionName, req.query.document_id, function (err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    },

    linkedDocumentsList: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.getModel(req.params.collectionName, function (err, model, fields, options) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                MongooseAdmin.singleton.listModelDocuments(req.params.collectionName, 0, 500, function (err, documents) {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    } else {
                        var result = [];
                        documents.forEach(function (document) {
                            var d = {'_id': document._id};
                            options.list.forEach(function (listField) {
                                d[listField] = document[listField];
                            });
                            result.push(d);
                        });

                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.write(JSON.stringify(result));
                        res.end();
                    }
                });
            }
        });
    }
};


var singleMiddleware = function (req, res, next) {
    var model = MongooseAdmin.singleton.models[req.params.modelName].model;
    if (req.params.documentId === 'single')
        model.findOne({}, function(err, doc) {if (err) throw err; req.params.theDoc = doc; next()});
    else
        next();
};


function renderForm(res, form, model, allow_delete, clone, dialog) {
    if (clone)
        form.exclude.push('id');

    form.render_ready(function (err) {
        if (err) return res.redirect('/error');

        var subCollections = model.options.subCollections || [];
        return async.map(subCollections, function (sub, cbk) {
            var subDict = _.extend(sub, {count: 0, value: form.instance.id});
            if (form.instance.isNew) return cbk(null, subDict);
            var relatedModel = MongooseAdmin.singleton.models[sub.model];
            return relatedModel.model.count()
                .where(sub.field, form.instance.id)
                .exec(function (err, count) {
                    subDict.count = count;
                    cbk(err, subDict);
                });
        }, function (err, subs) {
            if (err) return res.redirect('/error');

            var html = form.to_html(),
                head = form.render_head();

            //noinspection JSUnusedGlobalSymbols
            return res.render('document.jade', {
                rootPath: MongooseAdmin.singleton.root,
                adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                pageTitle: 'Admin - ' + model.model.label,

                model: model.model,
                model_name: model.modelName,
                model_label: model.label,

                renderedDocument: html,
                renderedHead: head,
                document: {},
                actions: form.instance.isNew ? [] : model.options.actions || [],
                errors: form.errors ? Object.keys(form.errors).length > 0 : false,
                allow_delete: allow_delete,
                dialog: dialog,
                pretty: true,
                subCollections: subs
            });
        })
    });
}


var parseFilters = function (model_settings, filters, search) {
    var model = model_settings.model;
    var new_filters = {};
    _.each(filters, function (value, key) {
        var parts = key.split('__');
        key = parts[0];
        if (model.schema && model.schema.paths[key]) {
            var type = model.schema.paths[key].options.type.constructor.name;
            switch (type) {
                case 'String':
                    new_filters[key] = new RegExp(value, 'i');
                    break;
                case 'Number':
                    new_filters[key] = Number(value) || undefined;
                    break;
                case 'Boolean':
                    new_filters[key] = value == 'true';
                    break;
                case 'ObjectId':
                    new_filters[key] = value == 'true';
                    break;
                default:
                    new_filters[key] = value;
            }
        } else {
            new_filters[key] = value;
        }
        if (parts[1]) {
            var dict = {};
            dict['$' + parts[1]] = value;
            new_filters[key] = dict;
        }
    });
    if (search) {
        var search_query = getSearchQuery(model_settings, search);
        if (search_query) {
            new_filters['$where'] = search_query;
        }
    }
    return new_filters;
};


function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function getSearchQuery(model, searchValue) {
    var searchRule = model && model.options && model.options.search;
    if (!searchRule)
        return null;
    var valueRegex = escapeRegExp(searchValue);
    console.log(searchRule);
    if (Array.isArray(searchRule)) {
        return searchRule.map(function (field) {
            return '/' + valueRegex + '/.test(this.' + field + ')';
        }).join('||');
    }
    else {
        return searchRule.replace('__value__', valueRegex);
    }
}


var routes = {
    index: function (req, res) {
        var admin = MongooseAdmin.singleton;

        admin.getRegisteredModels(req.admin_user, function (err, models) {
            if (err) return res.redirect(admin.buildPath('/error'));
            //noinspection JSUnusedGlobalSymbols
            var sections = _(models)
                .groupBy(function(item) { return item.options.section; })
                .tap(function (val) {
                    if ('undefined' in val) {
                        val[admin.options.default_section] = val.undefined;
                        delete val.undefined;
                    }
                    return val;
                })
                .map(function(value, key) { return {name: key, models: value}; })
                .valueOf();

            return res.render('models.jade', {
                pageTitle: 'Admin Site',
                sections: sections,
                renderedHead: '',
                adminTitle: admin.getAdminTitle(),
                rootPath: admin.root
            });
        });
    },

    login: function (req, res) {
        res.render('login.jade', {
            error: req.query.error,
            pageTitle: 'Admin Login',
            adminTitle: MongooseAdmin.singleton.getAdminTitle(),
            rootPath: MongooseAdmin.singleton.root,
            renderedHead: ''
        });
    },

    postLogin: function (req, res) {
        MongooseAdmin.singleton.login(req.body.username, req.body.password, function (err, admin_user) {
            if (err) throw err;

            if (!admin_user)
                return res.redirect(MongooseAdmin.singleton.buildPath('/login') + '?error=true');

            req.session._mongooseAdminUser = admin_user.toSessionStore();
            var dest = MongooseAdmin.singleton.buildPath(req.session._loginRefferer);
            delete req.session._loginRefferer;
            return res.redirect(dest);
        });
    },

    logout: function (req, res) {
        req.session._mongooseAdminUser = undefined;
        var ref = req.get('Referrer') || '';
        var ref_rel = Url.parse(ref).path;
        res.redirect(ref_rel);
    },

    model: function (req, res) {
        var name = req.params.modelName,
            modelConfig = MongooseAdmin.singleton.models[name];

        if (!modelConfig) throw new Error("No model named" + req.params.modelName);

        if (modelConfig.is_single)
            return res.redirect(req.path.split('/model/')[0]);

        // query
        var query = _.clone(req.query);

        var start = Number(query.start) || 0;
        delete query.start;

        var isDialog = Boolean(query._dialog);
        delete query._dialog;

        var count = Number(query.count) || 100;
        delete query.count;

        var sort = query.order_by;
        delete query.order_by;

        /** @namespace query.saved */
        //var saved = query.saved;
        delete query.saved;

        /** @namespace query._search */
        var search_value = query._search || '';
        delete query._search;

        var filters = parseFilters(modelConfig, query, search_value);

        var sortable = typeof(modelConfig.options.sortable) == 'string' && permissions.hasPermissions(req.admin_user, name, 'order');

        if (sortable) start = 0, count = 1000;

        return MongooseAdmin.singleton.modelCounts(name, filters, function (err, total_count) {
            if (err) throw err;

            return MongooseAdmin.singleton.listModelDocuments(name, start, count, filters, sort, function (err, documents) {
                if (err) throw err;

                var makeLink = function (key, value) {
                    var query = _.clone(req.query);
                    if (key)
                        query[key] = value;
                    return '?' + _(query).map(function (v, k) {
                        if (!v || !k) return null;
                        return encodeURIComponent(k) + '=' + encodeURIComponent(v);
                    }).compact().join('&');
                };
                var orderLink = function (key) {
                    if (req.query.order_by == key) {
                        key = '-' + key;
                    }
                    return makeLink('order_by', key);
                };
                //noinspection JSUnresolvedVariable
                var schema = modelConfig.model.schema.tree;
                var fieldLabel = function (field) {
                    return schema[field] && schema[field].label
                        ? schema[field].label
                        : field[0].toUpperCase() + field.slice(1).replace(/_/g, ' ');
                };

                return res.render('model.jade', {
                    adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                    pageTitle: 'Admin - ' + modelConfig.model.label,
                    rootPath: MongooseAdmin.singleton.root,
                    model_name: name,
                    model: modelConfig,
                    list_fields: modelConfig.options.list,
                    documents: documents,
                    total_count: total_count,
                    start: start,
                    count: count,
                    makeLink: makeLink,
                    orderLink: orderLink,
                    fieldLabel: fieldLabel,
                    filters: modelConfig.filters || [],
                    current_filters: req.query,
                    search: modelConfig.options.search,
                    search_value: search_value,
                    cloudinary: require('cloudinary'),
                    actions: modelConfig.options.actions || [],
                    editable: permissions.hasPermissions(req.admin_user, name, 'update'),
                    sortable: sortable,
                    cloneable: modelConfig.options.cloneable !== false && permissions.hasPermissions(req.admin_user, name, 'create'),
                    creatable: modelConfig.options.creatable !== false && permissions.hasPermissions(req.admin_user, name, 'create'),
                    dialog:isDialog
                });
            });
        });
    },

    document: function (req, res) {
        var model_conf = MongooseAdmin.singleton.getModelConf(req.params.modelName),
            id = req.params.documentId,
            orig_id = req.query['orig'];
        if (!model_conf) throw new Error("No model named" + req.params.modelName);
            // get document from DB
        var q;
        if (model_conf.is_single) {
            q = model_conf.model.findOne();
        } else if (id === 'new') {
            q = model_conf.model.findById(orig_id);
        } else {
            q = model_conf.model.findById(id);
        }
        q.exec(function (err, document) {
            var FormType = model_conf.options.form || AdminForm,
                options = _.extend({ instance: document }, model_conf.options),
                is_dialog = Boolean(req.query['_dialog']),
                editing = !model_conf.is_single && id !== 'new',
                clone = !model_conf.is_single && id === 'new' && orig_id;
            if (id === 'new') {
                delete req.query['_dialog'];
                options.data = parseFilters(model_conf, req.query);
            }
            var form = new FormType(req, options, model_conf.model);
            return renderForm(res, form, model_conf, editing, clone, is_dialog);
        });
    },


    documentPost: function (req, res) {
        var name = req.params.modelName,
            doc_id = req.params.documentId,
            model = MongooseAdmin.singleton.models[name],
            target_url = req.path.split('/document/')[0].slice(1) + '?saved=true';

        if (doc_id === 'new') doc_id = null;
        if (doc_id === 'single') doc_id = req.params.theDoc && req.params.theDoc.id;
        var callback = function (err, doc) {
            if (err) {
                if (err.to_html)
                    return renderForm(res, err, model, true);
                else
                    return res.send(500);
            }
            if (!(req.query._dialog && doc)) {
                return res.redirect(target_url);
            }
            var docName = doc.name || doc.title || doc.toString;
            if (typeof(docName) == 'function')
                docName = docName.call(doc);
            return res.render('dialog_callback.jade', {data: {id: doc.id, label: docName}});
        };
        // Update
        if (doc_id) {
            MongooseAdmin.singleton.updateDocument(req, req.admin_user, name, doc_id, req.body, callback);
            // Create
        } else {
            MongooseAdmin.singleton.createDocument(req, req.admin_user, name, req.body, callback);
        }
    }
};


var auth = function (role) {
    return function (req, res, next) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user) {
            req.session._loginRefferer = req.url;
            return res.redirect(MongooseAdmin.singleton.buildPath('/login'));
        }

        if (role && !permissions.hasPermissions(admin_user, req.params.modelName, role)) {
            req.session._loginRefferer = req.url;
            return res.send('No permissions');
        }

        req.admin_user = admin_user;
        return next();
    };
};


function userPanel(req, res, next) {
    MongooseAdmin.singleton.renderUserPanel(req, function (err, html) {
        if (err) return res.redirect(MongooseAdmin.singleton.buildPath('/error'));

        //noinspection JSUnusedGlobalSymbols
        res.locals({userPanel: html});
        return next();
    });
}


module.exports = function (admin, outer_app, root, version) {
    MongooseAdmin = admin;
    var nodestrum = require('nodestrum');
    var app = require.main.require('express')();
    var Templates = require('./templates');

    // Voodoo to get Express working with compiled templates
    app.engine('jade', function(templatePath, locals, callback) {
        var name = path.basename(templatePath, '.jade');
        var ret = Templates[name](locals);
        callback(null, ret);
    });
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    // End voodoo

    app.use(nodestrum.domain_wrapper_middleware);
    app.locals.version = version;

    app.get('/', auth(), userPanel, routes.index);
    app.get('/login', routes.login);
    app.post('/login', routes.postLogin);
    app.get('/logout', routes.logout);
    app.get('/model/:modelName', auth('view'), userPanel, routes.model);
    app.get('/model/:modelName/document/:documentId', auth('update'), routes.document);
    app.post('/model/:modelName/document/:documentId', [auth(), singleMiddleware], routes.documentPost);

    app.post('/json/dependencies', json_routes.checkDependencies);
    app.get('/json/documents', json_routes.documents);
    app.post('/json/model/:collectionName/order', json_routes.orderDocuments);
    app.post('/json/model/:collectionName/action/:actionId', json_routes.actionDocuments);
    app.post('/json/model/:collectionName/document', json_routes.createDocument);
    app.put('/json/model/:collectionName/document', json_routes.updateDocument);
    app.delete('/json/model/:collectionName/document', json_routes.deleteDocument);
    app.get('/json/model/:collectionName/linkedDocumentsList', json_routes.linkedDocumentsList);

    if (root) {
        outer_app.use(root, app);
        outer_app.admin_app = app;
        app.admin_root = root;
    }
    return app;
};
