'use strict';
var _ = require('lodash'),
    async = require('async'),
    Url = require('url'),
    querystring = require('querystring'),
    dependencies = require('./dependencies'),
    log = require('nodestrum').logFor('formage');


var DEFAULT_QUERY_COUNT_LIMIT = 100;
var DEFAULT_QUERY_COUNT_LIMIT_SORTABLE = 1000;

module.exports = function (registry) {


    function buildPath(path) { return registry.options.root + path; }


    function readyForm(form, modelConfig, isNew, isDialog, callback) {
        form.render_ready(function (err) {
            if (err) throw err;

            var subCollections = modelConfig.options.subCollections || [];
            return async.map(
                subCollections,
                // transformer
                function (sub, cbk) {
                    var subDict = _.extend(sub, {count: 0, value: form.instance.id});
                    if (form.instance.isNew) return cbk(null, subDict);
                    var relatedModel = registry.models[sub.model];
                    sub.label = sub.label || relatedModel.modelName;
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
                    if (err) throw err;
                    callback({
                        rootPath: registry.options.root,
                        adminTitle: registry.options.title,
                        pageTitle: 'Admin - ' + modelConfig.model.label,

                        model: modelConfig.model,
                        model_name: modelConfig.modelName,
                        model_label: modelConfig.label,

                        renderedDocument: form.to_html(),
                        renderedHead: form.render_head(),
                        document: {},
                        actions: form.instance.isNew ? [] : modelConfig.options.actions,
                        errors: form.errors,
                        allow_delete: !modelConfig.is_single && !isNew,
                        isDialog: isDialog,
                        pretty: true,
                        subCollections: subs
                    });
                })
        });
    }


    function arrangeSections(models) {
        var sections = _(models)
            .groupBy(function (item) { return item.options.section; })
            .tap(function (val) {
                if ('undefined' in val) {
                    val[registry.options.default_section] = val.undefined;
                    delete val.undefined;
                }
                return val;
            })
            .map(function (value, key) { return {name: key, models: value}; })
            .valueOf();
        return sections;
    }


    function listModelDocuments(modelName, start, count, filters, sort, callback) {
        var model_config = registry.models[modelName];
        var dbModel = model_config.model;
        var sorts = _.clone(model_config.options.order_by) || [];
        var populates = model_config.options.list_populate;
        var listFields = model_config.options.list || [];
        if (sort)
            sorts.unshift(sort);
        return registry.adapter.queryDocuments(listFields, dbModel, filters, sorts, populates, start, count, callback);
    }


    function upsertDocument(req, callback) {
        var modelName = req.params.modelName,
            docId = req.params.documentId;
        if (docId === 'new') docId = null;
        if (docId === 'single') docId = req.params.theDoc && req.params.theDoc.id;
        var modelConfig = registry.models[modelName];
        modelConfig.model.findById(docId, function (err, document) {
            if (err) throw err;
            var action = document ? 'update' : 'create';
            if (!req.admin_user.hasPermissions(modelConfig.modelName, action)) throw new Error('unauthorized');
            var FormType = modelConfig.options.form;
            var form = new FormType(req, {instance: document, data: req.body}, modelConfig.model);
            return form.save(function (err, document) {
                if (err) return callback(form, modelConfig, document);
                document = modelConfig.options.post(document);
                return callback(null, modelConfig, document);
            });
        });
    }


    function modelCounts(collectionConfig, filters, callback) {
        if (collectionConfig.is_single) {
            callback(null, 1);
            return;
        }
        collectionConfig.model.count(filters, function (err, count) {
            if (err) throw err;
            callback(null, count);
        });
    }


    var router = {
        json_routes: {
            // in use by document->delete button (1)
            checkDependencies: function (req, res) {
                var modelName = req.params.modelName,
                    id = req.params.documentId,
                    models = _.pluck(registry.models, 'model');

                dependencies.check(models, modelName, id, function (err, depPair) {
                    if (err) throw err;
                    if (_.isEmpty(depPair)) return res.json("");
                    var deps = depPair[1];
                    var lines = dependencies.depsToLines(deps);
                    return res.json(lines);
                });
            },


            // In use by document->delete button (2)
            deleteDocument: function (req, res) {
                var modelName = req.params.collectionName;
                var documentId = req.params.documentId;
                if (!req.admin_user.hasPermissions(modelName, 'delete')) throw new Error('unauthorized');
                var modelConfig = registry.models[modelName];
                modelConfig.model.findById(documentId, function (err, document) {
                    if (err) throw err;
                    if (!document) throw new Error('Document not found');
                    dependencies.unlink(registry.models, modelName, documentId, function (err) {
                        if (err) throw new Error('unlink dependencies failed');
                        document.remove(function (err) {
                            if (err) throw err;
                            res.json({"collection": req.params.collectionName});
                        });
                    });
                });
            },


            // In use by related-model-modal
            upsertDocument: function (req, res) {
                upsertDocument(req, function (rejectedFrom, modelConfig, document) {
                    if (rejectedFrom) res.json(422, rejectedFrom.errors);
                    res.json(205, {id: document.id, label: document.toString()});
                });
            },


            orderDocuments: function (req, res) {
                var modelName = req.params.collectionName,
                    data = req.body;
                if (!req.admin_user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
                var modelConfig = registry.models[modelName];
                var sorting_attr = modelConfig.options.sortable;
                if (!sorting_attr) throw new TypeError("No sorting attribute for model " + modelName);
                async.forEach(Object.keys(data), function (id, cb) {
                    var set_dict = _.object([
                        [sorting_attr, data[id]]
                    ]);
                    modelConfig.model.update({_id: id}, {'$set': set_dict}, cb);
                }, function (err) {
                    if (err) throw err;
                    res.json({"collection": modelName});
                });
            },


            actionDocuments: function (req, res) {
                var modelName = req.params.collectionName,
                    actionId = req.params['actionId'],
                    data = req.body;
                if (!req.admin_user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
                var action = _.find(registry.models[modelName].options.actions, {value: actionId});
                if (!action) throw new TypeError("Cloud not find action " + actionId);
                return action.func(user, data.ids, function (err, lines) {
                    if (err) return res.json(422, {error: err.message});
                    return res.json(lines);
                });
            }
        },


        routes: {
            index: function (req, res) {
                var models = registry.getAccessibleModels(req.admin_user);
                var sections = arrangeSections(models);
                return res.render('models.jade', {
                    pageTitle: 'Admin Site',
                    sections: sections,
                    renderedHead: '',
                    adminTitle: registry.options.title,
                    rootPath: registry.options.root
                });
            },


            login: function (req, res) {
                res.render('login.jade', {
                    error: req.query.error,
                    pageTitle: 'Admin Login',
                    adminTitle: registry.options.title,
                    rootPath: registry.options.root,
                    renderedHead: ''
                });
            },


            postLogin: function (req, res) {
                registry.adapter.login(req.body.username, req.body.password, function (err, admin_user) {
                    if (err) throw err;

                    if (!admin_user) {
                        return res.redirect(buildPath('/login') + '?error=true');
                    }

                    req.session._mongooseAdminUser = admin_user.toSessionStore();
                    var dest = buildPath(req.session._loginRefferer);
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
                    modelConfig = registry.models[name];

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

                return modelCounts(modelConfig, filters, function (err, total_count) {
                    if (err) throw err;
                    return listModelDocuments(name, start, count, filters, sort, function (documents) {
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
                        var paths = registry.adapter.getPaths(modelConfig.model);
                        var fieldLabel = function (fieldName) {
                            if (!fieldName || !fieldName.length) return '';
                            var fieldConfig = _.find(paths, {db_path: fieldName}) || {};
                            return fieldConfig.label || fieldName[0].toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
                        };
                        var getTypeName = function getTypeName(fieldName) {
                            var fieldConfig = _.find(paths, {db_path: fieldName}) || {};
                            return fieldConfig._typeName || '';
                        };
                        return res.render('model.jade', {
                            adminTitle: registry.options.title,
                            pageTitle: 'Admin - ' + modelConfig.model.label,
                            rootPath: registry.options.root,
                            model_name: name,
                            label: modelConfig.label,
                            singular: modelConfig.singular,
                            modelConfig: modelConfig,
                            list_fields: modelConfig.options.list,
                            getTypeName: getTypeName,
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
                            actions: modelConfig.options.actions,
                            editable: req.admin_user.hasPermissions(name, 'update'),
                            sortable: sortable,
                            cloneable: modelConfig.options.cloneable !== false && req.admin_user.hasPermissions(name, 'create'),
                            creatable: modelConfig.options.creatable !== false && req.admin_user.hasPermissions(name, 'create'),
                            isDialog: isDialog
                        });
                    });
                });
            },


            document: function (req, res) {
                var modelConfig = registry.models[req.params.modelName],
                    id = req.params.documentId,
                    orig_id = req.query['orig'],
                    is_new = (id === 'new');
                if (!modelConfig) throw new TypeError("No model named " + req.params.modelName);

                // get document from DB
                var dbModel = modelConfig.model;
                id = is_new ? orig_id : id;
                var getDocument = (modelConfig.is_single) ? dbModel.findOne.bind(dbModel) : dbModel.findById.bind(dbModel, id);
                if (!id) getDocument = function (cb) {
                    var d = new dbModel;
                    process.nextTick(cb.bind(null, null, d));
                };
                getDocument(function (err, document) {
                    if (err) throw err;
                    var FormType = modelConfig.options.form,
                        options = _.extend({ instance: document }, modelConfig.options),
                        is_dialog = Boolean(req.query['_dialog']);
                    delete req.query['_dialog'];
                    if (is_new) {
                        options.data = parseFilters(modelConfig, req.query);
                    }
                    var form = new FormType(req, options, modelConfig.model);
                    return readyForm(form, modelConfig, is_new, is_dialog, function (locals) {
                        res.render("document.jade", locals)
                    });
                });
            },


            documentPost: function (req, res) {
                var is_dialog = Boolean(req.query['_dialog']);
                var is_new = req.params.documentId === 'new';
                upsertDocument(req, function (rejectedForm, modelConfig) {
                    if (rejectedForm)
                        return readyForm(rejectedForm, modelConfig, is_new, is_dialog, function (locals) {
                            res.status(422);
                            res.render("document.jade", locals)
                        });

                    var retURL = buildPath(req.path.split('/document/')[0]);
                    return res.redirect(retURL);
                });
            }
        },


        singleMiddleware: function (req, res, next) {
            var model = registry.models[req.params.modelName].model;
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
                if (req.admin_user) return next();
                var admin_user = registry.adapter.getAdminUser(req);
                if (!admin_user) {
                    req.session._loginRefferer = req.url;
                    return res.redirect(buildPath('/login'));
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

    return router;
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


