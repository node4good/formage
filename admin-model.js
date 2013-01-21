var Class = require('sji'),
    AdminForm = require('./form').AdminForm,
    formage = require('formage'),
    MongooseAdminAudit = require('./mongoose_admin_audit.js').MongooseAdminAudit,
    async = require('async'),
    permissions = require('./permissions'),
    QueryString = require('querystring'),
    Url = require('url'),
    _ = require('underscore');

var AdminModel = module.exports = Class.extend({
    init:function (model, options) {
        options = options || {};
        this.options = options;
        this.model = model || null;
        this.name = options.name || model.name;
        this.form_type = options.form_type || AdminForm;
        this.is_single = options.is_single;
        this.admin = options.admin;
        this.filters = [];
        buildModelFilters(model, options.filters, this.filters);
        options.actions = options.actions || [];
        var self = this;
        options.actions.push({value:'delete', label:'Delete', func:function (user, ids, callback) {
            async.parallel(ids.map(function (id) {
                return function (cbk) {
                    formage.forms.checkDependecies(self.name, id, cbk);
                }
            }), function (err, results) {
                if (err)
                    callback(err);
                else {
                    var no_dependecies = _.filter(ids, function (result, index) {
                        return results[index].length == 0;
                    });
                    model.remove({_id:{$in:no_dependecies}}, callback);
                }
            });
        }});

    },
    index:function (req, res) {
        var self = this;

        // read filters and params

        var query = req.query || QueryString.parse(Url.parse(req.url).query);
        var start = query.start ? parseInt(query.start) : 0;
        var count = query.count ? parseInt(query.count) : 50;

        var filters = {};
        for (var key in query) {
            if (key != 'start' && key != 'count' && key != 'order_by' && key != 'saved' && query[key])
                filters[key] = query[key];
        }

        var sort = query.order_by;

        var search_value = query._search || '';

        if (this.is_single) {
            res.redirect(req.path.split('/model/')[0]);
            return;
        }
        /**
         * Parallel:
         * 1) get documents count
         * 2) get documents
         */
        async.parallel([
            function (cbk) {
                self.count(filters, search_value, cbk);
            },
            function (cbk) {
                self.list(start, count, filters, sort, search_value, cbk);
            }
        ], function (err, results) {
            if (err) {
                res.handle500(err);
                return;
            }
            var total_count = results[0];
            var documents = results[1];
            var makeLink = function (key, value) {
                var query = _.clone(req.query);
                query.start = 0;
                query[key] = value;
                return '?' + _.map(query,function (value, key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
                }).join('&');
            };

            var orderLink = function (key) {
                if (req.query.order_by == key)
                    key = '-' + key;
                return makeLink('order_by', key);
            };
            var config = self.admin.pushExpressConfig();
            res.render('model.jade',
                {layout:'layout.jade',
                    'pageTitle':'Admin - ' + self.modelName,
                    'totalCount':total_count,
                    'modelName':self.modelName,
                    'model':self.model,
                    'start':start,
                    'count':count,
                    'current_filters':req.query,
                    makeLink:makeLink,
                    orderLink:orderLink,
                    'filters':self.filters || [],
                    'adminTitle':self.admin.getAdminTitle(),
                    'listFields':self.options.list,
                    'documents':documents,
                    'search':self.options.search,
                    'search_value':search_value,
                    'actions':self.options.actions || [],
                    'editable':permissions.hasPermissions(req.adminUser, req.params.modelName, 'update'),
                    'sortable':typeof(self.options.sortable) == 'string' &&
                        permissions.hasPermissions(req.adminUser, req.params.modelName, 'order'),
                    'cloneable':typeof(self.options.cloneable) != 'undefined'
                        && (self.options.createable === false ? false : true)
                        && permissions.hasPermissions(req.adminUser, req.params.modelName, 'create'),
                    'createable':(self.options.createable === false ? false : true) && permissions.hasPermissions(req.adminUser, req.params.modelName, 'create'),
                    'rootPath':self.admin.root
                });
            self.admin.popExpressConfig(config);
        });
    },

    documentUpdate:function (req, res, user, document_id, params) {
        var self = this;
        var model = self.model;
        var form_type = self.form_type;
        var form = null;
        async.waterfall([
            function (cbk) {
                model.findById(document_id, function (err, document) {
                    cbk(err, document);
                });
            },
            function (document, cbk) {
                form = new form_type(req, {instance:document, data:params}, model);
                form.is_valid(function (err, valid) {
                    cbk(err || valid);
                });
            },
            function (cbk) {
                form.save(cbk);
            },
            function (document, cbk) {
//
//                MongooseAdminAudit.logActivity(user, self.name, document._id, 'edit', null, function (err, auditLog) {
//                    cbk(null, document);
//                });
                cbk();
            }],
            function (err) {
                if (err) {
                    if (!form)
                        res.handle500(err);
                    else
                        self.renderForm(req, res, null, true, false, form);
                    return;
                }
                res.redirect(req.path.split('/document/')[0] + '?saved=true');
            }
        );
    },
    documentNew:function (req, res, user, params) {
        var self = this;
        var model = self.model;
        var form_type = self.form_type;
        var form = null;
        async.waterfall([
            function (cbk) {
                form = new form_type(req, {data:params}, model);
                form.is_valid(function (err, valid) {
                    cbk(err || !valid);
                });
            },
            function (cbk) {
                form.save(cbk);
            },
            function (document, cbk) {
                form = null;
//                MongooseAdminAudit.logActivity(user, self.name, document._id, 'edit', null, function (err, auditLog) {
//                    cbk(null, document);
//                });
                cbk();
            }],
            function (err) {
                if (err) {
                    if (!form)
                        res.handle500(err);
                    else
                        self.renderForm(req, res, null, true, req.query.clone, form);
                    return;
                }
                res.redirect(req.path.split('/document/')[0] + '?saved=true');
            }
        );
    },

    count:function (filters, search, callback) {
        if (this.is_single) {
            callback(null, 1);
            return;
        }
        this.model.count(this.parseFilters(filters, search), callback);
    },
    list:function (start, limit, filters, sort, search, callback) {
        var listFields = this.options.list;
        if (!listFields) {
            callback(null, []);
            return;
        }
        var model = this.model
        var new_filters = this.parseFilters(filters, search);
        var query = model.find(new_filters);
        var sorts = this.options.order_by || [];
        var populates = this.options.list_populate;
        if (sort)
            sorts.unshift(sort);
        if (sorts) {
            for (var i = 0; i < sorts.length; i++)
                mongooseSort(query, sorts[i]);
        }
        if (populates) {
            populates.forEach(function (populate) {
                query.populate(populate);
            });
        }
        query
            .skip(start)
            .limit(limit)
            .exec(function (err, documents) {
                if (err) {
                    callback(err);
                    return;
                }
                var filteredDocuments = [];
                documents.forEach(function (document) {
                    var d = {};
                    d['_id'] = document['_id'];
                    listFields.forEach(function (listField) {
                        d[listField] = typeof(document[listField]) == 'function' ? document[listField]() : document.get(listField);
                    });
                    filteredDocuments.push(d);
                });

                callback(null, filteredDocuments);
            });
    },
    /**
     * Parse filters from strings to types
     * @param filters
     * dictionary of filters
     * @param search
     * free text search value
     * @return {Object}
     * dict of filters
     */
    parseFilters:function (filters, search) {
        var model = this.model;
        var new_filters = {};
        _.each(filters, function (value, key) {
            if (model.schema && typeof(value) == 'string' && model.schema.paths[key]) {
                var type = model.schema.paths[key].options.type;
                if (type == String)
                    new_filters[key] = new RegExp(value, 'i');
                else if (type == Number)
                    filters[key] = Number(value) || undefined;
                else if (type == Boolean)
                    new_filters[key] = value == 'true' ? true : false;
            }
        });
        if (search && this.options.search) {
            new_filters['$where'] = this.options.search.replace('__value__', escapeRegex(search));
        }
        return new_filters;
    },
    renderForm:function (req, res, document, allow_delete, clone, form) {
        var self = this;
        var new_form_options = _.extend({instance:document}, self.options);
        form = form || new self.form_type(req, new_form_options, self.model);
        if (clone)
            form.exclude.push('id');
        form.render_ready(function (err) {
            if (err)
                res.redirect('/error');
            else {
                var html = form.render_str();
                var head = form.render_head();
                var config = self.admin.pushExpressConfig();
                res.render('document.jade',
                    {layout:'layout.jade',
                        'pageTitle':'Admin - ' + self.modelName,
                        'modelName':self.modelName,
                        'collectionName':self.modelName,
                        'renderedDocument':html,
                        'renderedHead':head,
                        'adminTitle':self.admin.getAdminTitle(),
                        'document':{},
                        'errors':form.errors ? Object.keys(form.errors).length > 0 : false,
                        'allowDelete':allow_delete,
                        'rootPath':self.admin.root
                    });
                self.admin.popExpressConfig(config);
            }
        });
    },
    getSingle:function (cbk) {
        this.model.findOne({}, cbk);
    },
    getDocument:function (id, cbk) {
        this.model.findById(id, cbk);
    },
    document:function (req, res) {
        var self = this;
        var model = this.model;
        if (self.is_single) {
            self.getSingle(function (err, document) {
                if (err) {
                    res.redirect('/error');
                    return;
                }
                self.renderForm(req, res, document);
            });
        }
        else {
            if (req.params.documentId === 'new')
                self.renderForm(req, res);
            else {
                self.getDocument(req.params.documentId, function (err, document) {
                    if (err) {
                        res.handle500(err);
                        return;
                    }
                    self.renderForm(req, res, document, true, req.query['clone']);
                });
            }
        }
    },
    performAction:function (user, actionId, ids, callback) {
        var action = _.find(this.options.actions, function (action) {
            return action.value == actionId;
        });
        if (action)
            action.func(user, ids, callback);
        else
            callback('not found');
    },
    action:function (req, res) {
        var actionId = req.params.actionId;
        var ids = req.body.ids;
        this.performAction(req.adminUser, actionId, ids, function (err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type":"application/json"});
                res.write(JSON.stringify({"collection":req.params.collectionName}));
                res.end();
            }
        });
    },
    performOrder:function (data) {
        var sorting_attr = this.options.sortable;
        if (sorting_attr) {
            for (var id in data) {
                var set_dict = {};
                set_dict[sorting_attr] = data[id];
                this.model.update({_id:id}, {$set:set_dict}, function (err) {
                    console.error('error ordering ', err);
                });
            }
        }
    },
    order:function (req, res) {
        this.performOrder(req.body);
        res.writeHead(200, {"Content-Type":"application/json"});
        res.write(JSON.stringify({"collection":this.name}));
        res.end();
    },
    'delete':function (req, res) {
        var query = QueryString.parse(Url.parse(req.url).query);
        var self = this;
        this.model.findById(query.document_id, function (err, document) {
            if (err) {
                res.handle500(err);
                return;
            }
            if (!document) {
                res.handle404();
                return;
            }
            formage.forms.unlinkDependencies(self.modelName, query.document_id, function (err) {
                if (err) {
                    res.handle500(err);
                    return;
                }
                document.remove();
                res.send('ok');
//                MongooseAdminAudit.logActivity(req.adminUser, self.name, collectionName, documentId, 'del', null, function(err, auditLog) {
//                    onReady(null);
//                });
            });
        });
    }
});

function escapeRegex(a) {
    return a.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

mongoose = require('mongoose');

var IS_OLD_MONGOOSE = mongoose.version.split('.')[0] * 1 < 3;

function mongooseSort(query, sort) {
    if (IS_OLD_MONGOOSE) {
        if (sort.indexOf('-') == 0)
            query.sort(sort.slice(1), 'descending');
        else
            query.sort(sort, 'ascending');
    }
    else
        query.sort(sort);
}

function buildModelFilters(model, filters, dict) {
    if (!filters)
        return;
    setTimeout(function () {
        async.forEach(filters, function (filter, cbk) {
            model.collection.distinct(filter, function (err, results) {
                if (results) {
                    if (results[0] && Array.isArray(results[0])) {
                        results = _.flatten(results);
                    }
                    if (results.length > 30)
                        results.splice(5);
                    if (model.schema.paths[filter] && model.schema.paths[filter].options.ref) {
                        mongoose.model(model.schema.paths[filter].options.ref).find()
                            .where('_id').in(results).exec(function (err, refs) {
                                if (refs)
                                    dict.push({key:filter, isString:false, values:_.map(refs, function (ref) {
                                        return { value:ref.id, text:ref.toString()};
                                    }) });
                                cbk(err);
                            })
                    }
                    else {
                        dict.push({key:filter, values:_.map(results, function (result) {
                            return { value:result, text:result, isString:model.schema.paths[filter] && model.schema.paths[filter].options && model.schema.paths[filter].options.type == String };
                        })});
                        cbk();
                    }
                }
                else
                    cbk(err);
            })

        }, function () {
        })
    }, 1000);
};