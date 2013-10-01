'use strict';
var Url = require('url'),
    querystring = require('querystring'),
    async = require('async'),
    _ = require('lodash'),
    forms = require('./forms').forms,
    permissions = require('./models/permissions'),
    AdminForm = require('./AdminForm').AdminForm;

var MongooseAdmin;


var json_routes = {
    login: function (req, res, next) {
        MongooseAdmin.singleton.login(req.body.username, req.body.password, function (err, admin_user) {
            if (err)
                return next(err);

            if (!admin_user)
                return res.send(401, 'Not authorized');

            req.session._mongooseAdminUser = admin_user.toSessionStore();
            return res.json({});
        });
    },


    documents: function (req, res) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user)
            return res.json(401);

        var query = querystring.parse(Url.parse(req.url).query);
        MongooseAdmin.singleton.modelCounts(query.collection, function (err, totalCount) {
            if (err)
                return res.json(500);

            MongooseAdmin.singleton.listModelDocuments(query.collection, query.start, query.count, function (err, documents) {
                if (err)
                    return res.json(500);

                res.json({
                    totalCount: totalCount,
                    documents: documents
                });
            });
        });
    },


    checkDependencies: function (req, res) {
        var name = req.body.model,
            id = req.body.id;

        require('./dependencies').check(MongooseAdmin.singleton.models, name, id, function (err, results) {
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
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) ;
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
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) ;
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


function renderForm(res, form, model, allow_delete, clone,dialog) {
    if (clone)
        form.exclude.push('id');

    form.render_ready(function (err) {
        if (err) return res.send(err.stack || err.message || err);

        async.map(model.options.subCollections || [],function(sub,cbk){
            var subDict = _.extend(sub,{count:0,value:form.instance.id});
            if(form.instance.isNew)
                return cbk(null,subDict);
            var relatedModel = MongooseAdmin.singleton.models[sub.model];
            relatedModel.model.count()
                .where(sub.field,form.instance.id)
                .exec(function(err,count){
                    subDict.count = count;
                    cbk(err,subDict);
                });
        },function(err,subs){

            if (err)
                return res.redirect('/error');

            var html = form.to_html(),
                head = form.render_head();

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
                preview:model.options.preview,
                errors: form.errors ? Object.keys(form.errors).length > 0 : false,
                allow_delete: allow_delete,
                layout: 'layout.jade',
                dialog:dialog,
                pretty: true,
                subCollections:subs
            });
        })
    });
}


/**
 * Parse filters from strings to types
 * @param filters
 * dictionary of filters
 * @param search
 * free text search value
 * @return {Object}
 * dict of filters
 */
var parseFilters = function (model_settings, filters, search) {
    var model = model_settings.model;
    var new_filters = {};
    _.each(filters, function (value, key) {
        var parts = key.split('__');
        key = parts[0];
        if (model.schema && model.schema.paths[key]) {
            var type = model.schema.paths[key].options.type;
            if (type == String) {
                new_filters[key] = new RegExp(value, 'i');
            }
            else if (type == Number) {
                new_filters[key] = Number(value) || undefined;
            }
            else if (type == Boolean) {
                new_filters[key] = value == 'true';
            }
            else
                new_filters[key] = value;
        }
        else
            new_filters[key] = value;
        if(parts[1]){
            var dict = {};
            dict['$' + parts[1]] = value;
            new_filters[key] = dict;
        }
    });
    if (search) {
        var search_query = getSearchQuery(model_settings,search);
        if(search_query){
            new_filters['$where'] = search_query;
        }
    }
    return new_filters;
};
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function getSearchQuery(model,searchValue){
    var searchRule = model && model.options && model.options.search;
    if(!searchRule)
        return null;
    var valueRegex = '/' + escapeRegExp(searchValue) + '/i';
    console.log(searchRule);
    if(Array.isArray(searchRule)){
        return searchRule.map(function(field){
            return valueRegex + '.test(this.' + field + ')';
        }).join('||');
    }
    else{
        return searchRule.replace('__value__',valueRegex);
    }
}


var routes = {
    index: function (req, res) {
        MongooseAdmin.singleton.getRegisteredModels(req.admin_user, function (err, models) {
            if (err) return res.redirect(MongooseAdmin.singleton.buildPath('/error'));
            return res.render('models.jade', {
                layout: 'layout.jade',
                pageTitle: 'Admin Site',
                allModels: models,
                renderedHead: '',
                adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                rootPath: MongooseAdmin.singleton.root
            });
        });
    },

    login: function (req, res) {
        res.render('login.jade', {
            layout: 'layout.jade',
            pageTitle: 'Admin Login',
            adminTitle: MongooseAdmin.singleton.getAdminTitle(),
            rootPath: MongooseAdmin.singleton.root,
            renderedHead: ''
        });
    },

    logout: function (req, res) {
        req.session._mongooseAdminUser = undefined;
        res.redirect(MongooseAdmin.singleton.buildPath('/'));
    },

    model: function (req, res) {
        var name = req.params.modelName,
            model = MongooseAdmin.singleton.models[name];

        if (model.is_single)
            return res.redirect(req.path.split('/model/')[0]);

        var isDialog = !!req.query._dialog;
        delete req.query._dialog;
        // query
        var query = req.query,
            start = Number(query.start) || 0;
        delete query.start;
        var count = Number(query.count) || 50;
        delete query.count;
        var currentQuery = _.clone(req.query);
        var sort = query.order_by;
        delete query.order_by;
        /** @namespace query.saved */
        //var saved = query.saved;
        delete query.saved;
        /** @namespace query._search */
        var search_value = query._search || '';
        delete query._search;

        var filters = parseFilters(model, query, search_value);

        MongooseAdmin.singleton.modelCounts(name, filters, function (err, total_count) {
            if (err)
                return res.redirect('/');

            MongooseAdmin.singleton.listModelDocuments(name, start, count, filters, sort, function (err, documents) {
                if (err)
                    return res.redirect('/');

                var makeLink = function (key, value) {
                    var query = _.clone(currentQuery);
                    if(key)
                        query[key] = value;
                    if(isDialog)
                        query['_dialog'] = 'yes';
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
                //noinspection JSUnresolvedVariable
                var schema = model.model.schema.tree;
                var fieldLabel = function(field) {
                    return schema[field] && schema[field].label
                        ? schema[field].label
                        : field[0].toUpperCase() + field.slice(1).replace(/_/g,' ');
                };

                var previewLink = model.options.preview && function(doc){
                    var match,regex = /{([a-zA-Z0-9_!$]+)}/g;
                    return model.options.preview.replace(regex,function(param){
                        return doc[param.substr(1,param.length-2)];
                    });
                };

                var actions = model.options.actions || [];

                res.locals({
                    adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                    pageTitle: 'Admin - ' + model.model.label,
                    rootPath: MongooseAdmin.singleton.root,

                    model_name: name,
                    model: model,
                    list_fields: model.options.list,
                    documents: documents,
                    previewLink:previewLink,

                    total_count: total_count,
                    start: start,
                    count: count,

                    makeLink: makeLink,
                    orderLink: orderLink,
                    fieldLabel: fieldLabel,

                    filters: model.filters || [],
                    current_filters: currentQuery,

                    search: model.options.search,
                    search_value: search_value,
                    cloudinary: require('cloudinary'),
                    actions: actions,
                    editable: permissions.hasPermissions(req.admin_user, name, 'update'),
                    sortable: typeof(model.options.sortable) == 'string' && permissions.hasPermissions(req.admin_user, name, 'order'),
                    cloneable: model.options.cloneable !== false && permissions.hasPermissions(req.admin_user, name, 'create'),
                    creatable: model.options.creatable !== false && permissions.hasPermissions(req.admin_user, name, 'create'),
                    dialog:isDialog
                });
                res.render('model.jade', {
                    layout: 'layout.jade',
                    locals: res.locals
                });
            });
        });
    },

    document: function (req, res) {
        var name = req.params.modelName,
            model = MongooseAdmin.singleton.models[name],
            id = req.params.documentId;

        async.waterfall([
            function(cb) {
                if (model.is_single)
                    model.model.findOne().exec(cb);
                else if (id !== 'new')
                    MongooseAdmin.singleton.getDocument(name, id, cb);
                else
                    cb(null, null);
            },
            function(document, cb) {

                var FormType = model.options.form || AdminForm,
                    options = _.extend({ instance: document }, model.options);
                if(id === 'new') {
                    var filters = _.clone(req.query);
                    delete filters._dialog;
                    var defaultValues = parseFilters(model,filters);
                    options.data = defaultValues;
                }
                var form = new FormType(req, options, model.model);

                cb(null, form);
            }
        ], function(err, form) {
            if (err)
                return res.redirect('/error');

            var editing = !model.is_single && id !== 'new',
                clone = editing ? req.query.clone : false;
            renderForm(res, form, model, editing, clone, !!req.query._dialog);
        });
    },

    documentPost: function (req, res) {
        var name = req.params.modelName,
            doc_id = req.params['documentId'],
            model = MongooseAdmin.singleton.models[name],
            target_url = req.path.split('/document/')[0].slice(1) + '?saved=true';

        if (doc_id === 'new') doc_id = null;
        if (doc_id === 'single') doc_id = req.body['_id'];
        var preview = req.body['_preview'];
        var callback = function (err,doc) {
            if (err) {
                if (err.to_html)
                    return renderForm(res, err, model, true);
                return res.send(500);
            }
            if(preview){
                var match,regex = /{([a-zA-Z0-9_!$]+)}/g;
                var url = model.options.preview.replace(regex,function(param){
                    return doc[param.substr(1,param.length-2)];
                });
                return res.redirect(url);
            }
            if(req.query._dialog && doc){
                var docName = doc.name || doc.title || doc.toString;
                if(typeof(docName) == 'function')
                    docName = docName.call(doc);
                res.render('dialog_callback.jade',{data:{id:doc.id,label:docName}});
            }
            else
                return res.redirect(target_url);
        };
        // Update
        if (doc_id && !req.query.clone) {
            MongooseAdmin.singleton.updateDocument(req, req.admin_user, name, doc_id, req.body, callback);
        // Create
        } else {
            MongooseAdmin.singleton.createDocument(req, req.admin_user, name, req.body, callback);
        }
    },

	renderDialogForm:function(form,req,res){
		form.render_ready(function(err){
			if (err) return res.redirect('/error');

			var html = form.to_html(),
				head = form.render_head();

			return res.render('dialog.jade', {
				rootPath: MongooseAdmin.singleton.root,
				adminTitle: MongooseAdmin.singleton.getAdminTitle(),
				pageTitle: 'Admin',

				renderedDocument: html,
				renderedHead: head,
				error: form.errors ? Object.keys(form.errors).length > 0 : false,
				dialog:true,
				pretty: true
			});
		});
	},
	dialogGet:function(req,res){
		var dialogName = req.params.dialogName;
		var dialog = MongooseAdmin.singleton.dialogs[dialogName];
		if(!dialog)
			return res.send(500,'unknown dialog');

		var form = new dialog.form(req);
		return routes.renderDialogForm(form,req,res);
	},

	dialogPost:function(req,res){
		var dialogName = req.params.dialogName;
		var dialog = MongooseAdmin.singleton.dialogs[dialogName];
		if(!dialog)
			return res.send(500,'unknown dialog');

		var form = new dialog.form(req);
		form.is_valid(function(err,valid){
			if(err)	return res.send(500,err);
			if(!valid){
				return routes.renderDialogForm(form,req,res)
			}
			else{
				var data = form.clean_values;
				res.render('dialog_callback.jade',{data:data});
			}
		});
	}
};


var auth = function(role) {
    return function(req, res, next) {
        var admin_user = MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser);
        if (!admin_user)
            return res.redirect(MongooseAdmin.singleton.buildPath('/login'));

        if (role && !permissions.hasPermissions(admin_user, req.params && req.params.modelName, role))
            return res.send('No permissions');

        req.admin_user = admin_user;

		res.locals({
			tabs:(MongooseAdmin.singleton.tabs || []).filter(function(tab){
                return !tab.permission || permissions.hasPermissions(admin_user,'',tab.permission);
            })
		});
        next();
    };
};

function userPanel(req,res,next){
    MongooseAdmin.singleton.renderUserPanel(req,function(err,html){
        if (err) return res.redirect(MongooseAdmin.singleton.buildPath('/error'));

        res.locals({userPanel:html,tab:''});
        next();
    });
}


module.exports = function (admin, outer_app, root) {
    MongooseAdmin = admin;

    var app = require.main.require('express')();
    app.engine('jade', require('jade').__express);
    app.set('views', __dirname + '/views');

    app.get('/', auth(),userPanel, routes.index);
    app.get('/login', routes.login);
    app.get('/logout', routes.logout);
    app.get('/model/:modelName', auth('view'),userPanel, routes.model);
    app.get('/model/:modelName/document/:documentId', auth('update'), routes.document);
    app.post('/model/:modelName/document/:documentId', auth(), routes.documentPost);
	app.get('/dialog/:dialogName',auth(),routes.dialogGet);
	app.post('/dialog/:dialogName',auth(),routes.dialogPost);

    app.post('/json/login', json_routes.login);
    app.post('/json/dependencies', json_routes.checkDependencies);
    app.get('/json/documents', json_routes.documents);
    app.post('/json/model/:collectionName/order', json_routes.orderDocuments);
    app.post('/json/model/:collectionName/action/:actionId', json_routes.actionDocuments);
    app.post('/json/model/:collectionName/document', json_routes.createDocument);
    app.put('/json/model/:collectionName/document', json_routes.updateDocument);
    app.delete('/json/model/:collectionName/document', json_routes.deleteDocument);
    app.get('/json/model/:collectionName/linkedDocumentsList', json_routes.linkedDocumentsList);
	if(MongooseAdmin.singleton.tabs){
		MongooseAdmin.singleton.tabs.forEach(function(tab){
			tab.handler.engine('jade', require('jade').__express);
			//tab.handler.set("view options", { layout: __dirname + "/views/layout.jade" });
			tab.handler.locals({rootPath:root,tab:tab.root});
			tab.handler.use(auth(tab.permission));
			tab.handler.loadRoutes();
			app.use('/' + tab.root, tab.handler);
			if(tab.permission)
				permissions.registerPermission(tab.permission);
		});
	}

    if (root) {
        outer_app.use(root, app);
        outer_app.admin_app = app;
        app.admin_root = root;
    }
    return app;
};
