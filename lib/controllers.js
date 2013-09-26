'use strict';
var _ = require('lodash'),
    async = require('async'),
    Url = require('url'),
    querystring = require('querystring'),
    log = require('nodestrum').logFor('formage');

var DEFAULT_QUERY_COUNT_LIMIT = 100;
var DEFAULT_QUERY_COUNT_LIMIT_SORTABLE = 1000;

module.exports = function (admin) {

    var renderForm = function renderForm(res, form, modelConfig, allow_delete, clone, dialog) {
        if (clone) form.exclude.push('id');

        form.render_ready(function (err) {
            if (err) return res.redirect('/error');

            var subCollections = modelConfig.options.subCollections || [];
            return async.map(
                subCollections,
                // transformer
                function (sub, cbk) {
                    var subDict = _.extend(sub, {count: 0, value: form.instance.id});
                    if (form.instance.isNew) return cbk(null, subDict);
                    var relatedModel = admin.models[sub.model];
                    //noinspection JSUnresolvedVariable
                    return relatedModel.model.count()
                        .where(sub.field, form.instance.id)
                        .exec(function (err, count) {
                            subDict.count = count;
                            cbk(err, subDict);
                        });
                },
                // handler
                function (err, subs) {
                    if (err) return res.redirect('/error');
                    return res.render('document.jade', {
                        rootPath: admin.options.root,
                        adminTitle: admin.options.title,
                        pageTitle: 'Admin - ' + modelConfig.model.label,

                        model: modelConfig.model,
                        model_name: modelConfig.modelName,
                        model_label: modelConfig.label,

                        renderedDocument: form.to_html(),
                        renderedHead: form.render_head(),
                        document: {},
                        actions: form.instance.isNew ? [] : modelConfig.options.actions || [],
                        errors: form.errors ? Object.keys(form.errors).length > 0 : false,
                        allow_delete: allow_delete,
                        dialog: dialog,
                        pretty: true,
                        subCollections: subs
                    });
                })
        });
    };


    var arrangeSections = function (models) {
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
        return sections;
    };


    return {
        json_routes: {
            documents: function (req, res) {
                var query = querystring.parse(Url.parse(req.url).query);
                return admin.modelCounts(query.collection, function (err, totalCount) {
                    if (err) throw err;
                    return admin.listModelDocuments(query.collection, query.start, query.count, function (err, documents) {
                        if (err) throw err;
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
                    models = _.pluck(admin.models, 'model');

                var dependencies = require('./dependencies');
                dependencies.check(models, modelName, id, function (err, depPair) {
                    //                    var doc_id = depPair[0];
                    var deps = depPair[1];
                    var lines = dependencies.depsToLines(deps);
                    res.json(lines);
                });
            },


            createDocument: function (req, res) {
                admin.createDocument(req, req.params.collectionName, req.body, function (err) {
                    if (err) throw err;
                    res.json({"collection": req.params.collectionName});
                });
            },


            updateDocument: function (req, res) {
                admin.updateDocument(req, req.params.collectionName, req.body._id, req.body, function (err) {
                    if (err) throw err;
                    res.json({"collection": req.params.collectionName});
                });
            },

            orderDocuments: function (req, res) {
                admin.orderDocuments(req.admin_user, req.params.collectionName, req.body, function (err) {
                    if (err) throw err;
                    res.json({"collection": req.params.collectionName});
                });
            },


            actionDocuments: function (req, res) {
                return admin.actionDocuments(req.admin_user, req.params.collectionName, req.params['actionId'], req.body, function (err, lines) {
                    if (err) return res.json(422, {error: err.message});
                    return res.json(lines);
                });
            },


            deleteDocument: function (req, res) {
                admin.deleteDocument(req.admin_user, req.params.collectionName, req.query['document_id'], function (err) {
                    if (err) throw err;
                    res.json({"collection": req.params.collectionName});
                });
            },


            linkedDocumentsList: function (req, res) {
                var modelConfig = admin.models[req.params.collectionName];
                admin.listModelDocuments(req.params.collectionName, 0, 500, function (err, documents) {
                    if (err) throw err;
                    var result = [];
                    documents.forEach(function (document) {
                        var d = {'_id': document._id};
                        modelConfig.options.list.forEach(function (listField) {
                            d[listField] = document[listField];
                        });
                        result.push(d);
                    });
                    res.json(result);
                });
            }
        },



        routes: {
            index: function (req, res) {
                admin.getAccesibleModels(req.admin_user, function (err, models) {
                    if (err) return res.redirect(admin.buildPath('/error'));
                    //noinspection JSUnusedGlobalSymbols
                    var sections = arrangeSections(models);
                    return res.render('models.jade', {
                        pageTitle: 'Admin Site',
                        sections: sections,
                        renderedHead: '',
                        adminTitle: admin.options.title,
                        rootPath: admin.options.root
                    });
                });
            },

            login: function (req, res) {
                res.render('login.jade', {
                    error: req.query.error,
                    pageTitle: 'Admin Login',
                    adminTitle: admin.options.title,
                    rootPath: admin.options.root,
                    renderedHead: ''
                });
            },

            postLogin: function (req, res) {
                admin.login(req.body.username, req.body.password, function (err, admin_user) {
                    if (err) throw err;

                    if (!admin_user) {
                        return res.redirect(admin.buildPath('/login') + '?error=true');
                    }

                    req.session._mongooseAdminUser = admin_user.toSessionStore();
                    var dest = admin.buildPath(req.session._loginRefferer);
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
                    modelConfig = admin.models[name];

                if (!modelConfig) throw new Error("No model named" + req.params.modelName);

                if (modelConfig.is_single) {
                    return res.redirect(req.path.split('/model/')[0]);
                }

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
                            if (key) {
                                query[key] = value;
                            }
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
                            adminTitle: admin.options.title,
                            pageTitle: 'Admin - ' + modelConfig.model.label,
                            rootPath: admin.options.root,
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
                var modelConfig = admin.models[req.params.modelName],
                    id = req.params.documentId,
                    orig_id = req.query['orig'];
                if (!modelConfig) throw new TypeError("No model named" + req.params.modelName);
                // get document from DB
                var q;
                if (modelConfig.is_single) {
                    q = modelConfig.model.findOne();
                } else if (id === 'new') {
                    q = modelConfig.model.findById(orig_id);
                } else {
                    q = modelConfig.model.findById(id);
                }
                q.exec(function (err, document) {
                    var FormType = modelConfig.options.form,
                        options = _.extend({ instance: document }, modelConfig.options),
                        is_dialog = Boolean(req.query['_dialog']),
                        editing = !modelConfig.is_single && id !== 'new',
                        clone = !modelConfig.is_single && id === 'new' && orig_id;
                    if (id === 'new') {
                        delete req.query['_dialog'];
                        options.data = parseFilters(modelConfig, req.query);
                    }
                    var form = new FormType(req, options, modelConfig.model);
                    return renderForm(res, form, modelConfig, editing, clone, is_dialog);
                });
            },


            documentPost: function (req, res) {
                var name = req.params.modelName,
                    doc_id = req.params.documentId,
                    modelConfig = admin.models[name],
                    target_url = req.path.split('/document/')[0].slice(1) + '?saved=true';
                if (doc_id === 'new') doc_id = null;
                if (doc_id === 'single') doc_id = req.params.theDoc && req.params.theDoc.id;

                var callback = function (err, doc) {
                    if (err) {
                        if (err.to_html) {
                            return renderForm(res, err, modelConfig, true);
                        }
                        else {
                            throw err;
                        }
                    }
                    if (!(req.query['_dialog'] && doc)) {
                        return res.redirect(target_url);
                    }
                    var docName = doc.name || doc.title || doc.toString();
                    return res.render('dialog_callback.jade', {data: {id: doc.id, label: docName}});
                };

                // Update
                if (doc_id) {
                    admin.updateDocument(req, req.admin_user, name, doc_id, req.body, callback);
                    // Create
                } else {
                    admin.createDocument(req, req.admin_user, name, req.body, callback);
                }
            }
        },


        singleMiddleware: function (req, res, next) {
            var model = admin.models[req.params.modelName].model;
            if (req.params.documentId !== 'single') {
                next();
                return;
            }
            model.findOne({}, function (err, doc) {
                if (err) throw err;
                req.params.theDoc = doc;
                next()
            });
        },


        authMiddleware: function (role) {
            return function (req, res, next) {
                var admin_user = admin.userFromSessionStore(req.session._mongooseAdminUser);
                if (!admin_user) {
                    req.session._loginRefferer = req.url;
                    return res.redirect(admin.buildPath('/login'));
                }

                if (role && !admin_user.hasPermissions(req.params.modelName, role)) {
                    req.session._loginRefferer = req.url;
                    return res.send('No permissions');
                }

                req.admin_user = admin_user;
                return next();
            };
        },

        userPanelMiddleware: function (req, res, next) {
            var user = req.admin_user;
            if (!user) throw Error("userPanelMiddleware must come after authMiddleware");
            res.locals({
                userPanel: '<div>Hello ' + user.username + (user.lastVisit ? ', your last visit was on ' + new Date(user.lastVisit).toLocaleDateString() : '' ) + '</div>'
            });
            next();
        }
    };
};


var parseFilters = function parseFilters(model_settings, filters, search) {
    var model = model_settings.model;
    var new_filters = _.reduce(
        filters,
        function (seed, value, key) {
            var parts = key.split('__');
            key = parts[0];
            if (parts[1]) {
                var op = '$' + parts[1];
                seed[key] = _.object([
                    [op, value]
                ]);
                return seed;
            }
            if (!model.schema || !model.schema.paths[key]) {
                seed[key] = value;
                return seed;
            }
            var type = model.schema.paths[key].options.type.constructor.name;
            switch (type) {
            case 'String':
                seed[key] = new RegExp(value, 'i');
                break;
            case 'Number':
                seed[key] = Number(value) || undefined;
                break;
            case 'Boolean':
                seed[key] = value == 'true';
                break;
            case 'ObjectId':
                seed[key] = value == 'true';
                break;
            default:
                seed[key] = value;
            }
            return seed;
        },
        {}
    );
    if (!search) return new_filters;
    // if we have search term
    var valueRegex = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    var searchRule = model_settings.options.search;
    if (!searchRule) return new_filters;
    new_filters['$where'] = Array.isArray(searchRule) ?
        searchRule.map(function (field) {return '/' + valueRegex + '/.test(this.' + field + ')';}).join('||')
        : searchRule.replace(/__value__/g, valueRegex);
    return new_filters;
};
