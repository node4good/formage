'use strict';
const _ = require('lodash-contrib');
const dependencies = require('./dependencies');


function polymorphicGetDocument(Model, isSingle, id) {
    if (isSingle) {
        return Model.findOne();
    }
    if (id && id !== 'new') {
        return Model.findById(id);
    }
    return Promise.resolve(new Model);
}


module.exports = function (registry) {
    const parseQuery = function parseQuery(modelConfig, query) {
        let rawSearchValue = query._search;
        delete query._search;
        const model = modelConfig.model;
        const paths = registry.adapter.getPaths(model);
        const new_filters = _.reduce(
            query,
            function (seed, value, key) {
                const parts = key.split('__');
                key = parts[0];
                if (parts[1]) {
                    const op = '$' + parts[1];
                    seed[key] = _.object([op], [value]);
                    return seed;
                }
                let path = paths.find({db_path: key});
                if (!path) return seed;
                const type = path.type && path.type.name;
                switch (type) {
                    case 'String':
                        seed[key] = new RegExp(value, 'i');
                        break;
                    case 'Number':
                        seed[key] = Number(value) || undefined;
                        break;
                    case 'Boolean':
                        seed[key] = Boolean(value === 'true');
                        break;
                    default:
                        seed[key] = (value === 'null') ? null : value;
                }
                return seed;
            },
            {}
        );

        // if we have search term
        let searchRule = modelConfig.options.search;
        if (!searchRule || !rawSearchValue) return new_filters;
        const searchValue = _.regexEscape(rawSearchValue);
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
    };


    function buildPath(path) {
        return registry.root + path;
    }


    function readyForm(form, modelConfig, isNew, isDialog) {
        return form.pre_process().then(function onPreRender() {
            const locals = {
                rootPath: registry.root,
                adminTitle: registry.title,
                pageTitle: 'Admin - ' + modelConfig.model.label,

                model: modelConfig.model,
                model_name: modelConfig.modelName,
                model_label: modelConfig.label,

                form: form,
                renderedHead: form.render_head(),
                document: {},
                actions: form.instance.isNew ? [] : modelConfig.actions,
                errors: form.errors || {},
                allow_delete: !modelConfig.is_single && !isNew,
                isDialog: isDialog,
                pretty: true
            };

            const subCols = modelConfig.options.subCollections || [];
            const ps = subCols.map(sub => {
                const subDict = _.extend(sub, {count: 0, value: form.instance.id});
                if (form.instance.isNew) return Promise.resolve(subDict);
                const relatedModel = registry.models[sub.model];
                sub.label = sub.label || relatedModel.modelName;
                //noinspection JSUnresolvedVariable
                return relatedModel.model.count()
                    .where(sub.field, form.instance.id)
                    .exec(function (err, count) {
                        subDict.count = count;
                    });
            });
            return Promise.all(ps).then(subs => {
                locals.subCollections = subs;
                return locals;
            });
        });
    }


    function arrangeSections(models) {
        const sections = _(models)
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


    function upsertDocument(req) {
        const modelName = req.params.modelName;
        const id = req.params.documentId;
        const user = req.admin_user;
        const data = _.extend({}, req.body, req.files);
        let modelConfig = registry.models[modelName];
        let form;

        return polymorphicGetDocument(modelConfig.model, modelConfig.is_single, id)
            .then(
                function createTheForm(document) {
                    const action = document ? 'update' : 'create';
                    const docType = document && document._doc.__t;
                    if (docType) {
                        modelConfig = registry.models[docType];
                    }
                    const FormType = modelConfig.options.form;
                    if (!user.hasPermissions(modelConfig.modelName, action)) throw new Error('unauthorized');
                    form = new FormType(modelConfig.options, modelConfig.model, document, data);
                    return form.save();
                }
            ).then(
                function (document) {
                    modelConfig.options.post(document);
                    return form;
                }
            ).catch(
                function (err) {
                    if (err instanceof Error) {
                        if (_.isEmpty(form && form.errors)) {
                            form.errors = form.errors || {};
                            form.errors.exception = err;
                        } else {
                            if (err.message !== "not valid") console.error(err);
                        }
                    }
                    form.modelConfig = modelConfig;
                    throw form;
                }
            );
    }


    const router = {
        json_routes: {
            // in use by document->delete button (1)
            checkDependencies: function checkDependencies(req, res) {
                const modelName = req.params.modelName,
                    id = req.params.documentId,
                    models = _.map(registry.models, 'model');

                dependencies.check(models, modelName, id, function (err, depPair) {
                    if (err) throw err;
                    if (_.isEmpty(depPair)) return res.json(200, []);
                    const deps = depPair[1];
                    const lines = dependencies.depsToLines(deps);
                    return res.json(200, lines);
                });
            },


            // In use by related-model-modal
            upsertDocument: function upsertDocumentController(req, res) {
                upsertDocument(req).then(
                    function (form) {
                        res._debug_form = form;
                        const response = form.instance.toJSON();
                        response.id = response.id || form.instance._id;
                        response.label = response.label || form.instance.name || form.instance.title || form.instance.toString();
                        res.json(200, response);
                    }
                ).catch(
                    function (form) {
                        res.json(422, form.stack || form);
                    }
                );
            },


            orderDocuments: function orderDocuments(req, res) {
                const modelName = req.params.modelName,
                    data = req.body;
                if (!req.admin_user.hasPermissions(modelName, 'update')) throw new Error('unauthorized');
                const modelConfig = registry.models[modelName];
                let sorting_attr = modelConfig.sortable;
                if (!sorting_attr) throw new TypeError("No sorting attribute for model " + modelName);
                async.forEach(Object.keys(data), function (id, cb) {
                    const set_dict = _.object([
                        [sorting_attr, data[id]]
                    ]);
                    modelConfig.model.update({_id: id}, {'$set': set_dict}, cb);
                }, function (err) {
                    if (err) throw err;
                    res.json({"collection": modelName});
                });
            },


            actionDocuments: function actionDocuments(req, res) {
                const modelName = req.params.modelName,
                    actionId = req.params['actionId'],
                    ids = req.body.ids,
                    model = registry.models[modelName];

                if (!req.admin_user.hasPermissions(modelName, 'update'))
                    throw new Error('unauthorized');

                let action = _.find(model.actions, {id: actionId});
                if (!action)
                    throw new TypeError('Could not find action with id=' + actionId);

                return action.func.call(model, req.admin_user, ids, function (err, message) {
                    if (err) return res.json(422, {error: err.message});
                    return res.json(message || 'All is good.');
                });
            }
        },


        routes: {
            index: function index(req, res) {
                const models = registry.getAccessibleModels(req.admin_user);
                const sections = arrangeSections(models);
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


            postLogin: function postLogin(req, res) {
                registry.adapter.UsersModel.getByUsernamePassword(req.body.username, req.body.password, function (admin_user) {
                    if (!admin_user) {
                        return res.redirect(buildPath('/login') + '?error=true');
                    }

                    req.session._FormageUser = admin_user.toSessionStore();
                    const dest = buildPath(req.session._loginReferrer || '');
                    delete req.session._loginReferrer;
                    return res.redirect(dest);
                });
            },


            logout: function logout(req, res) {
                delete req.session._FormageUser;
                res.redirect('/');
            },


            model: function model(req, res) {
                const name = req.params.modelName;
                let modelConfig = registry.models[name];

                if (!modelConfig) throw new Error("No model named " + req.params.modelName);

                if (modelConfig.is_single) {
                    res.redirect(req.path.split('/model/')[0]);
                    return;
                }

                // query
                const query = _.clone(req.query);
                const sortable = modelConfig.sortable && req.admin_user.hasPermissions(name, 'order');
                if (sortable) {
                    delete query.start;
                    delete query.count;
                }

                const start = Number(query.start) || 0;
                delete query.start;

                const isDialog = Boolean(query._dialog);
                delete query._dialog;

                const count = Number(query.count) || modelConfig.defaultCount;
                delete query.count;

                const sort = query.order_by;
                delete query.order_by;

                delete query['saved'];

                const filters = parseQuery(modelConfig, query);

                const p = (modelConfig.is_single) ? Promise.resolve(1) : modelConfig.model.count(filters).exec();

                p.then(
                    function (total_count) {
                        res.locals['total_count'] = total_count;
                        const model_config = registry.models[name];
                        const dbModel = model_config.model;
                        const sorts = _.clone(model_config.order_by) || [];
                        const populates = model_config.options.list_populate;
                        const listFields = model_config.options.list || [];
                        if (sort) sorts.unshift(sort);
                        return registry.adapter.queryDocuments(listFields, dbModel, filters, sorts, populates, start, count);
                    }
                ).then(
                    function (documents) {
                        const makeLink = res.locals['makeLink'] = function (key, value) {
                            const query = _.clone(req.query);
                            if (key) {
                                query[key] = value;
                            }
                            return '?' + _(query).map(function (v, k) {
                                    if (!v || !k) return null;
                                    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
                                }).compact().join('&');
                        };
                        const paths = registry.adapter.getPaths(modelConfig.model);
                        const table = {
                            header: modelConfig.fieldsInTable.map(function (field_path) {
                                const capitalized = _.humanize(field_path);
                                let fieldConfig = paths.find({db_path: field_path});
                                if (!fieldConfig) {
                                    return {label: capitalized};
                                }
                                const label = fieldConfig.label || capitalized;
                                let key = String(field_path);
                                const type = fieldConfig.type.name;
                                if (req.query.order_by == field_path) {
                                    key = '-' + key;
                                }
                                const link = makeLink('order_by', key);
                                const obj = {
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
                                const data = modelConfig.fieldsInTable.map(function (field_path) {
                                    const fieldConfig = paths.find({db_path: field_path});
                                    const type = fieldConfig && fieldConfig.type.name;
                                    const value = doc.get(field_path);
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
                ).catch(
                    function (err) {
                        console.log(err.stack);
                        res.send(500);
                    }
                );

                return p;
            },


            document: function document(req, res) {
                let prelimConfig = registry.models[req.params.modelName];
                if (!prelimConfig) throw new TypeError("No model named " + req.params.modelName);
                const url_id = req.params.documentId,
                    orig_id = req.query.orig,
                    is_new = (url_id === 'new'),
                    id = is_new ? orig_id : url_id;

                // get document from DB
                polymorphicGetDocument(prelimConfig.model, prelimConfig.is_single, id).then(
                    function (document) {
                        const docType = document && document._doc.__t;
                        const modelConfig = !docType ? prelimConfig : registry.models[docType];
                        const dbModel = modelConfig.model;
                        const FormType = modelConfig.options.form,
                            options = _.extend({instance: document}, modelConfig.options),
                            is_dialog = Boolean(req.query['_dialog']);
                        delete req.query['_dialog'];
                        if (is_new) {
                            options.data = parseQuery(modelConfig, req.query);
                        }
                        const form = new FormType(modelConfig.options, dbModel, document, _.extend({}, req.body, req.files));
                        return readyForm(form, modelConfig, is_new, is_dialog);
                    }
                ).then(
                    function (locals) {
                        res.render("document.jade", locals);
                    }
                ).catch(
                    function (err) {
                        console.log(err.stack);
                        res.send(500);
                    }
                );
            },


            documentPost: function documentPost(req, res) {
                const is_dialog = Boolean(req.query['_dialog']),
                    is_new = req.params.documentId === 'new';

                upsertDocument(req).then(
                    function (form) {
                        res._debug_form = form;
                        const retURL = buildPath(req.path.split('/document/')[0]);
                        return res.redirect(retURL);
                    }
                ).catch(
                    function (form) {
                        if (form instanceof Error) {
                            console.error(form.stack || form);
                            res.send(500, form.stack || form);
                            return;
                        }
                        readyForm(form, form.modelConfig, is_new, is_dialog).then(function (locals) {
                            res.status(422);
                            res.render("document.jade", locals);
                        }).catch(function (err) {
                            res.send(500, err);
                        });
                    }
                );
            }
        },


        singleMiddleware: function singleMiddleware(req, res, next) {
            const model = registry.models[req.params.modelName].model;
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
                if (req.admin_user) return next();
                let admin_user = req.session && registry.adapter.getAdminUser(req.session._FormageUser);
                if (!admin_user) {
                    req.session._loginReferrer = req.url;
                    return res.redirect(buildPath('/login'));
                }

                if (role && !admin_user.hasPermissions(req.params.modelName, role)) {
                    req.session._loginReferrer = req.url;
                    return res.send('No permissions');
                }

                req.admin_user = admin_user;
                return next();
            };
        },

        userPanelMiddleware: function userPanelMiddleware(req, res, next) {
            let user = req.admin_user;
            if (!user) throw new Error("userPanelMiddleware must come after authMiddleware");
            const lastVisit = user.lastVisit ? ', your last visit was on ' + new Date(user.lastVisit).toLocaleDateString() : '';
            res.locals.userPanel = '<div>Hello ' + user.username + lastVisit + '</div>';
            next();
        }
    };

    return router;
}
;
