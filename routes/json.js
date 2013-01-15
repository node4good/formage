'use strict';
var querystring = require('querystring'),
    Url = require('url'),
    _ = require('underscore'),
    forms = require('formage').forms;


var MongooseAdmin;
exports.setAdmin = function (admin) {
    MongooseAdmin = admin;
};


exports.login = function (req, res, next) {
    MongooseAdmin.singleton.login(req.body.username, req.body.password, function (err, adminUser) {
        if (err) return next(err);

        if (!adminUser) return res.send(401, 'Not authorized');

        req.session._mongooseAdminUser = adminUser.toSessionStore();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write("{}");
        return res.end();
    });
};


exports.documents = function (req, res) {
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
};


exports.checkDependencies = function (req, res) {
    var modelName = req.body.model;
    var id = req.body.id;
    forms.checkDependecies(modelName, id, function (err, results) {
        var json = _.map(results, function (result) {
            return result.name || result.title || result.toString();
        });
        res.json(json, 200);
    });
};


exports.createDocument = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.createDocument(req, adminUser, req.params.collectionName, req.body, function (err, document) {
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
    }
};


exports.updateDocument = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        MongooseAdmin.singleton.updateDocument(req, adminUser, req.params.collectionName, req.body._id, req.body, function (err, document) {
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

exports.orderDocuments = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
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
    }
};

exports.actionDocuments = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
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
    }
}

exports.deleteDocument = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
        var query = querystring.parse(Url.parse(req.url).query);
        MongooseAdmin.singleton.deleteDocument(adminUser, req.params.collectionName, query.document_id, function (err) {
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

exports.linkedDocumentsList = function (req, res) {
    var adminUser = req.session._mongooseAdminUser ? MongooseAdmin.userFromSessionStore(req.session._mongooseAdminUser) : null;
    if (!adminUser) {
        res.writeHead(401, {"Content-Type": "application/json"});
        res.end();
        return;
    } else {
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
}
