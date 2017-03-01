'use strict';
var _ = require('lodash-contrib'),
    async = require('async'),
    MPromise = require('mpromise'),
    dependencies = require('./dependencies'),
    debug = require('debug')('formage');


function polymorphGetDocument(Model, isSingle, id) {
    var p = new MPromise;
    if (isSingle) {
        Model.findOne(p.resolve.bind(p));
        return p;
    }
    if (id && id !== 'new') {
        Model.findById(id, p.resolve.bind(p));
        return p;
    }
    p.fulfill(null, new Model);
    return p;
}


module.exports = function (registry) {
    function parseQuery(modelConfig, query) {
        var rawSearchValue = query._search;
        delete query._search;
        var model = modelConfig.model;
        var paths = registry.adapter.getPaths(model);
        var new_filters = _.reduce(
            query,
            function (seed, value, key) {
                var parts = key.split('__');
                key = parts[0];
                if (parts[1]) {
                    var op = '$' + parts[1];
                    seed[key] = _.object([op], [value]);
                    return seed;
                }
                var path = paths.find({db_path: key});
                if (!path) return seed;
                var type = path.type && path.type.name;
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
                    default:
                        seed[key] = (value === 'null') ? null : value;
                }
                return seed;
            },
            {}
        );

        // if we have search term
        var searchRule = modelConfig.options.search;
        if (!searchRule || !rawSearchValue) return new_filters;
        var searchValue = _.regexEscape(rawSearchValue);
        if (Array.isArray(searchRule)) {
            new_filters['$where'] = searchRule
                .map(function (field) {
                    return '/' + searchValue + '/i.test(this.' + field + ')';
                })
                .join('||');
        } else {
            new_filters['$where'] = searchRule.replace(/__value__/g, searchValue);
        }
        return new_filters;
    }


    function buildPath(path) {
        return registry.root + path;
    }


    function arrangeSections(models) {
        var sections = _(models)
            .groupBy(function (item) {
                return item.options.section;
            })
            .tap(function (val) {
                if ('undefined' in val) {
                    val[registry.default_section] = val.undefined;
                    delete val.undefined;
                }
                return val;
            })
            .map(function (value, key) {
                return {name: key, models: value};
            })
            .valueOf();
        return sections;
    }


    var router = {
            json_routes: {
                // in use by document->delete button (1)
                checkDependencies: function checkDependencies(req, res) {
                    var modelName = req.params.modelName,
                        id = req.params.documentId,
                        models = _.pluck(registry.models, 'model');

                    dependencies.check(models, modelName, id, function (err, depPair) {
                        if (err) throw err;
                        if (_.isEmpty(depPair)) return res.json(200, []);
                        var deps = depPair[1];
                        var lines = dependencies.depsToLines(deps);
                        return res.send(200).json(lines);
                    });
                },


                // In use by related-model-modal
                upsertDocument: function upsertDocumentController(req, res) {
                    var modelName = req.params.modelName,
                        id = req.params.documentId,
                        user = req.admin_user,
                        data = _.extend({}, req.body, req.files),
                        modelConfig = registry.models[modelName],
                        form;

                    polymorphGetDocument(modelConfig.model, modelConfig.is_single, id).then(
                        function createTheForm(document) {
                            var action = document ? 'update' : 'create';
                            var docType = document && document._doc.__t;
                            if (docType) modelConfig = registry.models[docType];
                            var FormType = modelConfig.options.form;
                            if (!user.hasPermissions(modelConfig.modelName, action)) throw new Error('unauthorized');
                            form = new FormType(modelConfig.options, modelConfig.model, document, data);
                            return form.save();
                        }
                    ).then(
                        function (document) {
                            modelConfig.options.post(document);
                            return form;
                        },
                        function (err) {
                            err.modelConfig = modelConfig;
                            err.form = form;
                            if (!form) throw err;

                            form.errors = form.errors || {};
                            if (err.name == 'ValidationError') {
                                form.errors = _.merge(form.errors, err.errors);
                            } else if (err.name === 'MongoError' && err.code == 11000) {
                                form.errors.exception = err;
                                err.name = "Duplicate";
                                var msg = '{' + err.err.split('$').pop().split('{').pop();
                                var ObjectID = /ObjectId\(\'(\w+)\'\)/.exec(msg);
                                err.fields = '\n<br />';
                                err.fields += (ObjectID.length == 2) ? '<a href="' + ObjectID[1] + '" target="_blank">Click to open duplicate document</a>' :
                                    msg;
                            } else {
                                form.errors.exception = err;
                            }
                            if (_.isEmpty(form.errors)) return form;
                            throw err;
                        }
                    ).then(
                        function (form) {
                            res._debug_form = form;
                            var response = form.instance.toJSON();
                            response.id = response.id || form.instance._id;
                            response.label = response.label || form.instance.name || form.instance.title || form.instance.toString();
                            return response;
                        }
                    ).then(
                      function (response) {
                        res.send(200)json(response);
                        },
                        function (err) {
                            err.form = res._debug_form;
                            res.send(422).json(err);
                        }
                    ).end();
                },


                orderDocuments: function orderDocuments(req, res) {
                    var modelName = req.params.modelName,
                        data = req.body;
                    if (!req.admin_user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
                    var modelConfig = registry.models[modelName];
                    var sorting_attr = modelConfig.sortable;
                    if (!sorting_attr) throw new TypeError("No sorting attribute for model " + modelName);
                    async.forEach(Object.keys(data), function (id, cb) {
                        var set_dict = _.object([
                            [sorting_attr, data[id]]
                        ]);
                        modelConfig.model.update({_id: id}, {'$set': set_dict}, cb);
                    }, function (err) {
                      if (err) throw err;
                      res.send(200).json({"collection": modelName});
                    });
                },


                actionDocuments: function actionDocuments(req, res) {
                    var modelName = req.params.modelName,
                        actionId = req.params['actionId'],
                        ids = ('ids' in req.body) ? req.body.ids : req.body['ids[]'],
                        model = registry.models[modelName];
                    ids = (typeof(ids) === 'string') ? [ ids ] : ids;
                    if (!req.admin_user.hasPermissions(modelName, 'update'))
                        throw new Error('unauthorized');

                    var action = _.find(model.actions, { id: actionId });
                    if (!action)
                        throw new TypeError('Could not find action with id=' + actionId);

                  return action.func.call(model, req.admin_user, ids, function (err, message) {
                    if (err) return res.send(422).json({ error: err.message });
                    return res.send(200).json(message || 'All is good.');
                    });
                }
            },


            routes: {
                index: function index(req, res) {
                    var models = registry.getAccessibleModels(req.admin_user);
                    var sections = arrangeSections(models);
                    return res.render('models.jade', {
                        pageTitle: 'Admin Site',
                        sections: sections,
                        renderedHead: '',
                        adminTitle: registry.title,
                        rootPath: registry.root
                    });
                },


                login: function login(req, res) {
                    res.render('login.jade', {
                        error: req.query.error,
                        pageTitle: 'Admin Login',
                        adminTitle: registry.title,
                        rootPath: registry.root,
                        renderedHead: ''
                    });
                },


                fakeLogin: function login(req, res) {
                    res.setHeader('WWW-Authenticate', 'Basic realm="formage"');
                    if (req.admin_user || registry._superUser.isReqOk(req)) return res.end('OK');
                    router.authMiddleware(req, res, function () {
                        if (req.admin_user) return res.end('OK');
                        res.status(401).end("Please Validate");
                    });
                },


                postLogin: function postLogin(req, res) {
                    registry.getByUsernamePassword(req.body.username, req.body.password).then(
                        function (admin_user) {
                            if (!admin_user) return res.redirect(buildPath('/login') + '?error=true');

                            req.session.formageUser = admin_user.toSessionStore();
                            var dest = buildPath(req.session.formageLoginReferrer || '');
                            delete req.session.formageLoginReferrer;
                            return res.redirect(dest);
                        }
                    ).end(function (err) { res.send(500, err); });
                },


                logout: function logout(req, res) {
                    delete req.session.formageUser;
                    res.redirect('/');
                },


                model: function model(req, res) {
                    var name = req.params.modelName,
                        modelConfig = registry.models[name];

                    if (!modelConfig) throw new Error("No model named " + req.params.modelName);

                    if (modelConfig.is_single) {
                        res.redirect(req.url.split('/model/')[0]);
                        return;
                    }

                    // query
                    var query = _.clone(req.query);
                    var sortable = modelConfig.sortable && req.admin_user.hasPermissions(name, 'order');
                    if (sortable) {
                        delete query.start;
                        delete query.count;
                    }

                    var start = Number(query.start) || 0;
                    delete query.start;

                    var isDialog = Boolean(query._dialog);
                    delete query._dialog;

                    var count = Number(query.count) || modelConfig.defaultCount;
                    delete query.count;

                    var sort = query.order_by;
                    delete query.order_by;

                    delete query.saved;

                    var filters = parseQuery(modelConfig, query);

                    var p = new MPromise;
                    if (modelConfig.is_single) {
                        p.fulfill(1);
                    } else {
                        p = modelConfig.model.count(filters).exec();
                    }

                    p.then(
                        function (total_count) {
                            res.locals['total_count'] = total_count;
                            var model_config = registry.models[name];
                            var dbModel = model_config.model;
                            var sorts = _.clone(model_config.order_by) || [];
                            var populates = model_config.options.list_populate;
                            var listFields = model_config.options.list || [];
                            if (sort) sorts.unshift(sort);
                            return registry.adapter.queryDocuments(listFields, dbModel, filters, sorts, populates, start, count);
                        }
                    ).then(
                        function (documents) {
                            var makeLink = res.locals['makeLink'] = function (key, value) {
                                var query = _.clone(req.query);
                                if (key) {
                                    query[key] = value;
                                }
                                return '?' + _(query).map(function (v, k) {
                                    if (!v || !k) return null;
                                    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
                                }).compact().join('&');
                            };
                            var paths = registry.adapter.getPaths(modelConfig.model);
                            var table = {
                                header: modelConfig.fieldsInTable.map(function (field_path) {
                                    var capitalized = _.humanize(field_path);
                                    var fieldConfig = paths.find({db_path: field_path});
                                    if (!fieldConfig) {
                                        return {label: capitalized};
                                    }
                                    var label = fieldConfig.label || capitalized;
                                    var key = String(field_path);
                                    var type = fieldConfig.type.name;
                                    if (req.query.order_by == field_path) {
                                        key = '-' + key;
                                    }
                                    var link = makeLink('order_by', key);
                                    var obj = {
                                        href: link,
                                        label: label
                                    };
                                    switch (type) {
                                        case 'Date':
                                            obj.thClass = 'th-medium';
                                            break;

                                        case 'Picture':
                                        case 'Filepicker':
                                            obj.thClass = 'th-slim';
                                            break;

                                        case 'Time':
                                        case 'Boolean':
                                            obj.thClass = 'th-superslim';
                                            break;
                                    }
                                    return obj;
                                }),
                                data: documents.map(function (doc) {
                                    var data = modelConfig.fieldsInTable.map(function (field_path) {
                                        var fieldConfig = paths.find({db_path: field_path});
                                        var type = fieldConfig && fieldConfig.type.name;
                                        var value = doc.get(field_path);
                                        return {type: type, value: value};
                                    });
                                    return {id: doc._id, data: data};
                                })
                            };
                            res.render('model.jade', {
                                adminTitle: registry.title,
                                pageTitle: 'Admin - ' + modelConfig.model.label,
                                rootPath: registry.root,
                                model_name: name,
                                label: modelConfig.label,
                                singular: modelConfig.singular,
                                modelConfig: modelConfig,
                                start: start,
                                count: count,
                                makeLink: makeLink,
                                filters: modelConfig.filters || [],
                                current_filters: req.query,
                                search: modelConfig.options.search,
                                search_value: query._search || '',
                                actions: modelConfig.actions,
                                sortable: sortable,
                                cloneable: modelConfig.options.cloneable !== false && req.admin_user.hasPermissions(name, 'create'),
                                creatable: modelConfig.options.creatable !== false && req.admin_user.hasPermissions(name, 'create'),
                                newTypes: _.keys(modelConfig.model.discriminators),
                                isDialog: isDialog,
                                dataTable: table
                            });
                        }
                    ).end(
                        function (err) {
                            debug(err.stack);
                            res.send(500, err);
                        }
                    );
                },


                document: function document(req, res) {
                    var prelimConfig = registry.models[req.params.modelName];
                    if (!prelimConfig) throw new TypeError("No model named " + req.params.modelName);
                    var url_id = req.params.documentId,
                        orig_id = req.query.orig,
                        is_new = (url_id === 'new'),
                        id = is_new ? orig_id : url_id;

                    // get document from DB
                    polymorphGetDocument(prelimConfig.model, prelimConfig.is_single, id).then(
                        function (document) {
                            var docType = document && document._doc.__t;
                            var modelConfig = !docType ? prelimConfig : registry.models[docType];
                            var dbModel = modelConfig.model;
                            var FormType = modelConfig.options.form,
                                options = _.extend({ instance: document }, modelConfig.options),
                                is_dialog = Boolean(req.query['_dialog']);
                            delete req.query['_dialog'];
                            if (is_new) {
                                options.data = parseQuery(modelConfig, req.query);
                            }
                            var form = new FormType(modelConfig.options, dbModel, document, _.extend({}, req.body, req.files));
                            return form.pre_render(modelConfig, is_new, is_dialog);
                        }
                    ).then(
                        function (locals) {
                            res.render("document.jade", locals);
                        }
                    ).end(
                        function (err) {
                            debug(err.stack);
                            res.send(500, err);
                        }
                    );
                },


                documentInline: function document(req, res) {
                    var prelimConfig = registry.models[req.params.modelName];
                    if (!prelimConfig) throw new TypeError("No model named " + req.params.modelName);
                    var url_id = req.params.documentId,
                        orig_id = req.query.orig,
                        is_new = (url_id === 'new'),
                        id = is_new ? orig_id : url_id;

                    // get document from DB
                    polymorphGetDocument(prelimConfig, id).then(
                        function (document) {
                            var docType = document && document._doc.__t;
                            var modelConfig = !docType ? prelimConfig : registry.models[docType];
                            var dbModel = modelConfig.model;
                            var FormType = modelConfig.options.form,
                                options = _.extend({ instance: document }, modelConfig.options),
                                is_dialog = Boolean(req.query['_dialog']);
                            delete req.query['_dialog'];
                            if (is_new) {
                                options.data = parseQuery(modelConfig, req.query);
                            }
                            var form = new FormType(modelConfig.options, dbModel, document, _.extend({}, req.body, req.files));
                            return form.pre_render(modelConfig, is_new, is_dialog, true);
                        }
                    ).then(
                        function (locals) {
                            res.render("inline.jade", locals);
                        }
                    ).end(
                        function (err) {
                            debug(err.stack);
                            res.send(500, err);
                        }
                    );
                }
            },


            singleMiddleware: function singleMiddleware(req, res, next) {
                var model = registry.models[req.params.modelName].model;
                if (req.params.documentId !== 'single') {
                    next();
                    return;
                }
                model.findOne({}, function (err, doc) {
                    if (err) throw err;
                    req.params.theDoc = doc;
                    next();
                });
            },


            authMiddleware: function authMiddleware(role) {
                return function (req, res, next) {
                    if (req.admin_user || registry._superUser.isReqOk(req)) return next();
                    var sessionStore = req.session && req.session.formageUser;
                    registry.parseSession(sessionStore).then(function afterParseSession(admin_user) {
                        if (!admin_user) {
                            req.session.formageLoginReferrer = req.url;
                            return res.redirect(buildPath('/login'));
                        }

                        if (role && !admin_user.hasPermissions(req.params.modelName, role)) {
                            req.session.formageLoginReferrer = req.url;
                            return res.send('No permissions');
                        }

                        req.admin_user = admin_user;
                        return next();
                    }).end(function (err) {
                        next(err);
                    });
                };
            },


            userPanelMiddleware: function userPanelMiddleware(req, res, next) {
                var user = req.admin_user;
                if (!user) throw new Error("userPanelMiddleware must come after authMiddleware");
                var lastVisit = user.lastVisit ? ', your last visit was on ' + new Date(user.lastVisit).toLocaleDateString() : '';
                res.locals.userPanel = '<div>Hello ' + user.username + lastVisit + '</div>';
                next();
            }
        }
        ;

    return router;
}
;
