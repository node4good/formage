'use strict';
var querystring = require('querystring'),
    permissions = require('./permissions'),
    _ = require('underscore'),
    AdminForm = require('./AdminForm').AdminForm,
    Url = require('url'),
    forms = require('./forms').forms;

var MongooseAdmin;


var json_routes = {
    login: function (req, res, next) {
        MongooseAdmin.singleton.login(req.body.username, req.body.password, function (err, adminUser) {
            if (err) return next(err);
            if (!adminUser) return res.send(401, 'Not authorized');
            req.session._mongooseAdminUser = adminUser.toSessionStore();
            return res.json({});
        });
    },


    documents: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.json(401);
            return;
        }
        var query = querystring.parse(Url.parse(req.url).query);
        MongooseAdmin.singleton.modelCounts(query.collection, function (err, totalCount) {
            if (err) {
                res.json(500);
                return;
            }
            MongooseAdmin.singleton.listModelDocuments(query.collection, query.start, query.count, function (err, documents) {
                if (err) {
                    res.json(500);
                    return;
                }
                res.json({'totalCount': totalCount, 'documents': documents});
            });
        });
    },


    checkDependencies: function (req, res) {
        var modelName = req.body.model;
        var id = req.body.id;
        forms.checkDependecies(modelName, id, function (err, results) {
            var json = _.map(results, function (result) {
                return result.name || result.title || result.toString();
            });
            res.json(json, 200);
        });
    },


    createDocument: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.createDocument(req, adminUser, req.params.collectionName, req.body, function (err) {
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
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.updateDocument(req, adminUser, req.params.collectionName, req.body._id, req.body, function (err) {
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
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        MongooseAdmin.singleton.orderDocuments(adminUser, req.params.collectionName, req.body, function (err) {
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
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        //noinspection JSUnresolvedVariable
        MongooseAdmin.singleton.actionDocuments(adminUser, req.params.collectionName, req.params.actionId, req.body, function (err) {
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

    deleteDocument: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        //noinspection JSUnresolvedVariable
        MongooseAdmin.singleton.deleteDocument(adminUser, req.params.collectionName, req.query.document_id, function (err) {
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
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
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



function render_document_from_form(form, res, modelName, collectionName, allowDelete, cloneable) {
    if (cloneable) {
        form.exclude.push('id');
    }
    form.render_ready(function (err) {
        if (err) return res.redirect('/error');
        var html = form.to_html();
        var head = form.render_head();
        var locals = {
            'pageTitle': 'Admin - ' + modelName,
            'modelName': modelName,
            'collectionName': collectionName,
            'renderedDocument': html,
            'renderedHead': head,
            'adminTitle': MongooseAdmin.singleton.getAdminTitle(),
            'document': {},
            'errors': form.errors ? Object.keys(form.errors).length > 0 : false,
            'allowDelete': allowDelete,
            'rootPath': MongooseAdmin.singleton.root,
            layout: 'layout.jade',
            pretty: true
        };
        return res.render('document.jade', locals);
    });
}



var routes = {
    index: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            console.log('redirecting to', MongooseAdmin.singleton.buildPath('/login'));
            res.redirect(MongooseAdmin.singleton.buildPath('/login'));
        } else {
            MongooseAdmin.singleton.getRegisteredModels(adminUser, function (err, models) {
                if (err) {
                    res.redirect(MongooseAdmin.singleton.buildPath('/error'));
                } else {
                    res.locals = {
                        'pageTitle': 'Admin Site',
                        'models': models,
                        'renderedHead': '',
                        'adminTitle': MongooseAdmin.singleton.getAdminTitle(),
                        'rootPath': MongooseAdmin.singleton.root
                    };
                    res.render('models.jade',
                        {layout: 'layout.jade', locals: {
                            'pageTitle': 'Admin Site',
                            'models': models,
                            'renderedHead': '',
                            'adminTitle': MongooseAdmin.singleton.getAdminTitle(),
                            'rootPath': MongooseAdmin.singleton.root
                        }});
                }
            });
        }
    },


    login: function (req, res) {
        res.locals = {
            pageTitle: 'Admin Login',
            adminTitle: MongooseAdmin.singleton.getAdminTitle(),
            rootPath: MongooseAdmin.singleton.root,
            renderedHead: ''
        };
        res.render('login.jade', {
            layout: 'layout.jade',
            locals: {
                pageTitle: 'Admin Login',
                rootPath: MongooseAdmin.singleton.root
            }
        });
    },


    logout: function (req, res) {
        req.session._mongooseAdminUser = undefined;
        res.redirect(MongooseAdmin.singleton.buildPath('/'));
    },


    model: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            return res.redirect(MongooseAdmin.singleton.buildPath('/login'));
        }
        if (!permissions.hasPermissions(adminUser, req.params.modelName, 'view')) {
            return res.send('no permissions');
        }

        var query = req.query;
        var start = Number(query.start) || 0;
        delete query.start;
        var count = Number(query.count) || 50;
        delete query.count;
        var sort = query.order_by;
        delete query.order_by;
        //noinspection JSUnusedLocalSymbols
        var saved = query.saved;
        delete query.saved;

        var filters = {};
        Object.keys(query).forEach(function (key) { filters[key] = query[key]; });

        MongooseAdmin.singleton.getModel(req.params.modelName, function (err, model, fields, options) {
            if (err) {
                return res.redirect('/error');
            }
            if (model.is_single) {
                return res.redirect(req.path.split('/model/')[0]);
            }
            MongooseAdmin.singleton.modelCounts(req.params.modelName, filters, function (err, totalCount) {
                if (err) {
                    return res.redirect('/');
                }
                MongooseAdmin.singleton.listModelDocuments(req.params.modelName, start, count, filters, sort, function (err, documents) {
                    if (err) {
                        res.redirect('/');
                    } else {
                        var makeLink = function (key, value) {
                            var query = _.clone(req.query);
                            query[key] = value;
                            return '?' + _.map(query,function (value, key) {
                                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
                            }).join('&');
                        };

                        var orderLink = function (key) {
                            if (req.query.order_by == key) {
                                key = '-' + key;
                            }
                            return makeLink('order_by', key);
                        };
                        var model_name = req.params.modelName;
                        var model2 = MongooseAdmin.singleton.models[model_name];
                        res.locals = {
                            pageTitle: 'Admin - ' + model.modelName,
                            totalCount: totalCount,
                            modelName: model_name,
                            model: model,
                            start: start,
                            count: count,
                            current_filters: req.query,
                            makeLink: makeLink,
                            orderLink: orderLink,
                            filters: model2.filters || [],
                            adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                            listFields: options.list,
                            documents: documents,
                            actions: model2.options.actions || [],
                            editable: permissions.hasPermissions(adminUser, model_name, 'update'),
                            sortable: typeof(model2.options.sortable) == 'string' && permissions.hasPermissions(adminUser, model_name, 'order'),
                            cloneable: model2.options.cloneable !== false && permissions.hasPermissions(adminUser, model_name, 'create'),
                            createable: model2.options.createable !== false && permissions.hasPermissions(adminUser, model_name, 'create'),
                            rootPath: MongooseAdmin.singleton.root
                        };
                        res.render('model.jade',
                            {layout: 'layout.jade',
                                locals: res.locals
                            });
                    }
                });
            });
        });
    },

    document_post: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            res.writeHead(401, {"Content-Type": "application/json"});
            res.end();
            return;
        }
        if (req.body._id) {
            if (permissions.hasPermissions(adminUser, req.params.modelName, 'update')) {
                MongooseAdmin.singleton.updateDocument(req, adminUser, req.params.modelName, req.body._id, req.body, function (err, document) {
                    if (err) {
                        if (err.to_html) {
                            render_document_from_form(err, res, req.params.modelName, req.params.modelName, true);
                            return;
                        }
                        res.writeHead(500);
                        res.end();
                    } else {
                        res.redirect(req.path.split('/document/')[0].slice(1) + '?saved=true');
                    }
                });
            }
            else {
                res.send('no permissions');
            }
        }
        else {
            if (!permissions.hasPermissions(adminUser, req.params.modelName, 'create')) {
                return res.send('no permissions');
            }

            MongooseAdmin.singleton.createDocument(req, adminUser, req.params.modelName, req.body, function (form) {
                if (form) {
                    return render_document_from_form(form, res, req.params.modelName, req.params.modelName, false);
                } else {
                    return res.redirect(req.path.split('/document/')[0].slice(1) + '?saved=true');
                }
            });
        }

    },

    document: function (req, res) {
        var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
        if (!adminUser) {
            return res.redirect(MongooseAdmin.singleton.buildPath('/login'));
        }
        if (!permissions.hasPermissions(adminUser, req.params.modelName, 'update')) {
            return res.send('no permissions');
        }
        MongooseAdmin.singleton.getModel(req.params.modelName, function (err, model) {
            if (err) {
                return res.redirect('/error');
            }
            if (model.is_single) {
                model.findOne({}, function (err, document) {
                    if (err) {
                        res.redirect('/error');
                    } else {
                        var FormType0 = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                        var new_form_options = _.extend({instance: document}, MongooseAdmin.singleton.models[req.params.modelName].options);
                        var form = new FormType0(req, new_form_options, model);
                        render_document_from_form(form, res, model.modelName, req.params.modelName, false);
                    }
                });
            }
            else {
                if (req.params.documentId === 'new') {
                    var FormType1 = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                    var new_form_options = _.extend({}, MongooseAdmin.singleton.models[req.params.modelName].options);
                    var form = new FormType1(req, new_form_options, model);
                    render_document_from_form(form, res, model.modelName, req.params.modelName, false);
                } else {
                    MongooseAdmin.singleton.getDocument(req.params.modelName, req.params.documentId, function (err, document) {
                        if (err) {
                            res.redirect('/error');
                        } else {
                            var FormType2 = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                            var new_form_options = _.extend({instance: document}, MongooseAdmin.singleton.models[req.params.modelName].options);
                            var form = new FormType2(req, new_form_options, model);
                            render_document_from_form(form, res, model.modelName, req.params.modelName, true, req.query['clone']);
                        }
                    });
                }
            }
        });
    }
};

exports.registerPaths = function (admin, app, root) {
    MongooseAdmin = admin;
    var inner_express = require.main.require('express')();
    inner_express.set('views', __dirname + '/views');
    inner_express.set('view engine', 'jade');
    inner_express.set("view options", { layout: false, pretty: true });

    inner_express.get('/', routes.index);
    inner_express.get('/login', routes.login);
    inner_express.get('/logout', routes.logout);
    inner_express.get('/model/:modelName', routes.model);
    inner_express.get('/model/:modelName/document/:documentId', routes.document);
    inner_express.post('/model/:modelName/document/:documentId', routes.document_post);

    inner_express.post('/json/login', json_routes.login);
    inner_express.post('/json/dependencies', json_routes.checkDependencies);
    inner_express.get('/json/documents', json_routes.documents);
    inner_express.post('/json/model/:collectionName/order', json_routes.orderDocuments);
    inner_express.post('/json/model/:collectionName/action/:actionId', json_routes.actionDocuments);
    inner_express.post('/json/model/:collectionName/document', json_routes.createDocument);
    inner_express.put('/json/model/:collectionName/document', json_routes.updateDocument);
    inner_express.delete('/json/model/:collectionName/document', json_routes.deleteDocument);
    inner_express.get('/json/model/:collectionName/linkedDocumentsList', json_routes.linkedDocumentsList);
    if (root) {
        app.use(root, inner_express);
        inner_express.admin_root = root;
    }
    return inner_express;
};
