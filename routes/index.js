var querystring = require('querystring'),
    Url = require('url'),
    permissions = require('../permissions'),
     _ = require('underscore'),
    AdminForm = require('../form').AdminForm,
    forms = require('j-forms').forms;
 //   Renderer = require('../renderer.js').Renderer;

var MongooseAdmin;	

exports.setAdmin = function(admin){
	MongooseAdmin = admin;
};


 
exports.index = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        console.log('redirecting to', MongooseAdmin.singleton.buildPath('/login'));
        res.redirect(MongooseAdmin.singleton.buildPath('/login'));
    } else {
        MongooseAdmin.singleton.getRegisteredModels(adminUser,function(err, models) {
            if (err) {
                res.redirect('/error');
            } else {
                var config = MongooseAdmin.singleton.pushExpressConfig();
                res.locals =  {
                    'pageTitle': 'Admin Site',
                    'models': models,
                    'renderedHead': '',
                    'adminTitle':MongooseAdmin.singleton.getAdminTitle(),
                    'rootPath': MongooseAdmin.singleton.root
                };
                res.render('models.jade',
                           {layout: 'layout.jade' , locals: {
                               'pageTitle': 'Admin Site',
                               'models': models,
                               'renderedHead': '',
                               'adminTitle':MongooseAdmin.singleton.getAdminTitle(),
                               'rootPath': MongooseAdmin.singleton.root
                           }});
                MongooseAdmin.singleton.popExpressConfig(config);
            }
        });
    }
};

exports.login = function(req, res) {
    var config = MongooseAdmin.singleton.pushExpressConfig();
    res.locals =  {
        'pageTitle': 'Admin Login',
        adminTitle:MongooseAdmin.singleton.getAdminTitle(),
        'rootPath': MongooseAdmin.singleton.root,
        renderedHead:''
    };
    res.render('login.jade',
               {layout: 'layout.jade',
                locals: {
                      'pageTitle': 'Admin Login',
                       'rootPath': MongooseAdmin.singleton.root
                }
               });
    MongooseAdmin.singleton.popExpressConfig(config);
};

exports.logout = function(req, res) {
    req.session._mongooseAdminUser = undefined;
    res.redirect(MongooseAdmin.singleton.buildPath('/'));
};

exports.model = function(req, res) {
    var query = querystring.parse(Url.parse(req.url).query);
    var start = query.start ? parseInt(query.start) : 0;
    var count = query.count ? parseInt(query.count) : 50;

    var filters = {};
    for(var key in query) {
        if(key != 'start' && key != 'count' && key != 'order_by' && key != 'saved' && query[key])
            filters[key] = query[key];
    }
	
    var sort = query.order_by;



    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.redirect(MongooseAdmin.singleton.buildPath('/login'));
    } else {
        if(permissions.hasPermissions(adminUser,req.params.modelName,'view'))
        {
            MongooseAdmin.singleton.getModel(req.params.modelName, function(err, model, fields, options) {
            if (err) {
                res.redirect('/error');
            } else {
                if(model.is_single)
                {
                    res.redirect(req.path.split('/model/')[0]);
                    return;
                }
                MongooseAdmin.singleton.modelCounts(req.params.modelName,filters, function(err, totalCount) {
                    if (err) {
                        res.redirect('/');
                    } else {
                        MongooseAdmin.singleton.listModelDocuments(req.params.modelName, start, count,filters,sort, function(err, documents) {
                            if (err) {
                                res.redirect('/');
                            } else {
                                        var makeLink = function(key,value) {
                                            var query = _.clone(req.query);
                                            query[key] = value;
                                            return '?' + _.map(query,function(value,key) {
                                                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
                                            }).join('&');
                                        };

                                        var orderLink = function(key) {
                                            if(req.query.order_by == key )
                                                key = '-' + key;
                                            return makeLink('order_by',key);
                                        };
                                var config = MongooseAdmin.singleton.pushExpressConfig();
                                res.locals = {
                                    'pageTitle': 'Admin - ' + model.modelName,
                                    'totalCount': totalCount,
                                    'modelName': req.params.modelName,
                                    'model': model,
                                    'start': start,
                                    'count': count,
                                    'current_filters':req.query,
                                    makeLink:makeLink,
                                    orderLink:orderLink,
                                    'filters':MongooseAdmin.singleton.models[req.params.modelName].filters || [],
                                    'adminTitle':MongooseAdmin.singleton.getAdminTitle(),
                                    'listFields': options.list,
                                    'documents': documents,
                                    'actions':MongooseAdmin.singleton.models[req.params.modelName].options.actions || [],
                                    'editable': permissions.hasPermissions(adminUser,req.params.modelName,'update'),
                                    'sortable': typeof(MongooseAdmin.singleton.models[req.params.modelName].options.sortable) == 'string' &&
                                        permissions.hasPermissions(adminUser,req.params.modelName,'order'),
                                    'cloneable' :  typeof(MongooseAdmin.singleton.models[req.params.modelName].options.cloneable) != 'undefined'
                                        && (MongooseAdmin.singleton.models[req.params.modelName].options.createable === false ? false : true)
                                        && permissions.hasPermissions(adminUser,req.params.modelName,'create'),
                                    'createable' : (MongooseAdmin.singleton.models[req.params.modelName].options.createable === false ? false : true) && permissions.hasPermissions(adminUser,req.params.modelName,'create'),
                                    'rootPath': MongooseAdmin.singleton.root
                                };
                                res.render('model.jade',
                                           {layout: 'layout.jade',
                                            locals: res.locals
                                           });
                                MongooseAdmin.singleton.popExpressConfig(config);
                            }
                        });
                    }
                });
            }
        });
        }
        else
        {
            res.send('no permissions');
        }
    }
};

exports.document_post = function(req,res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        if(req.body._id && req.body._id != ''){
            if(permissions.hasPermissions(adminUser,req.params.modelName,'update'))
            {
                    MongooseAdmin.singleton.updateDocument(req,adminUser, req.params.modelName, req.body._id, req.body, function(err, document) {
                    if (err) {
                        if(err.render_str)
                        {
                            render_document_from_form(err,req,res,req.params.modelName,req.params.modelName,true);
                            return;
                        }
                        res.writeHead(500);
                        res.end();
                    } else {
                        res.redirect(req.path.split('/document/')[0] + '?saved=true');
    //                    res.writeHead(200, {"Content-Type": "application/json"});
    //                    res.write(JSON.stringify({"collection": req.params.collectionName}));
    //                    res.end();
                    }
                });
            }
            else
            {
                res.send('no permissions');
            }
        }
        else
        {
            if(permissions.hasPermissions(adminUser,req.params.modelName,'create'))
            {

                MongooseAdmin.singleton.createDocument(req,adminUser, req.params.modelName, req.body, function(err, document) {
                    if (err) {
                        if(err.render_str)
                        {
                            render_document_from_form(err,req,res,req.params.modelName,req.params.modelName,false);
                            return;
                        }
                        if(typeof(err)=='object')
                        {
                            res.json(err,400);
                        }
                        else
                        {
                            res.writeHead(500);
                            res.end();
                        }
                    } else {
                        res.redirect(req.path.split('/document/')[0] + '?saved=true');
        //                res.writeHead(201, {"Content-Type": "application/json"});
        //                res.write(JSON.stringify({"collection": req.params.collectionName}));
        //                res.end();
                    }
                });
            }
            else
            {
                res.send('no permissions');
            }
        }
    }

};

function render_document_from_form(form,req,res,modelName,collectionName,allowDelete,cloneable)
{
    if(cloneable)
        form.exclude.push('id');
    form.render_ready(function(err)
    {
        if(err)
            res.redirect('/error');
        else
        {
            var html = form.render_str();
            var head = form.render_head();
            var config = MongooseAdmin.singleton.pushExpressConfig();
            res.locals = {
                'pageTitle': 'Admin - ' + modelName,
                //                'models': models,
                'modelName': modelName,
                'collectionName':collectionName,
                //                'model': model,
                //                'fields': fields,
                'renderedDocument': html,
                'renderedHead':head,
                'adminTitle':MongooseAdmin.singleton.getAdminTitle(),
                'document': {},
                'errors':form.errors ? Object.keys(form.errors).length > 0: false,
                'allowDelete':allowDelete,
                'rootPath': MongooseAdmin.singleton.root
            };
            res.render('document.jade',
                {layout: 'layout.jade',
                    locals: res.locals
                });
            MongooseAdmin.singleton.popExpressConfig(config);
        }
    });
}

exports.document = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.redirect('/login')
    } else {
        if(permissions.hasPermissions(adminUser,req.params.modelName,'update'))
        {
        MongooseAdmin.singleton.getModel(req.params.modelName, function(err, model, fields, options) {
            if (err) {
                res.redirect('/error');
            } else {
                if(model.is_single)
                {
                    model.findOne({},function(err,document)
                    {
                        if(err)
                        {
                            res.redirect('/error');
                        }
                        else
                        {
                            var form_type = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                            var form = new form_type(req,{instance:document},model);
                            render_document_from_form(form,req,res,model.modelName,req.params.modelName,false);
                        }
                    });
                }
                else
                {
                    if (req.params.documentId === 'new') {
                        var form_type = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                        var form = new form_type(req,{},model);
                        render_document_from_form(form,req,res,model.modelName,req.params.modelName,false);
//                                    var html = form.render_str();
//                                    var head = form.render_head();
//
//                                    var config = MongooseAdmin.singleton.pushExpressConfig();
//                                    res.render('document.jade',
//                                        {layout: 'adminlayout.jade',
//                                            locals: {
//                                                'pageTitle': 'Admin - ' + model.modelName,
//                                                'models': models,
//                                                'modelName': req.params.modelName,
//                                                'model': model,
//                                                'fields': fields,
//                                                'renderedDocument': html,
//                                                'renderedHead':head,
//                                                'document': {},
//                                                'allowDelete':false,
//                                                'rootPath': MongooseAdmin.singleton.root
//                                            }
//                                        });
//                                    MongooseAdmin.singleton.popExpressConfig(config);
//                                }                            ;
//                            Renderer.renderDocument(models, fields, options, null, function(html) {
//                           });
                    } else {
                        MongooseAdmin.singleton.getDocument(req.params.modelName, req.params.documentId, function(err, document) {
                            if (err) {
                                res.redirect('/error');
                            } else {
                                var form_type = MongooseAdmin.singleton.models[req.params.modelName].options.form || AdminForm;
                                var form = new form_type(req,{instance:document},model);
                                render_document_from_form(form,req,res,model.modelName,req.params.modelName,true,req.query['clone']);
//                                            var html = form.render_str();
//                                            var head = form.render_head();
//                                            var config = MongooseAdmin.singleton.pushExpressConfig();
//                                            res.render('document.jade',
//                                                {layout: 'adminlayout.jade',
//                                                    locals: {
//                                                        'pageTitle': 'Admin - ' + model.modelName,
//                                                        'models': models,
//                                                        'modelName': req.params.modelName,
//                                                        'model': model,
//                                                        'fields': fields,
//                                                        'renderedDocument': html,
//                                                        'renderedHead':head,
//                                                        'document': document,
//                                                        'allowDelete':false,
//                                                        'rootPath': MongooseAdmin.singleton.root
//                                                    }
//                                                });
//                                            MongooseAdmin.singleton.popExpressConfig(config);
//                                    Renderer.renderDocument(models, fields, options, document, function(html) {
//                                        var config = MongooseAdmin.singleton.pushExpressConfig();
//                                        res.render('document',
//                                                   {layout: 'adminlayout.jade',
//                                                    locals: {
//                                                       'pageTitle': 'Admin - ' + model.modelName,
//                                                       'models': models,
//                                                       'modelName': req.params.modelName,
//                                                       'model': model,
//                                                       'fields': fields,
//                                                       'renderedDocument': html,
//                                                       'document': document,
//                                                       'allowDelete': true,
//                                                       'rootPath': MongooseAdmin.singleton.root
//                                                   }
//                                                 });
//                                        MongooseAdmin.singleton.popExpressConfig(config);
//                                    });
                            }
                        });
                    }
                }
            }
        });
    }
        else
        {
            res.send('no permissions');
        }
    }
};

