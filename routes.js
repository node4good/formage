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
            req.session.save();
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

        if(MongooseAdmin.singleton.ignoreDependencies)
            return res.json([],200);

        require('./dependencies').check(false,MongooseAdmin.singleton.models, name, id, function (err, results) {
            var json = _(results).compact().map(function (result) {
                return result.name || result.title || result.toString();
            }).valueOf();
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
        return MongooseAdmin.singleton.actionDocuments(admin_user, req.params.collectionName, req.params.actionId, req.body, function (err,result) {
            if (err) {
                console.error(err.stack || err.message || err);
                return res.json(422, {error: err.message || err});
            }
            return res.json({"collection": req.params.collectionName,result:result});
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


function renderForm(res, form, model, allow_delete, clone,dialog,user) {
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

            var actions = (form.instance.isNew ? [] : model.options.actions || []).filter(function(action){
                return permissions.hasPermissions(user, model.modelName,action.value);
            });
            return res.render('document.jade', {
                rootPath: MongooseAdmin.singleton.root,
                adminTitle: MongooseAdmin.singleton.getAdminTitle(),
                pageTitle: 'Admin - ' + model.model.label,

                model: model.model,
                model_name: model.modelName,
                model_label: model.label,
                form:form,
                renderedDocument: html,
                renderedHead: head,
                document: {},
                actions: actions,
                preview:model.options.preview,
                errors: form.errors ? Object.keys(form.errors).length > 0 : false,
                generalError:form.errors['__self__'] || '',
                allow_delete: allow_delete,
                layout: 'layout.jade',
                dialog:dialog,
                pretty: true,
                editable: permissions.hasPermissions(user, model.modelName, 'update'),
                deleteable: permissions.hasPermissions(user, model.modelName, 'delete'),
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
var parseFilters = function (model_settings, filters, search,dontRegex) {
    var model = model_settings.model;
    var new_filters = {};
    _.each(filters, function (value, key) {
        if(key == '_search' || key == 'start' || key == 'saved' || key == '_dialog')
            return;
        try{
            value = JSON.parse(value);
        }
        catch(e){}
        var parts = key.split('__');
        key = parts[0];
        if (model.schema && model.schema.paths[key] && typeof(value) != 'object') {
            var type = model.schema.paths[key].options.type;
            if (type == String) {
                value = (value || '').toString().trim();
                new_filters[key] = dontRegex ? value : new RegExp(value, 'i');
            }
            else if (type == Number) {
                new_filters[key] = Number(value) || undefined;
            }
            else if (type == Boolean) {
                new_filters[key] = value === true;
            }
            else if(type.name == 'ObjectId' && value == 'null')
                new_filters[key] = null;
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
            for(var key in search_query)
                new_filters[key] = search_query[key];
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
    if(model.options.searchTranslate)
        searchValue = model.options.searchTranslate(searchValue);

    var valueEscaped = escapeRegExp(searchValue);
    var query;
    if(typeof(searchRule) == 'function')
        return searchRule(searchValue);
    if(Array.isArray(searchRule)){
//        query = searchRule.map(function(field){
//            return '/__value__/i.test(this.' + field + ')';
//        }).join('||');
        return {$or:searchRule.map(function(field){
            var obj = {};
            obj[field] = RegExp('^' + valueEscaped,'i');
            return obj;
        })};
    }
    else{
        query = searchRule;
    }
    if(query.indexOf('__value__') > -1)
        return {$where:query.replace('__value__',valueEscaped)};
    else {
        var obj = {};
        obj[query] = RegExp('^' + valueEscaped,'i');
        return obj;
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

    exportToCSV:function(req,res){
        var name = req.params.modelName,
            model = MongooseAdmin.singleton.models[name];

        if (model.is_single)
            return res.redirect(req.path.split('/model/')[0]);

        delete req.query._dialog;
        // query
        var query = req.query;
        var currentQuery = _.clone(req.query);
        var sort = query.order_by;
        delete query.order_by;
        delete query.saved;
        var search_value = query._search || '';
        delete query._search;

        var filters = parseFilters(model, query, search_value);
        MongooseAdmin.singleton.streamModelDocuments(req.admin_user,name, filters, sort, function (err, stream) {
            if (err)
                return res.redirect('/');

            stream.on('error',function(error){
                console.error(error.stack);
                if(!headSent && !responseFinished) {
                    res.status(500);
                    res.send(error.stack);
                    headSent = true;
                    responseFinished = true;
                }
            });
            stream.on('close',function(){
                console.log('closing');
                if(!headSent){
                    res.header('Content-Disposition','attachment; filename=' + name + '.csv');
                    res.header('Content-Type','text/csv');
                    res.status(200);
                    headSent = true;
                }
                if(!responseFinished) {
                    res.end();
                    responseFinished = true;
                }
            });
            var listFields = MongooseAdmin.singleton.models[name].options.exportFields || MongooseAdmin.singleton.models[name].options.list || [];

            var headSent = false, responseFinished = false;
            stream.on('data',function(doc){
                if(!headSent){
                    res.header('Content-Disposition','attachment; filename=' + name + '.csv');
                    res.header('Content-Type','text/csv');
                    res.status(200);
                    headSent = true;
                    var schema = model.model.schema.tree;
                    res.write('ID');
                    listFields.forEach(function (listField) {
                        res.write(',' + (schema[listField] && schema[listField].label
                            ? schema[listField].label
                            : listField[0].toUpperCase() + listField.slice(1).replace(/_/g,' ')));
                    });
                    res.write('\n');
                }
                res.write(doc.id);
                listFields.forEach(function (listField) {
                    var text = ((typeof(doc[listField]) == 'function' ? doc[listField]() : doc.get(listField)) || '') + '';
                    text = text.replace(/<.*?>/g,'');
                    text = text.replace(/"/g,'""');
                    res.write(',"' + text + '"');
                });
                res.write('\n');
            });
        });
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
        MongooseAdmin.singleton.modelCounts(req.admin_user,name, filters, function (err, total_count) {
            if (err)
                return res.redirect('/');

            MongooseAdmin.singleton.listModelDocuments(req.admin_user,name, start, count, filters, sort, function (err, documents) {
                if (err)
                    return res.redirect('/');

                var makeLink = function (key, value) {
                    var query = _.clone(currentQuery);
                    if(key){
                        if(value == '__all__')
                            delete query[key];
                        else
                            query[key] = value;
                    }
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

                var actions = (model.options.actions || []).filter(function(action){
                    return permissions.hasPermissions(req.admin_user, name,action.value);
                });

                _.extend(res.locals,{
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

                    cloudinary:function() { try { return require('cloudinary'); } catch(ex){ return null; } },
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
                    MongooseAdmin.singleton.getDocument(req.admin_user,name, id, parseFilters(model,_.clone(req.query)), cb);
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
            renderForm(res, form, model, editing, clone, !!req.query._dialog,req.admin_user);
        });
    },

    documentPost: function (req, res) {
        var name = req.params.modelName,
            doc_id = req.params['documentId'],
            model = MongooseAdmin.singleton.models[name],
            target_url = MongooseAdmin.singleton.root + req.path.split('?')[0] + '?saved=true';

        if (doc_id === 'new') doc_id = null;
        if (doc_id === 'single') doc_id = req.body['_id'];
        var preview = req.body['_preview'];
        var callback = function (err,doc) {
            if (err) {
                if (err.to_html) {
                    var clone = req.query.clone;
                    return renderForm(res, err, model, true, clone, !!req.query._dialog, req.admin_user);
                }
                return res.send(500);
            }
            //if(preview){
            //    var match,regex = /{([a-zA-Z0-9_!$]+)}/g;
            //    var url = model.options.preview.replace(regex,function(param){
            //        return doc[param.substr(1,param.length-2)];
            //    });
            //    return res.redirect(url);
            //}
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
            MongooseAdmin.singleton.updateDocument(req,req.admin_user, name, doc_id, parseFilters(model,_.clone(req.query)), req.body, callback);
        // Create
        } else {
            MongooseAdmin.singleton.createDocument(req, req.admin_user, name, req.body, callback);
        }
    },

	renderDialogForm:function(form,dialog,req,res){
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
                dialogOptions:dialog,
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
		return routes.renderDialogForm(form,dialog,req,res);
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
				return routes.renderDialogForm(form,dialog,req,res)
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

		res.locals.tabs = (MongooseAdmin.singleton.tabs || []).filter(function(tab){
                return !tab.permission || permissions.hasPermissions(admin_user,'',tab.permission);
            });
        next();
    };
};

function userPanel(req,res,next){
    MongooseAdmin.singleton.renderUserPanel(req,function(err,html){
        if (err) return res.redirect(MongooseAdmin.singleton.buildPath('/error'));

        res.locals.userPanel = html;
        res.locals.tab = '';
        next();
    });
}


module.exports = function (admin, outer_app, root) {
    MongooseAdmin = admin;

    var app = require('express')();
    app.engine('jade', require('jade').__express);
    app.set('views', __dirname + '/views');

    app.use(multipartMiddleware);

    app.use(function(req,res,next){
        if(MongooseAdmin.singleton)
            res.locals.__ = getText;
        else
            res.locals.__ = identity;
        next();
    });

    app.get('/', auth(),userPanel, routes.index);
    app.get('/login', routes.login);
    app.get('/logout', routes.logout);
    app.get('/model/:modelName', auth('view'),userPanel, routes.model);
    app.get('/model/:modelName/document/:documentId', auth('view'), routes.document);
    app.post('/model/:modelName/document/:documentId', auth('update'), routes.documentPost);
    app.get('/model/:modelName/export', auth('view'), routes.exportToCSV);
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
            _.extend(tab.handler.locals,{rootPath:root,tab:tab.root});
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


var multiparty = require('multiparty')
    , qs = require('qs');

function multipartMiddleware(req,res,next){

    if(req.files)
        return next();
    // ignore GET
    if ('GET' == req.method || 'HEAD' == req.method) return next();
    // check Content-Type
    if (!/multipart/i.test(req.header('content-type'))) return next();

    var form = new multiparty.Form({})
        , data = {}
        , files = {}
        , done;

    function ondata(name, val, data){
        if (Array.isArray(data[name])) {
            data[name].push(val);
        } else if (data[name]) {
            data[name] = [data[name], val];
        } else {
            data[name] = val;
        }
    }

    form.on('field', function(name, val){
        ondata(name, val, data);
    });

    form.on('file', function(name, val){
        val.name = val.originalFilename;
        val.type = val.headers['content-type'] || null;
        ondata(name, val, files);
    });

    form.on('error', function(err){
        err.status = 400;
        next(err);
    });

    form.on('close', function(){
        if (done) return;
        try {
            req.body = qs.parse(data);
            req.files = qs.parse(files);
        } catch (err) {
            form.emit('error', err);
            return;
        }
        next();
    });

    form.parse(req);
    try{
	req.resume();
    }
    catch(ex) {}
}

var translations = {};
var fs = require('fs');
try {
    translations = JSON.parse(fs.readFileSync('./admin-locale.json','utf8'));
}
catch(e){}
function getText(original){
    if(original in translations)
        return translations[original];
    translations[original] = original;
    fs.writeFile('./admin-locale.json',JSON.stringify(translations),function(e){
        e && console.error(e);
    });
    return original;
}

function identity(str){
    return str;
}