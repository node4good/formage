'use strict';
var Url = require('url'),
    querystring = require('querystring'),
    async = require('async'),
    _ = require('lodash'),
    path = require('path');

var DEFAULT_QUERY_COUNT_LIMIT = 100;
var DEFAULT_QUERY_COUNT_LIMIT_SORTABLE = 1000;

module.exports = function (MongooseAdmin) {
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
            return searchRule.replace(/__value__/g, valueRegex);
        }
    }


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
                //noinspection JSUnresolvedVariable
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


    module.exports.json_routes = {
        documents: function (req, res) {
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
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
            var modelName = req.body.model,
                id = req.body.id,
                models = _.pluck(MongooseAdmin.singleton.models, 'model');

            var dependencies = require('./dependencies');
            dependencies.check(models, modelName, id, function (err, depPair) {
                var doc_id = depPair[0];
                var deps = depPair[1];
                var lines = dependencies.depsToLines(deps);
                res.json(lines);
            });
        },


        createDocument: function (req, res) {
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
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
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
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
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
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
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
            if (!admin_user) return res.send(401);

            /** @namespace req.params.actionId */
            return MongooseAdmin.singleton.actionDocuments(admin_user, req.params.collectionName, req.params.actionId, req.body, function (err, lines) {
                if (err) return res.json(422, {error: err.message});
                return res.json(lines);
            });
        },


        deleteDocument: function (req, res) {
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
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
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
            if (!admin_user) {
                res.writeHead(401, {"Content-Type": "application/json"});
                res.end();
                return;
            }
            var modelConfig = MongooseAdmin.singleton.getModelConfig(req.params.collectionName);
            MongooseAdmin.singleton.listModelDocuments(req.params.collectionName, 0, 500, function (err, documents) {
                if (err) {
                    res.writeHead(500);
                    res.end();
                } else {
                    var result = [];
                    documents.forEach(function (document) {
                        var d = {'_id': document._id};
                        modelConfig.options.list.forEach(function (listField) {
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
    };


    module.exports.routes = {
        index: function (req, res) {
            var admin = MongooseAdmin.singleton;

            admin.getRegisteredModels(req.admin_user, function (err, models) {
                if (err) return res.redirect(admin.buildPath('/error'));
                //noinspection JSUnusedGlobalSymbols
                var sections = _(models)
                    .groupBy(function (item) { return item.options.section; })
                    .tap(function (val) {
                        if ('undefined' in val) {
                            val[admin.options.default_section] = val.undefined;
                            delete val.undefined;
                        }
                        return val;
                    })
                    .map(function (value, key) { return {name: key, models: value}; })
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
                admin = MongooseAdmin.singleton,
                modelConfig = admin.models[name];

            if (!modelConfig) throw new Error("No model named" + req.params.modelName);

            if (modelConfig.is_single)
                return res.redirect(req.path.split('/model/')[0]);

            // query
            var query = _.clone(req.query);

            var start = Number(query.start) || 0;
            delete query.start;

            //noinspection JSUnresolvedVariable
            var isDialog = Boolean(query._dialog);
            //noinspection JSUnresolvedVariable
            delete query._dialog;

            var count = Number(query.count) || DEFAULT_QUERY_COUNT_LIMIT;
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

            var sortable = typeof(modelConfig.options.sortable) == 'string' && req.admin_user.hasPermissions(name, 'order');

            if (sortable) {
                start = 0;
                count = DEFAULT_QUERY_COUNT_LIMIT_SORTABLE;
            }

            return admin.modelCounts(name, filters, function (err, total_count) {
                if (err) throw err;

                return admin.listModelDocuments(name, start, count, filters, sort, function (err, documents) {
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
                        adminTitle: admin.getAdminTitle(),
                        pageTitle: 'Admin - ' + modelConfig.model.label,
                        rootPath: admin.root,
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
                        editable: req.admin_user.hasPermissions(name, 'update'),
                        sortable: sortable,
                        cloneable: modelConfig.options.cloneable !== false && req.admin_user.hasPermissions(name, 'create'),
                        creatable: modelConfig.options.creatable !== false && req.admin_user.hasPermissions(name, 'create'),
                        dialog: isDialog
                    });
                });
            });
        },

        document: function (req, res) {
            var model_conf = MongooseAdmin.singleton.getModelConfig(req.params.modelName),
                id = req.params.documentId,
                orig_id = req.query['orig'];
            if (!model_conf) throw new TypeError("No model named" + req.params.modelName);
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
                var FormType = model_conf.options.form,
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
                //noinspection JSUnresolvedVariable
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


    module.exports.singleMiddleware = function (req, res, next) {
        var model = MongooseAdmin.singleton.models[req.params.modelName].model;
        if (req.params.documentId === 'single')
            model.findOne({}, function (err, doc) {
                if (err) throw err;
                req.params.theDoc = doc;
                next()
            });
        else
            next();
    };


    module.exports.authMiddleware = function (role) {
        return function (req, res, next) {
            var admin_user = MongooseAdmin.singleton.userFromSessionStore(req.session._mongooseAdminUser);
            if (!admin_user) {
                req.session._loginRefferer = req.url;
                return res.redirect(MongooseAdmin.singleton.buildPath('/login'));
            }

            if (role && !admin_user.hasPermissions(req.params.modelName, role)) {
                req.session._loginRefferer = req.url;
                return res.send('No permissions');
            }

            req.admin_user = admin_user;
            return next();
        };
    };


    module.exports.userPanelMiddleware = function (req, res, next) {
        MongooseAdmin.singleton.renderUserPanel(req, function (err, html) {
            if (err) return res.redirect(MongooseAdmin.singleton.buildPath('/error'));
            res.locals({userPanel: html});
            return next();
        });
    };

    return module.exports;
};
