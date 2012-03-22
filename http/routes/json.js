var querystring = require('querystring'),
    Url = require('url'),
    sys = require('sys'),
    forms = require('../../../node-forms/forms'),
    MongooseAdmin = require('../../mongoose-admin');


exports.login = function(req, res) {
    MongooseAdmin.singleton.login(req.body.username, req.body.password, function(err, adminUser) {
        if (err) {
            res.writeHead(500);
            res.end();
        } else {
            if (!adminUser) {
                res.writeHead(401);
                res.end();
            } else {
                req.session._mongooseAdminUser = adminUser.toSessionStore();
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write("{}");
                res.end();
            }
        }
    });
};

exports.documents = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        var query = querystring.parse(Url.parse(req.url).query);
        MongooseAdmin.singleton.modelCounts(query.collection, function(err, totalCount) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                MongooseAdmin.singleton.listModelDocuments(query.collection, query.start, query.count, function(err, documents) {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    } else {
                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.write(JSON.stringify({'totalCount': totalCount, 'documents': documents}));
                        res.end();
                    }
                });
            }
        });
    }
};

exports.checkDependencies = function(req,res)
{
    var modelName = req.body.model;
    var id = req.body.id;
    forms.checkDependecies(modelName,id,function(err,results)
    {
        var json = [];
        for(var i=0; i<results.length; i++)
        {
            json.push(results[i].name || results[i].title || results[i].toString());
        }
        res.json(json,200);
    });
};

exports.createDocument = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.createDocument(req,adminUser, req.params.collectionName, req.body, function(err, document) {
            if (err) {
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
                res.writeHead(201, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    }
};

exports.updateDocument = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.updateDocument(req,adminUser, req.params.collectionName, req.body._id, req.body, function(err, document) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    }
};

exports.orderDocuments = function(req,res)
{
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.orderDocuments(adminUser, req.params.collectionName, req.body, function(err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    }
};

exports.deleteDocument = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        var query = querystring.parse(Url.parse(req.url).query);
        MongooseAdmin.singleton.deleteDocument(adminUser, req.params.collectionName, query.document_id, function(err) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify({"collection": req.params.collectionName}));
                res.end();
            }
        });
    }
};

exports.linkedDocumentsList = function(req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.getModel(req.params.collectionName, function(err, model, fields, options) {
            if (err) {
                res.writeHead(500);
                res.end();
            } else {
                MongooseAdmin.singleton.listModelDocuments(req.params.collectionName, 0, 500, function(err, documents) {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    } else {
                        var result = [];
                        documents.forEach(function(document) {
                            var d = {'_id': document._id};
                            options.list.forEach(function(listField) {
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
}
